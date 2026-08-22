import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UserInputForm } from './components/UserInputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AdSenseLoadingOverlay } from './components/AdSenseLoadingOverlay';
import { AdminPanel } from './components/AdminPanel';
import { DesignStudio } from './components/DesignStudio';
import {
    generateVisualizations,
    generateMasterTemplate,
    generateMaterialDetails,
    generateProjectPackage,
    createVirtualPlanFromDimensions
} from './services/geminiService';
import { generateDeterministicProjectPlan } from './services/deterministicEstimate';
import { addHistoricalDetailed } from './utils/adminStorage';
import { AppState, ProjectDetails, GeneratedPlan } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INPUT);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [isometricView, setIsometricView] = useState<{ data: string; mimeType: string; } | null>(null);
  const [perspectiveView, setPerspectiveView] = useState<{ data: string; mimeType: string; } | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModifying, setIsModifying] = useState<boolean>(false);
  const [loadingSection, setLoadingSection] = useState<'materials' | 'package' | 'report' | 'schedule' | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const processProject = async (details: ProjectDetails) => {
      setProjectDetails(details);
      setError(null);
      setGeneratedPlan(null);
      const skip3D = !details.wants3DGeneration;

      try {
        setAppState(AppState.ANALYZING_PLAN);
        let virtualPlan;

        if (details.projectScope === 'bathroom' &&
            details.bathroomSpecifics?.useDimensionsOnly &&
            details.bathroomSpecifics.width &&
            details.bathroomSpecifics.depth) {
            virtualPlan = createVirtualPlanFromDimensions(
                details.bathroomSpecifics.width,
                details.bathroomSpecifics.depth,
                'BATHROOM'
            );
        } else {
            const areaM2 = Math.max(1, Number(details.area || 1)) * 3.3058;
            const side = Math.sqrt(areaM2);
            const roomType = details.projectScope === 'bathroom' ? 'BATHROOM' : 'LIVING_ROOM';
            virtualPlan = createVirtualPlanFromDimensions(side, side, roomType);
        }

        const detailsWithPlan = { ...details, virtualPlan };
        setProjectDetails(detailsWithPlan);

        if (skip3D) {
            await handleFinalizeLogic(detailsWithPlan);
        } else {
            setAppState(AppState.GENERATING_VIEWS);
            const { isometricView, perspectiveView } = await generateVisualizations(
                virtualPlan,
                details.image,
                details.modelType,
                true,
                details.projectScope
            );
            setIsometricView(isometricView);
            setPerspectiveView(perspectiveView);
            setAppState(AppState.DESIGN_STUDIO);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`견적 준비 중 오류가 발생했습니다: ${errorMessage}`);
        setAppState(AppState.INPUT);
        console.error(err);
      }
  };

  const handleFinalizeLogic = async (details: ProjectDetails) => {
      setAppState(AppState.FINALIZING);
      try {
        const basicPlan = generateDeterministicProjectPlan(details);

        if (details.projectScope === 'bathroom' || details.projectScope === 'sash') {
            const totalPrice = basicPlan.costEstimate.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
            const summary = basicPlan.designConcept.description.substring(0, 100) + '...';
            addHistoricalDetailed({
                id: `hist_${Date.now()}`,
                type: details.projectScope,
                area: details.area,
                buildingType: details.buildingType,
                totalPrice,
                summary,
                timestamp: new Date().toISOString()
            });
        }

        setGeneratedPlan(basicPlan);
        setAppState(AppState.RESULTS);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`견적 생성 중 오류가 발생했습니다: ${errorMessage}`);
        setAppState(AppState.INPUT);
      }
  };

  const handleInitialSubmit = useCallback(async (details: ProjectDetails) => {
    await processProject(details);
  }, []);

  const handleStyleModification = useCallback(async (viewToModify: 'iso' | 'pers') => {
    const baseImage = viewToModify === 'iso' ? isometricView : perspectiveView;
    if (!projectDetails || !baseImage) return;
    setIsModifying(true);
    setError(null);
    try {
        if (viewToModify === 'iso') setIsometricView({ ...baseImage });
        else setPerspectiveView({ ...baseImage });
    } finally {
        setIsModifying(false);
    }
  }, [projectDetails, isometricView, perspectiveView]);

  const handleFinalizeDesign = useCallback(async () => {
    if (!projectDetails) return;
    const finalDetails = {
      ...projectDetails,
      isometricView: isometricView || undefined,
      perspectiveView: perspectiveView || undefined
    };
    setProjectDetails(finalDetails);
    await handleFinalizeLogic(finalDetails);
  }, [projectDetails, isometricView, perspectiveView]);

  const handleLoadMaterials = async () => {
      if (!projectDetails || !generatedPlan) return;
      setLoadingSection('materials');
      try {
          const { sheet, prompts } = await generateMaterialDetails({ ...projectDetails, isDemo: true });
          setGeneratedPlan(prev => prev ? { ...prev, materialDetailSheet: sheet, materialBoardPrompts: prompts } : null);
      } catch (e) {
          console.warn('Stored material detail fallback unavailable', e);
      } finally {
          setLoadingSection(null);
      }
  };

  const handleLoadSchedule = async () => {
      if (!generatedPlan) return;
      setLoadingSection('schedule');
      setGeneratedPlan(prev => prev ? { ...prev, projectSchedule: prev.projectSchedule || [] } : null);
      setLoadingSection(null);
  };

  const handleLoadPackage = async () => {
      if (!projectDetails || !generatedPlan) return;
      setLoadingSection('package');
      try {
           const projectPackage = await generateProjectPackage({ ...projectDetails, isDemo: true });
           setGeneratedPlan(prev => prev ? { ...prev, projectPackage } : null);
      } catch (e) {
          console.warn('Stored project package fallback unavailable', e);
      } finally {
          setLoadingSection(null);
      }
  };

  const handleLoadMasterTemplate = async () => {
      if (!projectDetails || !generatedPlan) return;
      setLoadingSection('report');
      try {
          const masterTemplate = await generateMasterTemplate({ ...projectDetails, isDemo: true }, generatedPlan);
          setGeneratedPlan(prev => prev ? { ...prev, masterTemplate } : null);
      } catch (e) {
          console.warn('Stored report fallback unavailable', e);
      } finally {
          setLoadingSection(null);
      }
  };

  const handleReset = useCallback(() => {
    setAppState(AppState.INPUT);
    setProjectDetails(null);
    setGeneratedPlan(null);
    setIsometricView(null);
    setPerspectiveView(null);
    setError(null);
    setLoadingSection(null);
  }, []);

  const renderContent = () => {
    const isBathroomMode = projectDetails?.projectScope === 'bathroom';

    switch (appState) {
      case AppState.INPUT:
        return <UserInputForm onSubmit={handleInitialSubmit} error={error} />;
      case AppState.ANALYZING_PLAN:
        return (
          <AdSenseLoadingOverlay
            message={isBathroomMode ? '욕실 치수·물량 준비 중...' : '면적·선택 공종 기준 물량 준비 중...'}
            subMessage="저장된 견적 템플릿과 입력값으로 API 없이 계산합니다."
          />
        );
      case AppState.GENERATING_VIEWS:
        return (
          <AdSenseLoadingOverlay
            message="로컬 3D 프리뷰 준비 중..."
            subMessage="MVP에서는 외부 생성형 API를 호출하지 않고 안전한 프리뷰를 사용합니다."
          />
        );
      case AppState.DESIGN_STUDIO:
        if (projectDetails && isometricView && perspectiveView) {
             return (
              <DesignStudio
                projectDetails={projectDetails}
                isometricView={isometricView}
                perspectiveView={perspectiveView}
                onModifyStyle={handleStyleModification}
                onFinalize={handleFinalizeDesign}
                isModifying={isModifying}
                onBack={handleReset}
                error={error}
              />
            );
        }
        return <LoadingSpinner />;
      case AppState.FINALIZING:
        return (
           <AdSenseLoadingOverlay
            message="최종 실행견적 산출 중..."
            subMessage="PTPL-PAUL-EXPERT-V1 → T2_INTERIOR_ESTIMATE_RENDER_V2 기준으로 물량·BOM·인건비를 결정형 계산합니다."
          />
        );
      case AppState.RESULTS:
        return generatedPlan && projectDetails && (
          <ResultsDisplay
            plan={generatedPlan}
            details={projectDetails}
            onReset={handleReset}
            onLoadMasterTemplate={handleLoadMasterTemplate}
            onLoadMaterials={handleLoadMaterials}
            onLoadSchedule={handleLoadSchedule}
            onLoadPackage={handleLoadPackage}
            loadingSection={loadingSection}
          />
        );
      default:
        return <UserInputForm onSubmit={handleInitialSubmit} error={error} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800">
      <Header onOpenAdmin={() => setShowAdmin(true)} />
      <main className="flex-grow container mx-auto px-4 py-8 relative">
        {renderContent()}
      </main>
      <Footer />
      {showAdmin && (
        <AdminPanel
            onClose={() => setShowAdmin(false)}
            initialAddress={projectDetails?.address}
        />
      )}
    </div>
  );
};

export default App;

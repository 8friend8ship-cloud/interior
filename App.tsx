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
    generateProjectPlan,
    generateVisualizations,
    analyzeFloorplan,
    modifyImageStyle,
    generateMasterTemplate,
    generateMaterialDetails,
    generateProjectPackage,
    generateProjectSchedule,
    createVirtualPlanFromDimensions
} from './services/geminiService';
import { addHistoricalDetailed } from './utils/adminStorage';
import { AppState, ProjectDetails, GeneratedPlan } from './types';

const MVP_TEST_MODE = true;

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

      const isDemo = details.isDemo === true;
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
            if (isDemo) await new Promise(resolve => setTimeout(resolve, 500));
        } else {
            try {
                virtualPlan = await analyzeFloorplan(details.image, isDemo);
            } catch (analysisError) {
                console.warn('Floorplan analysis failed; using area fallback.', analysisError);
                const areaM2 = details.area * 3.3058;
                const side = Math.sqrt(areaM2);
                const roomType = details.projectScope === 'bathroom' ? 'BATHROOM' : 'LIVING_ROOM';
                virtualPlan = createVirtualPlanFromDimensions(side, side, roomType);
            }
        }

        const detailsWithPlan = { ...details, virtualPlan };
        setProjectDetails(detailsWithPlan);

        if (skip3D) {
            await handleFinalizeLogic(detailsWithPlan);
        } else {
            setAppState(AppState.GENERATING_VIEWS);
            const views = await generateVisualizations(
                virtualPlan,
                details.image,
                details.modelType,
                isDemo,
                details.projectScope
            );
            setIsometricView(views.isometricView);
            setPerspectiveView(views.perspectiveView);
            setAppState(AppState.DESIGN_STUDIO);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`MVP 처리 중 오류가 발생했습니다: ${errorMessage}`);
        setAppState(AppState.INPUT);
        console.error(err);
      }
  };

  const handleFinalizeLogic = async (details: ProjectDetails) => {
      setAppState(AppState.FINALIZING);
      try {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('처리 시간이 초과되었습니다.')), 120000)
        );
        const logicPromise = generateProjectPlan(details, undefined, false);
        const basicPlan = await Promise.race([logicPromise, timeoutPromise]) as GeneratedPlan;

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
    await processProject({ ...details, isDemo: MVP_TEST_MODE ? true : details.isDemo });
  }, []);

  const handleStyleModification = useCallback(async (viewToModify: 'iso' | 'pers', prompt: string) => {
    const baseImage = viewToModify === 'iso' ? isometricView : perspectiveView;
    if (!projectDetails || !baseImage) return;

    setIsModifying(true);
    setError(null);
    try {
        const modifiedImage = await modifyImageStyle(
            baseImage,
            prompt,
            projectDetails.virtualPlan,
            projectDetails.modelType,
            MVP_TEST_MODE ? true : projectDetails.isDemo
        );
        if (viewToModify === 'iso') setIsometricView(modifiedImage);
        else setPerspectiveView(modifiedImage);
    } catch (err) {
        setError('스타일 변경에 실패했습니다.');
        console.error(err);
    } finally {
        setIsModifying(false);
    }
  }, [projectDetails, isometricView, perspectiveView]);

  const handleFinalizeDesign = useCallback(async () => {
    if (!projectDetails) return;
    const finalDetails = {
      ...projectDetails,
      isDemo: MVP_TEST_MODE ? true : projectDetails.isDemo,
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
      } finally { setLoadingSection(null); }
  };

  const handleLoadSchedule = async () => {
      if (!projectDetails || !generatedPlan) return;
      setLoadingSection('schedule');
      try {
          const schedule = await generateProjectSchedule({ ...projectDetails, isDemo: true });
          setGeneratedPlan(prev => prev ? { ...prev, projectSchedule: schedule } : null);
      } finally { setLoadingSection(null); }
  };

  const handleLoadPackage = async () => {
      if (!projectDetails || !generatedPlan) return;
      setLoadingSection('package');
      try {
           const projectPackage = await generateProjectPackage({ ...projectDetails, isDemo: true });
           setGeneratedPlan(prev => prev ? { ...prev, projectPackage } : null);
      } finally { setLoadingSection(null); }
  };

  const handleLoadMasterTemplate = async () => {
      if (!projectDetails || !generatedPlan) return;
      setLoadingSection('report');
      try {
          const masterTemplate = await generateMasterTemplate({ ...projectDetails, isDemo: true }, generatedPlan);
          setGeneratedPlan(prev => prev ? { ...prev, masterTemplate } : null);
      } finally { setLoadingSection(null); }
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
        return <AdSenseLoadingOverlay message={isBathroomMode ? '욕실 구조 및 치수 계산 중...' : '공간 구조 계산 중...'} subMessage="MVP 로컬/백데이터 모드로 처리합니다. 사용자 API 키는 필요하지 않습니다." />;
      case AppState.GENERATING_VIEWS:
        return <AdSenseLoadingOverlay message="MVP 시각화 준비 중..." subMessage="키 없는 데모 자산으로 화면 흐름을 검증합니다." />;
      case AppState.DESIGN_STUDIO:
        if (projectDetails && isometricView && perspectiveView) {
          return <DesignStudio projectDetails={projectDetails} isometricView={isometricView} perspectiveView={perspectiveView} onModifyStyle={handleStyleModification} onFinalize={handleFinalizeDesign} isModifying={isModifying} onBack={handleReset} error={error} />;
        }
        return <LoadingSpinner />;
      case AppState.FINALIZING:
        return <AdSenseLoadingOverlay message="MVP 견적 조립 중..." subMessage="저장된 템플릿/데모 데이터를 사용합니다." />;
      case AppState.RESULTS:
        return generatedPlan && projectDetails && <ResultsDisplay plan={generatedPlan} details={projectDetails} onReset={handleReset} onLoadMasterTemplate={handleLoadMasterTemplate} onLoadMaterials={handleLoadMaterials} onLoadSchedule={handleLoadSchedule} onLoadPackage={handleLoadPackage} loadingSection={loadingSection} />;
      default:
        return <UserInputForm onSubmit={handleInitialSubmit} error={error} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800">
      <div className="bg-emerald-700 text-white text-center text-xs font-bold py-2">MVP TEST · 로그인 없음 · 사용자 API 키 없음 · 중앙 백데이터 연결</div>
      <Header onOpenAdmin={() => { if (!MVP_TEST_MODE) setShowAdmin(true); }} />
      <main className="flex-grow container mx-auto px-4 py-8 relative">{renderContent()}</main>
      <Footer />
      {!MVP_TEST_MODE && showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} initialAddress={projectDetails?.address} />}
    </div>
  );
};

export default App;

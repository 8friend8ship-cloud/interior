import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UserInputForm } from './components/UserInputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AdSenseLoadingOverlay } from './components/AdSenseLoadingOverlay';
import { AdminPanel } from './components/AdminPanel';
import { DesignStudio } from './components/DesignStudio';
import { EstimateMarketplaceMode } from './components/EstimateMarketplaceMode';
import { ProjectDomainMode } from './components/ProjectDomainMode';
import { EstimateTemplateSummary } from './components/EstimateTemplateSummary';
import { ConnectedEstimateDetails } from './components/ConnectedEstimateDetails';
import {
    generateVisualizations,
    generateMasterTemplate,
    generateMaterialDetails,
    generateProjectPackage,
    createVirtualPlanFromDimensions
} from './services/geminiService';
import { generateDeterministicProjectPlan } from './services/deterministicEstimate';
import { loadMarketplaceContext, saveMarketplaceContext } from './services/estimateMarketplace';
import {
    fetchInteriorEstimateBundle,
    fetchInteriorMaterials,
    fetchInteriorRender,
    mergeBridgeEstimate,
    extractBridgeMaterials,
    extractBridgeRender,
    InteriorBridgeResult,
} from './services/interiorBackdataBridge';
import { addHistoricalDetailed } from './utils/adminStorage';
import { AppState, ProjectDetails, GeneratedPlan } from './types';
import { EstimateMarketplaceContext } from './contracts/estimateMarketplace';

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
  const [bridgeStatus, setBridgeStatus] = useState<InteriorBridgeResult | null>(null);
  const [marketplaceContext, setMarketplaceContext] = useState<EstimateMarketplaceContext>(() => loadMarketplaceContext());

  const handleMarketplaceChange = useCallback((context: EstimateMarketplaceContext) => {
    setMarketplaceContext(context);
    saveMarketplaceContext(context);
  }, []);

  const processProject = async (details: ProjectDetails) => {
      setProjectDetails(details);
      setError(null);
      setGeneratedPlan(null);
      setBridgeStatus(null);
      saveMarketplaceContext(marketplaceContext);
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

            const bridgeRender = await fetchInteriorRender(detailsWithPlan, marketplaceContext);
            const connectedRender = extractBridgeRender(bridgeRender);
            setBridgeStatus(bridgeRender);

            if (connectedRender.isometricView && connectedRender.perspectiveView) {
              setIsometricView(connectedRender.isometricView);
              setPerspectiveView(connectedRender.perspectiveView);
            } else {
              const liveViews = await generateVisualizations(
                  virtualPlan,
                  details.image,
                  details.modelType,
                  details.isDemo === true,
                  details.projectScope
              );
              setIsometricView(liveViews.isometricView);
              setPerspectiveView(liveViews.perspectiveView);
            }
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
        const deterministicPlan = generateDeterministicProjectPlan(details);
        const bridgeEstimate = await fetchInteriorEstimateBundle(details, marketplaceContext);
        const finalPlan = mergeBridgeEstimate(deterministicPlan, bridgeEstimate);
        setBridgeStatus(bridgeEstimate);

        if (details.projectScope === 'bathroom' || details.projectScope === 'sash') {
            const totalPrice = finalPlan.costEstimate.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
            const summary = finalPlan.designConcept.description.substring(0, 100) + '...';
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

        setGeneratedPlan(finalPlan);
        setAppState(AppState.RESULTS);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`견적 생성 중 오류가 발생했습니다: ${errorMessage}`);
        setAppState(AppState.INPUT);
      }
  };

  const handleInitialSubmit = useCallback(async (details: ProjectDetails) => {
    saveMarketplaceContext(marketplaceContext);
    await processProject(details);
  }, [marketplaceContext]);

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
  }, [projectDetails, isometricView, perspectiveView, marketplaceContext]);

  const handleLoadMaterials = async () => {
      if (!projectDetails || !generatedPlan) return;
      setLoadingSection('materials');
      try {
          const bridgeMaterials = await fetchInteriorMaterials(projectDetails, marketplaceContext);
          const connectedMaterials = extractBridgeMaterials(bridgeMaterials);
          setBridgeStatus(bridgeMaterials);
          if (connectedMaterials.length > 0) {
            setGeneratedPlan(prev => prev ? { ...prev, materialDetailSheet: connectedMaterials } : null);
          } else {
            const { sheet, prompts } = await generateMaterialDetails({ ...projectDetails, isDemo: projectDetails.isDemo === true });
            setGeneratedPlan(prev => prev ? { ...prev, materialDetailSheet: sheet, materialBoardPrompts: prompts } : null);
          }
      } catch (e) {
          console.warn('Material bridge/enrichment unavailable', e);
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
           const projectPackage = await generateProjectPackage({ ...projectDetails, isDemo: projectDetails.isDemo === true });
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
          const masterTemplate = await generateMasterTemplate({ ...projectDetails, isDemo: projectDetails.isDemo === true }, generatedPlan);
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
    setBridgeStatus(null);
    setError(null);
    setLoadingSection(null);
  }, []);

  const renderContent = () => {
    const isBathroomMode = projectDetails?.projectScope === 'bathroom';

    switch (appState) {
      case AppState.INPUT:
        return (
          <>
            <EstimateMarketplaceMode value={marketplaceContext} onChange={handleMarketplaceChange} />
            <ProjectDomainMode value={marketplaceContext} onChange={handleMarketplaceChange} />
            <UserInputForm onSubmit={handleInitialSubmit} error={error} />
          </>
        );
      case AppState.ANALYZING_PLAN:
        return (
          <AdSenseLoadingOverlay
            message={isBathroomMode ? '욕실 치수·물량 준비 중...' : '면적·선택 공종 기준 물량 준비 중...'}
            subMessage={`${marketplaceContext.projectDomain || 'RESIDENTIAL_INTERIOR'} 전용 백데이터와 공종 coverage를 우선 확인합니다. 부족한 항목은 다른 도메인 단가로 대체하지 않습니다.`}
          />
        );
      case AppState.GENERATING_VIEWS:
        return (
          <AdSenseLoadingOverlay
            message="아이소·투시도 준비 중..."
            subMessage="렌더 브릿지를 먼저 확인하고 사용 가능한 연결이 없을 때만 설정된 이미지 생성 경로를 사용합니다."
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
            message="최종 상세견적 산출 중..."
            subMessage="선택한 프로젝트 도메인의 Queens/Seed/T1/T2 백데이터를 우선 병합하고 자재·인건비·경비·BOM·공정 근거를 함께 구성합니다."
          />
        );
      case AppState.RESULTS:
        return generatedPlan && projectDetails && (
          <>
            <EstimateTemplateSummary context={marketplaceContext} />
            <ConnectedEstimateDetails plan={generatedPlan} bridgeStatus={bridgeStatus} />
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
          </>
        );
      default:
        return (
          <>
            <EstimateMarketplaceMode value={marketplaceContext} onChange={handleMarketplaceChange} />
            <ProjectDomainMode value={marketplaceContext} onChange={handleMarketplaceChange} />
            <UserInputForm onSubmit={handleInitialSubmit} error={error} />
          </>
        );
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

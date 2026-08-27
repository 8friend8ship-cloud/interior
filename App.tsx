import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UserInputForm } from './components/UserInputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AdSenseLoadingOverlay } from './components/AdSenseLoadingOverlay';
import { DesignStudio } from './components/DesignStudio';
import { EstimateMarketplaceMode } from './components/EstimateMarketplaceMode';
import { EstimateTemplateSummary } from './components/EstimateTemplateSummary';
import { ConnectedEstimateDetails } from './components/ConnectedEstimateDetails';
import { SiteContextInput } from './components/SiteContextInput';
import { createVirtualPlanFromDimensions } from './services/virtualPlan';
import { generateDeterministicProjectPlan } from './services/deterministicEstimate';
import { loadMarketplaceContext, saveMarketplaceContext } from './services/estimateMarketplace';
import {
    fetchInteriorEstimateBundle,
    fetchInteriorMaterials,
    fetchInteriorRender,
    fetchInteriorSchedule,
    mergeBridgeEstimate,
    extractBridgeMaterials,
    extractBridgeRender,
    InteriorBridgeResult,
} from './services/interiorBackdataBridge';
import { addHistoricalDetailed } from './utils/adminStorage';
import { AppState, ProjectDetails, GeneratedPlan } from './types';
import { EstimateMarketplaceContext } from './contracts/estimateMarketplace';
import type { InteriorSiteContext } from './contracts/siteContext';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INPUT);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [isometricView, setIsometricView] = useState<{ data: string; mimeType: string; } | null>(null);
  const [perspectiveView, setPerspectiveView] = useState<{ data: string; mimeType: string; } | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModifying, setIsModifying] = useState<boolean>(false);
  const [loadingSection, setLoadingSection] = useState<'materials' | 'package' | 'report' | 'schedule' | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<InteriorBridgeResult | null>(null);
  const [marketplaceContext, setMarketplaceContext] = useState<EstimateMarketplaceContext>(() => loadMarketplaceContext());
  const [siteContext, setSiteContext] = useState<InteriorSiteContext | null>(null);

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

        // Never invent a square floorplan from area alone. Only customer-entered
        // verified dimensions create a local virtual plan. Plan/photo analysis is
        // delegated to the audited Interior backend/bridge.
        const virtualPlan = (
          details.projectScope === 'bathroom' &&
          details.bathroomSpecifics?.useDimensionsOnly &&
          details.bathroomSpecifics.width &&
          details.bathroomSpecifics.depth
        ) ? createVirtualPlanFromDimensions(
              details.bathroomSpecifics.width,
              details.bathroomSpecifics.depth,
              'BATHROOM'
            ) : undefined;

        const detailsWithPlan = virtualPlan ? { ...details, virtualPlan } : details;
        setProjectDetails(detailsWithPlan);

        if (skip3D) {
            await handleFinalizeLogic(detailsWithPlan);
        } else {
            setAppState(AppState.GENERATING_VIEWS);
            const bridgeRender = await fetchInteriorRender(detailsWithPlan, marketplaceContext);
            const connectedRender = extractBridgeRender(bridgeRender);
            setBridgeStatus(bridgeRender);

            if (!bridgeRender.ok || !connectedRender.isometricView || !connectedRender.perspectiveView) {
              throw new Error('검증된 Interior Render 결과가 없습니다. 브라우저 AI/Mock 이미지로 대체하지 않습니다.');
            }

            setIsometricView(connectedRender.isometricView);
            setPerspectiveView(connectedRender.perspectiveView);
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
        const finalPlan = mergeBridgeEstimate(deterministicPlan, bridgeEstimate, Number(details.area || 0));
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
    const detailsWithSite = siteContext ? { ...details, siteContext } : details;
    await processProject(detailsWithSite);
  }, [marketplaceContext, siteContext]);

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
            setError('검증된 공용 자재 백데이터가 부족합니다. 임의 AI 자재를 생성하지 않고 Queens 보충 대상으로 유지합니다.');
          }
      } catch (e) {
          setError('자재 백데이터 브릿지 연결을 확인할 수 없습니다. 검증되지 않은 자재 목록은 생성하지 않습니다.');
          console.warn('Material bridge unavailable', e);
      } finally {
          setLoadingSection(null);
      }
  };

  const handleLoadSchedule = async () => {
      if (!projectDetails || !generatedPlan) return;
      setLoadingSection('schedule');
      try {
          const bridgeSchedule = await fetchInteriorSchedule(projectDetails, marketplaceContext);
          setBridgeStatus(bridgeSchedule);
          const value = bridgeSchedule.data?.data ?? bridgeSchedule.data ?? {};
          const schedule = value.projectSchedule || value.schedule || value.items || value.result || [];
          if (bridgeSchedule.ok && Array.isArray(schedule) && schedule.length > 0) {
              setGeneratedPlan(prev => prev ? { ...prev, projectSchedule: schedule } : null);
          } else {
              setError('검증된 공정표가 아직 없습니다. 범위·수량·현장조건이 확인된 후 공정표를 생성합니다.');
          }
      } catch (e) {
          setError('공정표 브릿지 연결을 확인할 수 없습니다. 임의 공정표를 만들지 않습니다.');
          console.warn('Schedule bridge unavailable', e);
      } finally {
          setLoadingSection(null);
      }
  };

  const handleLoadPackage = async () => {
      setLoadingSection('package');
      setError('입찰/프로젝트 패키지는 검증된 T2 결과 기반 전용 adapter 연결 후 제공됩니다. 브라우저 생성형 AI로 우회하지 않습니다.');
      setLoadingSection(null);
  };

  const handleLoadMasterTemplate = async () => {
      setLoadingSection('report');
      setError('보고서는 검증된 Interior 결과를 NotebookLM/Report adapter로 넘기는 선택 출력입니다. 견적 Core와 분리하여 연결합니다.');
      setLoadingSection(null);
  };

  const handleReset = useCallback(() => {
    setAppState(AppState.INPUT);
    setProjectDetails(null);
    setGeneratedPlan(null);
    setIsometricView(null);
    setPerspectiveView(null);
    setBridgeStatus(null);
    setSiteContext(null);
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
            <SiteContextInput value={siteContext} onChange={setSiteContext} />
            <UserInputForm onSubmit={handleInitialSubmit} error={error} />
          </>
        );
      case AppState.ANALYZING_PLAN:
        return (
          <AdSenseLoadingOverlay
            message={isBathroomMode ? '욕실 치수·물량 준비 중...' : '도면·면적·공종 근거 확인 중...'}
            subMessage={`${marketplaceContext.projectDomain || 'RESIDENTIAL_INTERIOR'} 전용 백데이터와 공종 coverage를 우선 확인합니다. 검증되지 않은 평면·수량·단가는 만들지 않습니다.`}
          />
        );
      case AppState.GENERATING_VIEWS:
        return (
          <AdSenseLoadingOverlay
            message="아이소·투시도 준비 중..."
            subMessage="검증된 Interior Render bridge 결과만 사용합니다. 브라우저 AI/Mock 이미지는 사용하지 않습니다."
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
            subMessage="선택 도메인의 Queens/Seed/T1/T2와 검증된 BOM·단가·공정 근거만 병합합니다."
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
            <SiteContextInput value={siteContext} onChange={setSiteContext} />
            <UserInputForm onSubmit={handleInitialSubmit} error={error} />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800">
      <Header onOpenAdmin={() => setError('관리자 AI 분석은 중앙 audited Core 전환 완료 후 다시 활성화합니다. 현재 브라우저 AI 직접호출은 차단했습니다.')} />
      <main className="flex-grow container mx-auto px-4 py-8 relative">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;

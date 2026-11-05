import React, { useState, useCallback } from 'react';
import { buildEstimateRequestSchema, validateEstimateRequest } from './services/estimateRequest';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UserInputForm } from './components/UserInputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AdSenseLoadingOverlay } from './components/AdSenseLoadingOverlay';
import { DesignStudio } from './components/DesignStudio';
import { EstimateMarketplaceMode } from './components/EstimateMarketplaceMode';
import { EstimateRequestForm } from './components/EstimateRequestForm';
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
import type { EstimateRequestDraft } from './contracts/estimateRequest';
import type { InteriorSiteContext } from './contracts/siteContext';

const emptyEstimateRequest = (): EstimateRequestDraft => ({
  formSchemaId: '',
  version: 'ESTIMATE_REQUEST_V1_20260827',
  answers: { materialGrade: 'standard', contactMethod: 'APP' },
  attachmentKinds: [],
  completedRequiredFields: false,
});

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INPUT);
  const [inputStep, setInputStep] = useState<1 | 2>(1);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [isometricView, setIsometricView] = useState<{ data: string; mimeType: string; } | null>(null);
  const [perspectiveView, setPerspectiveView] = useState<{ data: string; mimeType: string; } | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModifying, setIsModifying] = useState<boolean>(false);
  const [loadingSection, setLoadingSection] = useState<'materials' | 'package' | 'report' | 'schedule' | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<InteriorBridgeResult | null>(null);
  const [marketplaceContext, setMarketplaceContext] = useState<EstimateMarketplaceContext>(() => loadMarketplaceContext());
  const [estimateRequest, setEstimateRequest] = useState<EstimateRequestDraft>(() => emptyEstimateRequest());
  const [siteContext, setSiteContext] = useState<InteriorSiteContext | null>(null);
  const requestQa = validateEstimateRequest(buildEstimateRequestSchema(marketplaceContext), estimateRequest);

  const handleMarketplaceChange = useCallback((context: EstimateMarketplaceContext) => {
    setMarketplaceContext(context);
    saveMarketplaceContext(context);
    setEstimateRequest(prev => ({ ...prev, formSchemaId: '', completedRequiredFields: false }));
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
    if (!validateEstimateRequest(buildEstimateRequestSchema(marketplaceContext), estimateRequest).ok) {
      setInputStep(1);
      setError('1단계의 필수 정보를 확인해 주세요. 비교견적·입찰 모드에서는 추가 입력이 필요합니다.');
      return;
    }
    const detailsWithContext = {
      ...details,
      ...(siteContext ? { siteContext } : {}),
      estimateRequest,
    };
    await processProject(detailsWithContext);
  }, [marketplaceContext, siteContext, estimateRequest]);

  // Save a design-change request for the verified estimate backend.
  // Do not fake a regenerated image by redisplaying the same base64 data.
  const handleStyleModification = useCallback((viewToModify: 'iso' | 'pers', prompt: string) => {
    const note = prompt.trim();
    if (!note) return;
    const target = viewToModify === 'iso' ? '아이소메트릭 뷰' : '실내 투시도';
    setProjectDetails(prev => prev ? {
      ...prev,
      requests: [prev.requests, `[${target} 디자인 변경 요청] ${note}`].filter(Boolean).join('\n'),
    } : prev);
    setError(null);
  }, []);

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
    setInputStep(1);
    setProjectDetails(null);
    setGeneratedPlan(null);
    setIsometricView(null);
    setPerspectiveView(null);
    setBridgeStatus(null);
    setEstimateRequest(emptyEstimateRequest());
    setSiteContext(null);
    setError(null);
    setLoadingSection(null);
  }, []);

  const renderInputFlow = () => (
    <div className="mx-auto max-w-5xl" data-testid="interior-simple-flow">
      <div className="mb-6 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-xs font-semibold text-indigo-600">간편 견적 · 3단계</p>
        <h2 className="mt-1 text-2xl font-bold text-gray-900">
          {inputStep === 1 ? '어떤 공사를 계획하세요?' : '공간 정보와 공사 항목을 알려주세요'}
        </h2>
        <nav aria-label="견적 진행 단계" className="mt-4 grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
          {(['① 견적 유형', '② 공간·공사', '③ 결과 확인'] as const).map((label, index) => (
            <div key={label} aria-current={index === inputStep - 1 ? 'step' : undefined}
              className={`rounded-lg px-2 py-3 font-semibold ${index === inputStep - 1 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {label}
            </div>
          ))}
        </nav>
        <p className="mt-3 text-sm text-gray-600">
          {inputStep === 1 ? '지역과 견적 유형을 정한 뒤 다음으로 이동하세요.' : '사진·도면과 원하는 공사를 선택하세요. 상세 사양은 필요할 때만 펼칠 수 있습니다.'}
        </p>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <div hidden={inputStep !== 1}>
          <EstimateMarketplaceMode value={marketplaceContext} onChange={handleMarketplaceChange} />
          <EstimateRequestForm context={marketplaceContext} value={estimateRequest} onChange={setEstimateRequest} />
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-sm text-gray-600">
              {requestQa.ok ? '필수 정보가 준비됐습니다.' : '지역 등 필수 항목을 입력하면 다음 단계로 이동할 수 있습니다.'}
            </p>
            <button type="button" disabled={!requestQa.ok} onClick={() => { setInputStep(2); setError(null); }}
              className="w-full rounded-xl bg-indigo-600 px-5 py-4 font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300">
              다음: 공간·공사 선택 →
            </button>
          </div>
      </div>
      <div hidden={inputStep !== 2}>
          <button type="button" onClick={() => { setInputStep(1); setError(null); }}
            className="mb-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700">
            ← 견적 유형 수정
          </button>
          <details className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-4">
            <summary className="cursor-pointer font-semibold text-sky-900">현장·도로·주차 근거 입력 (상세 견적 시 필요)</summary>
            <p className="my-3 text-sm text-sky-800">현장 자료가 확인되지 않으면 검증된 실견적 금액을 확정할 수 없습니다.</p>
            <SiteContextInput value={siteContext} onChange={setSiteContext} />
          </details>
          <UserInputForm onSubmit={handleInitialSubmit} error={error} />
      </div>
    </div>
  );

  const renderContent = () => {
    const isBathroomMode = projectDetails?.projectScope === 'bathroom';

    switch (appState) {
      case AppState.INPUT:
        return renderInputFlow();
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
            <div className="mx-auto mb-5 max-w-5xl rounded-xl border border-indigo-100 bg-white p-4">
              <p className="text-xs font-semibold text-indigo-600">3단계 · 견적 결과</p>
              <h2 className="text-xl font-bold text-gray-900">견적 분석 결과를 확인하세요</h2>
              <p className="mt-1 text-sm text-gray-600">현장 실측·자재 단가 근거가 부족하면 금액이 표시되지 않을 수 있습니다.</p>
            </div>
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
        return renderInputFlow();
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

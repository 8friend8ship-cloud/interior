import type { GeneratedPlan, MaterialDetailItem, ProjectDetails, SchedulePhase } from '../types';
import type { EstimateMarketplaceContext } from '../contracts/estimateMarketplace';
import type { InteriorSiteContext } from '../contracts/siteContext';
import { siteContextForBridge } from './siteContext';

export type InteriorBridgeAction = 'health' | 'estimate' | 'materials' | 'labor' | 'template' | 'render' | 'schedule' | 'bridge';

export interface InteriorBridgeResult {
  ok: boolean;
  action: InteriorBridgeAction;
  upstreamStatus?: number;
  data?: any;
  error?: string;
  bridge?: string;
}

export interface QuantityLineageQa {
  ok: boolean;
  reason?: string;
  checkedItems: number;
}

type ProjectWithSite = ProjectDetails & { siteContext?: InteriorSiteContext };

const callBridge = async (action: InteriorBridgeAction, payload: Record<string, unknown>): Promise<InteriorBridgeResult> => {
  try {
    const response = await fetch('/api/interior-backdata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok && data?.ok !== false, action, ...data };
  } catch (error) {
    return { ok: false, action, error: error instanceof Error ? error.message : 'bridge fetch failed' };
  }
};

const unwrap = (result: InteriorBridgeResult) => {
  const value = result.data?.data ?? result.data ?? {};
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return value || {};
};

const domainPayload = (context: EstimateMarketplaceContext) => ({
  projectDomain: context.projectDomain || 'RESIDENTIAL_INTERIOR',
  buildingUse: context.buildingUse || 'RESIDENTIAL',
  domainPricingIsolation: true,
  coverageGateRequired: true,
});

const evidencePayload = (details: ProjectDetails) => {
  const site = (details as ProjectWithSite).siteContext;
  return site ? siteContextForBridge(site) : { siteContext: null, siteQa: { ok: false, confidence: 'LOW', missing: ['siteContext'], blockers: ['SITE_CONTEXT_REQUIRED'] }, failClosed: true };
};

export const fetchInteriorHealth = () => callBridge('health', {});

export const fetchInteriorEstimateBundle = (details: ProjectDetails, context: EstimateMarketplaceContext) =>
  callBridge('estimate', {
    project: details,
    context,
    ...domainPayload(context),
    ...evidencePayload(details),
    templateMode: context.templateMode,
    templateVersion: context.templateVersion,
    projectId: context.projectId,
    requestId: context.requestId,
  });

export const fetchInteriorMaterials = (details: ProjectDetails, context: EstimateMarketplaceContext) =>
  callBridge('materials', { project: details, context, ...domainPayload(context), ...evidencePayload(details) });

export const fetchInteriorLabor = (details: ProjectDetails, context: EstimateMarketplaceContext) =>
  callBridge('labor', { project: details, context, ...domainPayload(context), ...evidencePayload(details) });

export const fetchInteriorSchedule = (details: ProjectDetails, context: EstimateMarketplaceContext) =>
  callBridge('schedule', { project: details, context, ...domainPayload(context), ...evidencePayload(details) });

export const fetchInteriorRender = (details: ProjectDetails, context: EstimateMarketplaceContext) =>
  callBridge('render', { project: details, context, ...domainPayload(context), ...evidencePayload(details) });

export function validateBridgeQuantityLineage(costEstimate: any[], targetPy?: number): QuantityLineageQa {
  if (!Array.isArray(costEstimate) || costEstimate.length === 0) return { ok: false, reason: 'NO_COST_ESTIMATE', checkedItems: 0 };

  let checked = 0;
  for (const item of costEstimate) {
    const quantity = Number(item?.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) return { ok: false, reason: 'INVALID_QUANTITY', checkedItems: checked };

    const baseQuantity = Number(item?.baseQuantity ?? item?.sourceQuantity ?? item?.quantityLineage?.baseQuantity);
    const baseAreaPy = Number(item?.baseAreaPy ?? item?.quantityLineage?.baseAreaPy);
    const areaPy = Number(item?.targetAreaPy ?? item?.quantityLineage?.targetAreaPy ?? targetPy);
    if (Number.isFinite(baseQuantity) && baseQuantity > 0 && Number.isFinite(baseAreaPy) && baseAreaPy > 0 && Number.isFinite(areaPy) && areaPy > 0) {
      const expected = Math.round((baseQuantity * areaPy / baseAreaPy) * 10) / 10;
      if (Math.abs(quantity - expected) > 0.11) return { ok: false, reason: 'QUANTITY_RATIO_MISMATCH', checkedItems: checked + 1 };
      checked++;
    }
  }

  if (Number.isFinite(Number(targetPy)) && Number(targetPy) > 0) {
    const pyItems = costEstimate.filter(item => String(item?.unit || '').trim() === '평');
    const collapsed = pyItems.filter(item => Math.abs(Number(item?.quantity) - Number(targetPy)) < 0.001);
    const distinct = new Set(pyItems.map(item => `${item?.category || ''}|${item?.item || ''}`));
    if (pyItems.length >= 3 && collapsed.length === pyItems.length && distinct.size >= 3) {
      return { ok: false, reason: 'SUSPICIOUS_TARGET_PY_OVERWRITE', checkedItems: checked || pyItems.length };
    }
  }

  return { ok: true, checkedItems: checked || costEstimate.length };
}

export function mergeBridgeEstimate(base: GeneratedPlan, result: InteriorBridgeResult, targetPy?: number): GeneratedPlan {
  if (!result.ok) return base;
  const value = unwrap(result);
  const estimate = value.t2 || value.estimate || value.plan || value.result || value;
  if (!estimate || typeof estimate !== 'object') return base;

  const next: GeneratedPlan = { ...base };
  if (Array.isArray(estimate.costEstimate) && estimate.costEstimate.length) {
    const lineage = validateBridgeQuantityLineage(estimate.costEstimate, targetPy);
    if (!lineage.ok) {
      return {
        ...base,
        confidence: 'LOW',
        confidenceReason: `QUANTITY_LINEAGE_REJECTED:${lineage.reason}`,
        correctionNeeded: '공종별 원본 물량→면적비→최종 물량 계보를 확인한 뒤 같은 fixture로 재검증해야 합니다.',
      };
    }
    next.costEstimate = estimate.costEstimate;
  }
  if (Array.isArray(estimate.materialDetailSheet) && estimate.materialDetailSheet.length) next.materialDetailSheet = estimate.materialDetailSheet as MaterialDetailItem[];
  if (Array.isArray(estimate.projectSchedule) && estimate.projectSchedule.length) next.projectSchedule = estimate.projectSchedule as SchedulePhase[];
  if (estimate.designConcept) next.designConcept = { ...base.designConcept, ...estimate.designConcept };
  if (estimate.budgetAnalysis) next.budgetAnalysis = estimate.budgetAnalysis;
  if (estimate.masterTemplate) next.masterTemplate = estimate.masterTemplate;
  if (estimate.confidence) next.confidence = estimate.confidence;
  if (estimate.confidenceReason) next.confidenceReason = estimate.confidenceReason;
  if (estimate.correctionNeeded) next.correctionNeeded = estimate.correctionNeeded;
  return next;
}

export function extractBridgeMaterials(result: InteriorBridgeResult): MaterialDetailItem[] {
  if (!result.ok) return [];
  const value = unwrap(result);
  const list = value.materials || value.materialDetailSheet || value.items || value.result || [];
  return Array.isArray(list) ? list : [];
}

export function extractBridgeRender(result: InteriorBridgeResult): { isometricView?: { data: string; mimeType: string }; perspectiveView?: { data: string; mimeType: string } } {
  if (!result.ok) return {};
  const value = unwrap(result);
  return {
    isometricView: value.isometricView || value.iso || value.render?.isometricView,
    perspectiveView: value.perspectiveView || value.perspective || value.render?.perspectiveView,
  };
}

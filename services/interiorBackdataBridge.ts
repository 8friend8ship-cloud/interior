import type { GeneratedPlan, MaterialDetailItem, ProjectDetails, SchedulePhase } from '../types';
import type { EstimateMarketplaceContext } from '../contracts/estimateMarketplace';

export type InteriorBridgeAction = 'health' | 'estimate' | 'materials' | 'labor' | 'template' | 'render' | 'schedule' | 'bridge';

export interface InteriorBridgeResult {
  ok: boolean;
  action: InteriorBridgeAction;
  upstreamStatus?: number;
  data?: any;
  error?: string;
  bridge?: string;
}

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

export const fetchInteriorHealth = () => callBridge('health', {});

export const fetchInteriorEstimateBundle = (details: ProjectDetails, context: EstimateMarketplaceContext) =>
  callBridge('estimate', {
    project: details,
    context,
    templateMode: context.templateMode,
    templateVersion: context.templateVersion,
    projectId: context.projectId,
    requestId: context.requestId,
  });

export const fetchInteriorMaterials = (details: ProjectDetails, context: EstimateMarketplaceContext) =>
  callBridge('materials', { project: details, context });

export const fetchInteriorRender = (details: ProjectDetails, context: EstimateMarketplaceContext) =>
  callBridge('render', { project: details, context });

export function mergeBridgeEstimate(base: GeneratedPlan, result: InteriorBridgeResult): GeneratedPlan {
  if (!result.ok) return base;
  const value = unwrap(result);
  const estimate = value.t2 || value.estimate || value.plan || value.result || value;
  if (!estimate || typeof estimate !== 'object') return base;

  const next: GeneratedPlan = { ...base };
  if (Array.isArray(estimate.costEstimate) && estimate.costEstimate.length) next.costEstimate = estimate.costEstimate;
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

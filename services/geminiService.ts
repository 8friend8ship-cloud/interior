import type {
  GeneratedPlan,
  LaborSuggestion,
  MasterTemplate,
  MaterialDatabaseItem,
  MaterialDetailItem,
  PriceSuggestion,
  ProjectDetails,
  ProjectPackage,
  PromptSet,
  SchedulePhase,
  UnitPrice,
  VirtualPlan,
} from '../types';
import {
  analyzeBasePrices,
  analyzeLaborCosts,
  analyzeMarketPrices,
  discoverAndRefreshMaterials,
} from './interiorAdminGateway';
import { createVirtualPlanFromDimensions } from './virtualPlan';

/**
 * Legacy compatibility surface only.
 *
 * Browser-side model SDKs, browser API keys, fabricated market values, and
 * silent mock fallbacks are intentionally forbidden. New estimator code must
 * use Interior backdata / audited server adapters directly.
 */

const unavailable = (feature: string): never => {
  throw new Error(`${feature}_REQUIRES_VERIFIED_INTERIOR_SERVER_ADAPTER`);
};

export const validateApiKey = async (_apiKey: string): Promise<boolean> => false;

export { createVirtualPlanFromDimensions };
export { analyzeMarketPrices, analyzeBasePrices, analyzeLaborCosts, discoverAndRefreshMaterials };

export const analyzeFloorplan = async (
  _image: { data: string; mimeType: string },
  _isDemo = false,
): Promise<VirtualPlan> => unavailable('INTERIOR_FLOORPLAN_ANALYSIS');

export const generateVisualizations = async (
  _virtualPlan: VirtualPlan,
  _image: { data: string; mimeType: string },
  _modelType: 'standard' | 'pro',
  _isDemo: boolean,
  _projectScope: any,
): Promise<{
  isometricView: { data: string; mimeType: string };
  perspectiveView: { data: string; mimeType: string };
}> => unavailable('INTERIOR_RENDER');

export const modifyImageStyle = async (
  _baseImage: { data: string; mimeType: string },
  _prompt: string,
  _virtualPlan: VirtualPlan | undefined,
  _modelType: 'standard' | 'pro',
  _isDemo: boolean | undefined,
): Promise<{ data: string; mimeType: string }> => unavailable('INTERIOR_IMAGE_STYLE');

export const generateProjectPlan = async (
  _details: ProjectDetails,
  _existingEstimate?: unknown,
  _isRefinement = false,
): Promise<GeneratedPlan> => unavailable('INTERIOR_PROJECT_PLAN');

export const generateMaterialDetails = async (
  _details: ProjectDetails,
): Promise<{ sheet: MaterialDetailItem[]; prompts: PromptSet }> =>
  unavailable('INTERIOR_MATERIAL_DETAILS');

export const generateProjectSchedule = async (
  _details: ProjectDetails,
): Promise<SchedulePhase[]> => unavailable('INTERIOR_PROJECT_SCHEDULE');

export const generateMasterTemplate = async (
  _details: ProjectDetails,
  _plan: GeneratedPlan,
): Promise<MasterTemplate> => unavailable('INTERIOR_MASTER_TEMPLATE');

export const generateProjectPackage = async (
  _details: ProjectDetails,
): Promise<ProjectPackage> => unavailable('INTERIOR_PROJECT_PACKAGE');

// Type-only anchors preserve older import expectations without re-introducing
// runtime AI dependencies.
export type {
  LaborSuggestion,
  MaterialDatabaseItem,
  PriceSuggestion,
  UnitPrice,
};

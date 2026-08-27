import type { RequestFormQuestion, RequestFormSchema } from './estimateMarketplace';

export interface EstimateRequestDraft {
  formSchemaId: string;
  version: string;
  providerId?: string;
  region?: string;
  answers: Record<string, string | number | boolean | string[]>;
  attachmentKinds: string[];
  completedRequiredFields: boolean;
}

export interface EstimateRequestRoute {
  routeId: string;
  region: string;
  providerId?: string;
  mode: 'STANDARD' | 'PROVIDER' | 'CUSTOM';
  schema: RequestFormSchema;
}

export interface EstimateRequestValidation {
  ok: boolean;
  missingQuestionIds: string[];
  visibleQuestions: RequestFormQuestion[];
}

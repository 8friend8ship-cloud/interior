export type EstimateUserRole = 'CONSUMER' | 'SUPPLIER';
export type EstimatePlanTier = 'FREE' | 'PRO';
export type ConsumerQuoteMode = 'SIMPLE' | 'COMPARE' | 'TENDER';
export type SupplierMode = 'REGISTER_BID' | 'AUTOMATION' | 'PLATFORM';
export type TemplateScope = 'GENERAL' | 'PROJECT' | 'USER';
export type EstimateProjectDomain =
  | 'RESIDENTIAL_INTERIOR'
  | 'COMMERCIAL_INTERIOR'
  | 'ARCHITECTURE_BUILD'
  | 'RENOVATION_REMODEL';
export type EstimateBuildingUse =
  | 'RESIDENTIAL'
  | 'OFFICE'
  | 'RETAIL'
  | 'FNB'
  | 'MEDICAL'
  | 'EDUCATION'
  | 'HOSPITALITY'
  | 'WAREHOUSE'
  | 'OTHER';
export type EstimateTemplateMode =
  | 'GENOVY_DETAIL'
  | 'HOMEDESIGN_SIMPLE'
  | 'HOMEDESIGN_COST_MARGIN'
  | 'LEGACY_DETAIL'
  | 'USER_CUSTOM';

export interface EstimateMarketplaceContext {
  userRole: EstimateUserRole;
  tier: EstimatePlanTier;
  projectDomain?: EstimateProjectDomain;
  buildingUse?: EstimateBuildingUse;
  consumerMode?: ConsumerQuoteMode;
  supplierMode?: SupplierMode;
  providerId?: string;
  requestId?: string;
  projectId?: string;
  templateId?: string;
  templateMode?: EstimateTemplateMode;
  templateVersion?: string;
  templateScope?: TemplateScope;
  userProfileId?: string;
}

export interface RequestFormQuestion {
  questionId: string;
  canonicalField: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTISELECT' | 'DATE' | 'FILE' | 'CHECKBOX';
  required: boolean;
  options?: string[];
  visibleWhen?: Record<string, unknown>;
  requiredWhen?: Record<string, unknown>;
  source: 'BASE' | 'PROVIDER' | 'TEMPLATE';
  privacyClass: 'PUBLIC' | 'CUSTOMER' | 'SENSITIVE';
}

export interface RequestFormSchema {
  formSchemaId: string;
  providerId?: string;
  version: string;
  baseQuestions: RequestFormQuestion[];
  conditionalQuestions: RequestFormQuestion[];
  requiredAttachments: string[];
  templateRequirements: string[];
}

export interface PersonalizedTemplateProfile {
  userProfileId: string;
  templateId: string;
  baseTemplateId: string;
  version: string;
  scope: TemplateScope;
  tradeOrder: string[];
  hiddenInternalFields: string[];
  clientVisibleFields: string[];
  roundingRule?: string;
  clauses?: string[];
  branding?: {
    companyName?: string;
    logoUrl?: string;
  };
}

export interface TemplateLineage {
  templateId: string;
  version: string;
  baseTemplateId?: string;
  userProfileId?: string;
  source: 'STANDARD' | 'DRIVE_REFERENCE' | 'LOCAL_UPLOAD' | 'USER_CUSTOM';
  createdAt: string;
  previousVersion?: string;
}

export const DEFAULT_MARKETPLACE_CONTEXT: EstimateMarketplaceContext = {
  userRole: 'CONSUMER',
  tier: 'FREE',
  projectDomain: 'RESIDENTIAL_INTERIOR',
  buildingUse: 'RESIDENTIAL',
  consumerMode: 'SIMPLE',
  templateMode: 'HOMEDESIGN_SIMPLE',
  templateScope: 'GENERAL',
  templateVersion: 'INTERIOR_MARKETPLACE_V1_20260825',
};

export const INTERNAL_ONLY_FIELDS = [
  'executionCost',
  'executionUnitPrice',
  'margin',
  'marginRate',
  'internalNote',
  'subcontractorCost',
  'vendorInternalTerms',
] as const;

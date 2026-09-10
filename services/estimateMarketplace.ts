import {
  DEFAULT_MARKETPLACE_CONTEXT,
  EstimateMarketplaceContext,
  EstimatePlanTier,
  EstimateUserRole,
  PersonalizedTemplateProfile,
  TemplateLineage,
} from '../contracts/estimateMarketplace';

const CONTEXT_KEY = 'interior_estimate_marketplace_context_v1';
const PROFILE_KEY = 'interior_estimate_user_template_profiles_v1';
const LINEAGE_KEY = 'interior_estimate_template_lineage_v1';

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const loadMarketplaceContext = (): EstimateMarketplaceContext => {
  if (typeof window === 'undefined') return DEFAULT_MARKETPLACE_CONTEXT;
  return {
    ...DEFAULT_MARKETPLACE_CONTEXT,
    ...safeParse<Partial<EstimateMarketplaceContext>>(localStorage.getItem(CONTEXT_KEY), {}),
  };
};

export const saveMarketplaceContext = (context: EstimateMarketplaceContext) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
};

export const normalizeRoleTier = (
  userRole: EstimateUserRole,
  tier: EstimatePlanTier,
  previous: EstimateMarketplaceContext,
): EstimateMarketplaceContext => {
  if (userRole === 'CONSUMER') {
    return {
      ...previous,
      userRole,
      tier,
      consumerMode: tier === 'FREE' ? 'SIMPLE' : previous.consumerMode === 'SIMPLE' ? 'COMPARE' : (previous.consumerMode || 'COMPARE'),
      supplierMode: undefined,
      templateScope: tier === 'FREE' ? 'GENERAL' : (previous.templateScope || 'USER'),
    };
  }
  return {
    ...previous,
    userRole,
    tier,
    supplierMode: tier === 'FREE' ? 'REGISTER_BID' : (previous.supplierMode || 'AUTOMATION'),
    consumerMode: undefined,
    templateScope: tier === 'FREE' ? 'GENERAL' : (previous.templateScope || 'USER'),
  };
};

export const listPersonalizedTemplateProfiles = (): PersonalizedTemplateProfile[] => {
  if (typeof window === 'undefined') return [];
  return safeParse<PersonalizedTemplateProfile[]>(localStorage.getItem(PROFILE_KEY), []);
};

export const savePersonalizedTemplateProfile = (profile: PersonalizedTemplateProfile) => {
  if (typeof window === 'undefined') return;
  const profiles = listPersonalizedTemplateProfiles();
  const next = profiles.filter((item) => !(item.userProfileId === profile.userProfileId && item.templateId === profile.templateId));
  next.push(profile);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
};

export const registerTemplateLineage = (entry: TemplateLineage) => {
  if (typeof window === 'undefined') return;
  const items = safeParse<TemplateLineage[]>(localStorage.getItem(LINEAGE_KEY), []);
  const next = items.filter((item) => !(item.templateId === entry.templateId && item.version === entry.version));
  next.push(entry);
  localStorage.setItem(LINEAGE_KEY, JSON.stringify(next));
};

export const createPersonalizedTemplateVersion = (
  baseTemplateId: string,
  userProfileId: string,
  previousVersion?: string,
) => {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return {
    templateId: `USER_CUSTOM_${userProfileId}`,
    version: `USER_CUSTOM_${userProfileId}_${timestamp}`,
    baseTemplateId,
    userProfileId,
    source: 'USER_CUSTOM' as const,
    createdAt: new Date().toISOString(),
    previousVersion,
  };
};

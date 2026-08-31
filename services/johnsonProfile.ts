export type JohnsonPriceSource = 'USER_LOCAL' | 'PUBLIC_SUGGESTION' | 'PROJECT_OVERRIDE';

export interface JohnsonMaterialRate {
  key: string;
  trade: string;
  item: string;
  brand?: string;
  model?: string;
  spec?: string;
  unit: string;
  unitPrice: number;
  priceAsOf?: string;
  source: JohnsonPriceSource;
  note?: string;
}

export interface JohnsonLaborRate {
  key: string;
  laborType: string;
  unit: 'DAY' | 'HOUR' | 'EA' | 'M2' | 'M' | 'LUMP_SUM';
  unitRate: number;
  productivity?: number;
  source: JohnsonPriceSource;
  note?: string;
}

export interface JohnsonEstimateStyle {
  templateId: string;
  tradeOrder?: string[];
  visibleColumns?: string[];
  marginPolicy?: { type: 'NONE' | 'PERCENT' | 'FIXED_BY_TRADE'; value?: number; byTrade?: Record<string, number> };
  roundingUnit?: number;
  vatIncluded?: boolean;
  notes?: string[];
}

export interface JohnsonProfile {
  schema: 'JOHNSON_PROFILE_V1';
  profileId: string;
  displayName?: string;
  updatedAt: string;
  materials: JohnsonMaterialRate[];
  labor: JohnsonLaborRate[];
  estimateStyle: JohnsonEstimateStyle;
}

export interface JohnsonSuggestion<T> {
  key: string;
  value: T;
  reason: string;
  accepted?: boolean;
}

export const JOHNSON_STORAGE_KEY = 'interior_johnson_profile_v1';

export function emptyJohnsonProfile(): JohnsonProfile {
  return {
    schema: 'JOHNSON_PROFILE_V1',
    profileId: `johnson_${Date.now()}`,
    updatedAt: new Date().toISOString(),
    materials: [],
    labor: [],
    estimateStyle: { templateId: 'GENOVY_DETAIL', roundingUnit: 1000, vatIncluded: false },
  };
}

export function loadJohnsonProfile(): JohnsonProfile | null {
  try {
    const raw = localStorage.getItem(JOHNSON_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.schema === 'JOHNSON_PROFILE_V1' ? parsed : null;
  } catch {
    return null;
  }
}

export function saveJohnsonProfile(profile: JohnsonProfile): JohnsonProfile {
  const next = { ...profile, updatedAt: new Date().toISOString() };
  localStorage.setItem(JOHNSON_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function importJohnsonFile(file: File): Promise<JohnsonProfile> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (parsed?.schema !== 'JOHNSON_PROFILE_V1') throw new Error('지원하지 않는 Johnson 파일 형식입니다.');
  return saveJohnsonProfile(parsed as JohnsonProfile);
}

export function exportJohnsonFile(profile: JohnsonProfile): Blob {
  return new Blob([JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
}

export function resolveMaterialRate(
  key: string,
  profile: JohnsonProfile | null,
  publicSuggestion?: JohnsonMaterialRate,
): { rate?: JohnsonMaterialRate; origin: 'JOHNSON' | 'PUBLIC_SUGGESTION' | 'MISSING' } {
  const custom = profile?.materials.find((x) => x.key === key);
  if (custom) return { rate: custom, origin: 'JOHNSON' };
  if (publicSuggestion) return { rate: publicSuggestion, origin: 'PUBLIC_SUGGESTION' };
  return { origin: 'MISSING' };
}

export function resolveLaborRate(
  key: string,
  profile: JohnsonProfile | null,
  publicSuggestion?: JohnsonLaborRate,
): { rate?: JohnsonLaborRate; origin: 'JOHNSON' | 'PUBLIC_SUGGESTION' | 'MISSING' } {
  const custom = profile?.labor.find((x) => x.key === key);
  if (custom) return { rate: custom, origin: 'JOHNSON' };
  if (publicSuggestion) return { rate: publicSuggestion, origin: 'PUBLIC_SUGGESTION' };
  return { origin: 'MISSING' };
}

export function acceptMaterialSuggestion(profile: JohnsonProfile, suggestion: JohnsonMaterialRate): JohnsonProfile {
  return saveJohnsonProfile({
    ...profile,
    materials: [...profile.materials.filter((x) => x.key !== suggestion.key), { ...suggestion, source: 'USER_LOCAL' }],
  });
}

export function acceptLaborSuggestion(profile: JohnsonProfile, suggestion: JohnsonLaborRate): JohnsonProfile {
  return saveJohnsonProfile({
    ...profile,
    labor: [...profile.labor.filter((x) => x.key !== suggestion.key), { ...suggestion, source: 'USER_LOCAL' }],
  });
}

export type InteriorMarketId = 'KR' | 'US' | 'GLOBAL';

export interface InteriorAgentEnvelope<T> {
  ok: boolean;
  appId?: string;
  appVersion?: string;
  dataVersion?: string;
  contractVersion?: string;
  serverTime?: string;
  result?: T;
  items?: T[];
  error?: string;
}

export interface EstimateRequest {
  projectId: string;
  marketId?: InteriorMarketId;
  localeId?: string;
  templateId?: string;
  areaM2?: number;
  areaPyeong?: number;
  downlightCount?: number;
  kitchenLengthM?: number;
  islandLengthM?: number;
  options?: Record<string, boolean>;
}

export interface EstimateLineItem {
  lineId: string;
  trade: string;
  item: string;
  unit: string;
  quantity: number;
  billQuantity: number;
  unitPrice: number;
  amount: number;
  currency: string;
  priceSource: string;
  reviewStatus: string;
}

export interface EstimateResult {
  templateId: string;
  marketId: InteriorMarketId;
  currency: string;
  subtotal: number;
  contingency: number;
  margin: number;
  total: number;
  lineItems: EstimateLineItem[];
  warnings: string[];
  reviewRequired: boolean;
  dataVersion: string;
  calculatedAt: string;
}

export interface FrontMaterialOffer {
  offerId: string;
  title: string;
  price: number | string;
  currency: string;
  url: string;
  imageUrl?: string;
}

export interface FrontMaterial {
  materialId: string;
  category: string;
  subcategory: string;
  specName: string;
  unit: string;
  materialSlot: string;
  offer: FrontMaterialOffer | null;
}

export interface FrontTemplate {
  templateId: string;
  marketId: InteriorMarketId;
  pyeongLabel: string;
  layoutType: string;
  reviewStatus: string;
}

export interface FrontMasterData {
  templates: FrontTemplate[];
  materials: FrontMaterial[];
}

const API_PATH = '/api/interior-agent';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Interior agent returned invalid JSON (${response.status}).`);
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'error' in payload
        ? String((payload as { error?: unknown }).error || 'Request failed')
        : `Interior agent request failed (${response.status}).`;
    throw new Error(message);
  }

  return payload as T;
}

export async function getInteriorAgentHealth(): Promise<InteriorAgentEnvelope<never>> {
  return requestJson(`${API_PATH}?action=health`);
}

export async function getApprovedFrontData(): Promise<InteriorAgentEnvelope<FrontMasterData>> {
  return requestJson(`${API_PATH}?action=front`);
}

export async function getInteriorTemplates(): Promise<InteriorAgentEnvelope<FrontTemplate>> {
  return requestJson(`${API_PATH}?action=templates`);
}

export async function getInteriorMaterials(): Promise<InteriorAgentEnvelope<FrontMaterial>> {
  return requestJson(`${API_PATH}?action=materials`);
}

export async function calculateInteriorEstimate(
  data: EstimateRequest,
): Promise<InteriorAgentEnvelope<EstimateResult>> {
  return requestJson(API_PATH, {
    method: 'POST',
    body: JSON.stringify({ action: 'estimate.calculate', data }),
  });
}

export async function createInteriorContentTask(data: {
  sourceEntityType: string;
  sourceEntityId: string;
  taskType?: string;
  platform?: string;
  localeId?: string;
  titleHint?: string;
  ctaUrl?: string;
}): Promise<InteriorAgentEnvelope<Record<string, unknown>>> {
  return requestJson(API_PATH, {
    method: 'POST',
    body: JSON.stringify({ action: 'content.create', data }),
  });
}

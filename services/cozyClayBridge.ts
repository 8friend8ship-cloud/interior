export type CozyClaySceneAsset = {
  id: string;
  kind: 'room' | 'furniture' | 'material' | 'person' | 'vehicle' | 'prop';
  name: string;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
};

export type CozyClayCameraPlan = {
  shotId: string;
  lensMm?: number;
  position?: [number, number, number];
  target?: [number, number, number];
  move?: 'static' | 'dolly' | 'truck' | 'pan' | 'tilt' | 'orbit' | 'follow';
  durationSec?: number;
};

export type CozyClaySceneRequest = {
  projectId: string;
  sceneId: string;
  roomType?: string;
  assets?: CozyClaySceneAsset[];
  camera?: CozyClayCameraPlan[];
  prompt?: string;
  bomContext?: Record<string, unknown>;
  seedContext?: Record<string, unknown>;
};

export type CozyClayBridgeResult = {
  ok: boolean;
  jobId?: string;
  sceneFileUrl?: string;
  previewUrl?: string;
  message?: string;
  raw?: unknown;
};

const getEndpoint = () => {
  const value = import.meta.env.VITE_COZYCLAY_BRIDGE_URL as string | undefined;
  return value?.replace(/\/$/, '') || '';
};

const getToken = () =>
  (import.meta.env.VITE_COZYCLAY_BRIDGE_TOKEN as string | undefined) || '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const endpoint = getEndpoint();
  if (!endpoint) {
    throw new Error('VITE_COZYCLAY_BRIDGE_URL is not configured');
  }

  const token = getToken();
  const response = await fetch(`${endpoint}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`CozyClay bridge ${response.status}: ${detail || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function createCozyClayScene(
  input: CozyClaySceneRequest,
): Promise<CozyClayBridgeResult> {
  return request<CozyClayBridgeResult>('/v1/scenes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getCozyClayJob(jobId: string): Promise<CozyClayBridgeResult> {
  return request<CozyClayBridgeResult>(`/v1/jobs/${encodeURIComponent(jobId)}`);
}

export async function sendCozyClayAction(
  sceneId: string,
  action: Record<string, unknown>,
): Promise<CozyClayBridgeResult> {
  return request<CozyClayBridgeResult>(`/v1/scenes/${encodeURIComponent(sceneId)}/actions`, {
    method: 'POST',
    body: JSON.stringify(action),
  });
}

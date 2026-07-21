export type AgentReadAction = 'dashboard' | 'mail' | 'schedule' | 'queue';
export type AgentWriteAction = 'create_task' | 'mark_reviewed';

export interface AgentBridgeResponse<T = unknown> {
  ok: boolean;
  action?: string;
  data?: T;
  error?: string;
}

async function parseResponse<T>(response: Response): Promise<AgentBridgeResponse<T>> {
  const text = await response.text();
  let payload: AgentBridgeResponse<T>;

  try {
    payload = JSON.parse(text) as AgentBridgeResponse<T>;
  } catch {
    payload = { ok: false, error: text || '백엔드 응답을 읽지 못했습니다.' };
  }

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || `백엔드 요청 실패 (${response.status})`);
  }

  return payload;
}

export async function readAgentData<T = unknown>(action: AgentReadAction, limit = 50): Promise<T> {
  const params = new URLSearchParams({
    action,
    limit: String(Math.min(Math.max(limit, 1), 200)),
  });

  const response = await fetch(`/api/agent-bridge?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  const payload = await parseResponse<T>(response);
  return payload.data as T;
}

export async function createAgentTask(input: {
  taskType: string;
  sourceId?: string;
  request: string;
  approvalStatus?: 'NOT_REQUIRED' | 'PENDING';
  priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  dueAt?: string;
}) {
  const response = await fetch('/api/agent-bridge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create_task', ...input }),
  });

  return parseResponse(response);
}

export async function markMailReviewed(mailId: string, agentAction?: string) {
  const response = await fetch('/api/agent-bridge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'mark_reviewed', mailId, agentAction }),
  });

  return parseResponse(response);
}

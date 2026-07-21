export interface FrontAnswerResult {
  ok: boolean;
  status: 'ANSWERED' | 'QUEUED_FOR_RESEARCH' | string;
  answer?: string;
  detail?: string;
  responseId?: string;
  contentId?: string;
  intent?: string;
  keyFacts?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  sources?: string[];
  updatedAt?: string;
  taskId?: string;
  error?: string;
}

export async function getFrontAnswer(input: {
  appId: string;
  query: string;
  intent?: string;
  locale?: string;
  market?: string;
  sessionId?: string;
}): Promise<FrontAnswerResult> {
  const params = new URLSearchParams({
    appId: input.appId,
    query: input.query,
    intent: input.intent || '',
    locale: input.locale || 'ko-KR',
    market: input.market || 'KR',
    sessionId: input.sessionId || '',
  });
  const response = await fetch(`/api/front-answer?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const payload = (await response.json()) as FrontAnswerResult;
  if (!response.ok || !payload.ok) throw new Error(payload.error || '검증 답변을 불러오지 못했습니다.');
  return payload;
}

const ALLOWED_GET_ACTIONS = new Set(['dashboard', 'mail', 'schedule', 'queue']);
const ALLOWED_POST_ACTIONS = new Set(['create_task', 'mark_reviewed']);

function getServerConfig() {
  const endpoint = process.env.AGENT_MAIL_ENDPOINT;
  const token = process.env.AGENT_MAIL_TOKEN;

  if (!endpoint || !token) {
    throw new Error('AGENT_MAIL_ENDPOINT 또는 AGENT_MAIL_TOKEN이 설정되지 않았습니다.');
  }

  return { endpoint, token };
}

function normalizeLimit(value: unknown) {
  const parsed = Number(value ?? 50);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(Math.max(Math.trunc(parsed), 1), 200);
}

export default async function handler(req: any, res: any) {
  try {
    const { endpoint, token } = getServerConfig();

    if (req.method === 'GET') {
      const action = String(req.query?.action ?? 'dashboard').toLowerCase();
      if (!ALLOWED_GET_ACTIONS.has(action)) {
        return res.status(400).json({ ok: false, error: '지원하지 않는 조회 action입니다.' });
      }

      const target = new URL(endpoint);
      target.searchParams.set('action', action);
      target.searchParams.set('limit', String(normalizeLimit(req.query?.limit)));
      target.searchParams.set('token', token);

      const response = await fetch(target, { cache: 'no-store' });
      const text = await response.text();
      if (!response.ok) {
        return res.status(response.status).json({ ok: false, error: text || 'Apps Script 조회 실패' });
      }

      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(text);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
      const action = String(body.action ?? '').toLowerCase();
      if (!ALLOWED_POST_ACTIONS.has(action)) {
        return res.status(400).json({ ok: false, error: '지원하지 않는 변경 action입니다.' });
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, action, token }),
      });
      const text = await response.text();
      if (!response.ok) {
        return res.status(response.status).json({ ok: false, error: text || 'Apps Script 변경 실패' });
      }

      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(text);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'GET 또는 POST만 사용할 수 있습니다.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 서버 오류';
    return res.status(500).json({ ok: false, error: message });
  }
}

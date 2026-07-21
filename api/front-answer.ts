const endpoint = process.env.AGENT_CORE_ENDPOINT || process.env.AGENT_MAIL_ENDPOINT;
const token = process.env.AGENT_CORE_TOKEN || process.env.AGENT_MAIL_TOKEN;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'GET only' });
  }
  if (!endpoint || !token) {
    return res.status(500).json({ ok: false, error: 'AGENT_CORE_ENDPOINT/TOKEN not configured' });
  }
  const appId = String(req.query?.appId || '').trim();
  const query = String(req.query?.query || '').trim();
  if (!appId || !query) return res.status(400).json({ ok: false, error: 'appId and query are required' });

  const target = new URL(endpoint);
  target.searchParams.set('action', 'front_answer');
  target.searchParams.set('appId', appId);
  target.searchParams.set('query', query);
  target.searchParams.set('intent', String(req.query?.intent || ''));
  target.searchParams.set('locale', String(req.query?.locale || 'ko-KR'));
  target.searchParams.set('market', String(req.query?.market || 'KR'));
  target.searchParams.set('sessionId', String(req.query?.sessionId || ''));
  target.searchParams.set('token', token);

  const response = await fetch(target, { cache: 'no-store' });
  const text = await response.text();
  res.setHeader('Cache-Control', 'private, max-age=60');
  res.status(response.status).send(text);
}

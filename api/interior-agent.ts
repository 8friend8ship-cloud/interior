const ALLOWED_GET_ACTIONS = new Set([
  'health',
  'templates',
  'materials',
  'front',
  'dailyReport',
  'drywriterArticles',
]);

const ALLOWED_POST_ACTIONS = new Set([
  'estimate.calculate',
  'content.create',
]);

export default async function handler(req: any, res: any) {
  const webAppUrl = process.env.HD_INTERIOR_WEBAPP_URL;
  const apiToken = process.env.HD_INTERIOR_API_TOKEN;

  if (!webAppUrl || !apiToken) {
    return res.status(503).json({
      ok: false,
      error: 'Interior agent environment variables are not configured.',
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    if (req.method === 'GET') {
      const action = String(req.query?.action || 'health');
      if (!ALLOWED_GET_ACTIONS.has(action)) {
        return res.status(400).json({ ok: false, error: 'Unsupported GET action.' });
      }

      const url = new URL(webAppUrl);
      url.searchParams.set('action', action);
      url.searchParams.set('token', apiToken);

      const upstream = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      const text = await upstream.text();
      res.status(upstream.ok ? 200 : 502);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.send(text);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const action = String(body.action || '');
      if (!ALLOWED_POST_ACTIONS.has(action)) {
        return res.status(400).json({ ok: false, error: 'Unsupported POST action.' });
      }

      const upstream = await fetch(webAppUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...body, token: apiToken }),
      });
      const text = await upstream.text();
      res.status(upstream.ok ? 200 : 502);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.send(text);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown proxy error';
    return res.status(502).json({ ok: false, error: message });
  } finally {
    clearTimeout(timeout);
  }
}

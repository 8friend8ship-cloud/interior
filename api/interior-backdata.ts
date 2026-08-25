const DEFAULT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyuYK2lx8FY0asRtaUaGXt8ha6ayokrTdr3afDozPErnEV4E5APpJcfm3mNujpKkR65Gg/exec';
const ALLOWED_ACTIONS = new Set([
  'health',
  'estimate',
  'materials',
  'labor',
  'template',
  'render',
  'schedule',
  'bridge',
]);

function resolveEndpoint() {
  return process.env.INTERIOR_BACKDATA_ENDPOINT || process.env.AGENT_MAIL_ENDPOINT || DEFAULT_ENDPOINT;
}

function resolveToken() {
  return process.env.INTERIOR_BACKDATA_TOKEN || process.env.AGENT_MAIL_TOKEN || '';
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'POST only' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const action = String(body.action || 'health').toLowerCase();
    if (!ALLOWED_ACTIONS.has(action)) {
      return res.status(400).json({ ok: false, error: 'Unsupported action' });
    }

    const endpoint = resolveEndpoint();
    const token = resolveToken();
    const payload = { ...(body.payload || {}), action, ...(token ? { token } : {}) };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const text = await response.text();
    let data: any = text;
    try { data = JSON.parse(text); } catch {}

    res.setHeader('Cache-Control', 'no-store');
    return res.status(response.ok ? 200 : response.status).json({
      ok: response.ok,
      action,
      upstreamStatus: response.status,
      data,
      bridge: 'INTERIOR_BACKDATA_BRIDGE_V2_20260825',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown bridge error';
    return res.status(500).json({ ok: false, error: message, bridge: 'INTERIOR_BACKDATA_BRIDGE_V2_20260825' });
  }
}

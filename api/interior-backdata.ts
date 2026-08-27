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

const CONSUMER_PRIVATE_FIELDS = new Set([
  'executionCost',
  'executionUnitPrice',
  'margin',
  'marginRate',
  'internalNote',
  'subcontractorCost',
  'vendorInternalTerms',
  'materialCost',
  'laborCost',
  'unitCost',
  'purchaseCost',
]);

function resolveEndpoint() {
  return String(process.env.INTERIOR_BACKDATA_ENDPOINT || '').trim();
}

function resolveToken() {
  return String(process.env.INTERIOR_BACKDATA_TOKEN || '').trim();
}

function sanitizeConsumerValue(value: any): any {
  if (Array.isArray(value)) return value.map(sanitizeConsumerValue);
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, any> = {};
  for (const [key, child] of Object.entries(value)) {
    if (CONSUMER_PRIVATE_FIELDS.has(key)) continue;
    out[key] = sanitizeConsumerValue(child);
  }
  return out;
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
    if (!endpoint) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(503).json({
        ok: false,
        action,
        error: 'INTERIOR_CORE_ENDPOINT_NOT_CONFIGURED',
        bridge: 'INTERIOR_BACKDATA_BRIDGE_V4_CANONICAL_ENDPOINT_REQUIRED_20260827',
      });
    }

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

    const role = String(body?.payload?.context?.userRole || body?.payload?.userRole || 'CONSUMER').toUpperCase();
    if (role !== 'SUPPLIER' && data && typeof data === 'object') {
      data = sanitizeConsumerValue(data);
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(response.ok ? 200 : response.status).json({
      ok: response.ok,
      action,
      upstreamStatus: response.status,
      data,
      bridge: 'INTERIOR_BACKDATA_BRIDGE_V4_CANONICAL_ENDPOINT_REQUIRED_20260827',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown bridge error';
    return res.status(500).json({ ok: false, error: message, bridge: 'INTERIOR_BACKDATA_BRIDGE_V4_CANONICAL_ENDPOINT_REQUIRED_20260827' });
  }
}

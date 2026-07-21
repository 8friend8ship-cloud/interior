const endpoint = process.env.AGENT_CORE_ENDPOINT || process.env.AGENT_MAIL_ENDPOINT;
const token = process.env.AGENT_CORE_TOKEN || process.env.AGENT_MAIL_TOKEN;

export default async function handler(req: any, res: any) {
  if (!endpoint || !token) return res.status(500).json({ ok:false, error:'AGENT_CORE_ENDPOINT/TOKEN not configured' });
  if (req.method === 'GET') {
    const appId = String(req.query?.appId || 'APP_HOME_ESTIMATE');
    const target = new URL(endpoint);
    target.searchParams.set('action','pmf_context');
    target.searchParams.set('appId',appId);
    target.searchParams.set('token',token);
    const response = await fetch(target,{cache:'no-store'});
    res.setHeader('Cache-Control','private, max-age=60');
    return res.status(response.status).send(await response.text());
  }
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const response = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,token})});
    return res.status(response.status).send(await response.text());
  }
  return res.status(405).json({ok:false,error:'GET or POST only'});
}

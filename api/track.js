import { kv } from '@vercel/kv';

const PAGES = new Set(['/', '/index-en.html', '/demo-sistema/', '/demo-reservas/', '/demo-aprovacao/']);
const HOSTS = new Set(['creativecodex.com.br', 'www.creativecodex.com.br']);
const KEEP = 60 * 60 * 24 * 400;
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime|curl|wget|python|axios/i;
const day = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); // horário de Brasília

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const ua = String(req.headers['user-agent'] || '');
    if (!ua || BOT.test(ua)) return res.status(204).end();
    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
    b = b || {};
    const id = String(b.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 40);
    if (id.length < 8) return res.status(204).end();
    let path = String(b.path || '/').split('?')[0].split('#')[0].slice(0, 80);
    if (path === '/index.html') path = '/';
    if (!PAGES.has(path)) path = '/outros';
    let ref = 'direto';
    try {
      const h = new URL(String(b.ref || '')).hostname.replace(/^www\./, '').slice(0, 60);
      if (h && !HOSTS.has(h) && !HOSTS.has('www.' + h)) ref = h;
    } catch {}
    const dev = /mobile|android|iphone/i.test(ua) ? 'celular' : 'computador';
    const d = day();
    const keys = { u: 'vis_u_' + d, pv: 'vis_pv_' + d, pg: 'vis_pg_' + d, rf: 'vis_rf_' + d, dv: 'vis_dv_' + d };
    await Promise.all([
      kv.pfadd(keys.u, id), kv.incr(keys.pv), kv.hincrby(keys.pg, path, 1), kv.hincrby(keys.rf, ref, 1), kv.hincrby(keys.dv, dev, 1)
    ]);
    await Promise.all(Object.values(keys).map((k) => kv.expire(k, KEEP)));
    return res.status(204).end();
  } catch (e) {
    console.error('track', e);
    return res.status(204).end();
  }
}

const { pipeline } = require('./_redis');
const { isAdmin } = require('./_auth');

const SLUG = /^[a-z0-9-]{1,32}$/;
const YM = /^\d{4}-(0[1-9]|1[0-2])$/;

const clean = b => {
  const pagos = {};
  Object.entries(b.pagos || {}).slice(0, 120).forEach(([k, v]) => { if (YM.test(k) && v) pagos[k] = 1; });
  const valor = Math.round((+b.valor || 0) * 100) / 100;
  const venc = Math.round(+b.venc || 0);
  return {
    valor: valor > 0 && valor < 1e7 ? valor : 0,
    venc: venc >= 1 && venc <= 31 ? venc : 10,
    obs: typeof b.obs === 'string' ? b.obs.slice(0, 200) : '',
    pagos
  };
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    if (req.method === 'GET') {
      const [keys] = await pipeline([['KEYS', 'bbfin:*']]);
      const vals = keys.length ? await pipeline(keys.map(k => ['GET', k])) : [];
      const items = {};
      keys.forEach((k, i) => { try { items[k.slice(6)] = JSON.parse(vals[i]); } catch {} });
      return res.status(200).json({ items });
    }
    if (req.method === 'POST') {
      const slug = String(req.query.c || '');
      if (!SLUG.test(slug)) return res.status(400).json({ error: 'slug' });
      let b = req.body;
      if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
      const f = clean(b || {});
      await pipeline([['SET', `bbfin:${slug}`, JSON.stringify(f)]]);
      return res.status(200).json({ ok: true, fin: f });
    }
    res.status(405).end();
  } catch {
    res.status(500).json({ error: 'server' });
  }
};

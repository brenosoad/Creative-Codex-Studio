const { pipeline } = require('./_redis');
const { isAdmin, clientFor } = require('./_auth');

module.exports = async (req, res) => {
  try {
    const admin = isAdmin(req);
    const own = admin ? null : await clientFor(req);
    if (!admin && !own) return res.status(401).json({ error: 'unauthorized' });
    const [all] = await pipeline([['KEYS', admin ? 'bb:*' : `bb:${own}:*`]]);
    // Só os últimos 190 dias (90 do período + 90 de comparação). Dias em BRT.
    const cut = new Date(Date.now() - 3 * 3600e3 - 190 * 864e5).toISOString().slice(0, 10);
    const keys = all.filter(k => k.split(':')[2] >= cut);
    const hashes = keys.length ? await pipeline(keys.map(k => ['HGETALL', k])) : [];
    const rows = [];
    keys.forEach((k, i) => {
      const [, site, day] = k.split(':');
      const h = hashes[i] || [];
      for (let j = 0; j < h.length; j += 2) {
        const [event, id] = h[j].split(':');
        rows.push([site, day, event, id, parseInt(h[j + 1], 10)]);
      }
    });
    res.setHeader('Cache-Control', 'no-store');
    let nome;
    if (own) { const [c] = await pipeline([['GET', `bbcfg:${own}`]]); try { nome = JSON.parse(c).nome; } catch {} }
    res.status(200).json({ client: !!own, nome, sites: own ? [own] : [...new Set(rows.map(r => r[0]))].sort(), rows });
  } catch {
    res.status(500).json({ error: 'db' });
  }
};

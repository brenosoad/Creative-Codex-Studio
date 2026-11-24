const { pipeline } = require('./_redis');
const { isAdmin, clientFor } = require('./_auth');

module.exports = async (req, res) => {
  try {
    const admin = isAdmin(req);
    const own = admin ? null : await clientFor(req);
    if (!admin && !own) return res.status(401).json({ error: 'unauthorized' });
    const [keys] = await pipeline([['KEYS', admin ? 'bb:*' : `bb:${own}:*`]]);
    const hashes = keys.length ? await pipeline(keys.map(k => ['HGETALL', k])) : [];
    const rows = [];
    keys.forEach((k, i) => {
      const [, site, day] = k.split(':');
      const h = hashes[i] || [];
      for (let j = 0; j < h.length; j += 2) {
        const [event, id] = h[j].split(':');
        rows.push({ site, day, event, id, n: parseInt(h[j + 1], 10) });
      }
    });
    res.setHeader('Cache-Control', 'no-store');
    let nome;
    if (own) { const [c] = await pipeline([['GET', `bbcfg:${own}`]]); try { nome = JSON.parse(c).nome; } catch {} }
    res.status(200).json({ client: !!own, nome, sites: own ? [own] : [...new Set(rows.map(r => r.site))].sort(), rows });
  } catch {
    res.status(500).json({ error: 'db' });
  }
};

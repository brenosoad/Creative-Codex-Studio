const { pipeline } = require('./_redis');
const { isAdmin } = require('./_auth');

module.exports = async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
  try {
    const [keys] = await pipeline([['KEYS', 'bb:*']]);
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
    res.status(200).json({ sites: [...new Set(rows.map(r => r.site))].sort(), rows });
  } catch {
    res.status(500).json({ error: 'db' });
  }
};

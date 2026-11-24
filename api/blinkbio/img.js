const crypto = require('crypto');
const { pipeline } = require('./_redis');
const { isAdmin } = require('./_auth');

const SLUG = /^[a-z0-9-]{1,32}$/;
const NAME = /^[a-f0-9]{12}\.(webp|png|jpg)$/;
const DATA = /^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/=]+)$/;
const EXT = { webp: 'webp', png: 'png', jpeg: 'jpg' };
const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg' };
const MAX_B64 = 800 * 1000; // limite do Redis REST (~1 MB por requisição)

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const c = String(req.query.c || ''), f = String(req.query.f || '');
      if (!SLUG.test(c) || !NAME.test(f)) return res.status(400).end();
      const [v] = await pipeline([['GET', `bbimg:${c}:${f}`]]);
      if (!v) return res.status(404).end();
      res.setHeader('Content-Type', MIME[f.split('.')[1]]);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.status(200).end(Buffer.from(v, 'base64'));
    }
    if (req.method !== 'POST') return res.status(405).end();
    if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
    const m = DATA.exec(String(b?.data || ''));
    if (!b || !SLUG.test(b.c || '') || !m) return res.status(400).json({ error: 'dados' });
    if (m[2].length > MAX_B64) return res.status(413).json({ error: 'imagem_grande' });
    const name = crypto.createHash('sha1').update(m[2]).digest('hex').slice(0, 12) + '.' + EXT[m[1]];
    await pipeline([['SET', `bbimg:${b.c}:${name}`, m[2]]]);
    res.status(200).json({ ref: 'img:' + name });
  } catch {
    res.status(500).json({ error: 'db' });
  }
};

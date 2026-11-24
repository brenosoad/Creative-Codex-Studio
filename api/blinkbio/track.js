const { pipeline } = require('./_redis');
const EVENTS = new Set(['page_view', 'abrir_link', 'copiar_cupom', 'filtro']);
const SLUG = /^[a-z0-9-]{1,32}$/;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  let e = req.body;
  if (typeof e === 'string') { try { e = JSON.parse(e); } catch { e = null; } }
  const site = String(req.query.s || '');
  if (!e || !EVENTS.has(e.event) || !SLUG.test(site)) return res.status(400).json({ ok: false });
  const id = SLUG.test(e.id || '') ? e.id : '-';
  const day = new Date().toISOString().slice(0, 10);
  try {
    await pipeline([['HINCRBY', `bb:${site}:${day}`, `${e.event}:${id}`, 1], ['EXPIRE', `bb:${site}:${day}`, 60 * 60 * 24 * 400]]);
    res.status(200).json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
};

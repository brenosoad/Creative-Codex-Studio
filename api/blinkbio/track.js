const { pipeline } = require('./_redis');
const EVENTS = new Set(['page_view', 'abrir_link', 'copiar_cupom', 'filtro']);
const SLUG = /^[a-z0-9-]{1,32}$/;
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime|curl|wget|python|axios/i;
const KEEP = 60 * 60 * 24 * 400;

function origem(ua, ref) {
  if (/instagram/i.test(ua)) return 'instagram';
  if (/FBAN|FBAV/i.test(ua)) return 'facebook';
  try {
    const h = new URL(String(ref)).hostname.replace(/^www\./, '').toLowerCase();
    if (!h) return 'direto';
    if (/instagram\.com$/.test(h)) return 'instagram';
    if (/whatsapp|wa\.me/.test(h)) return 'whatsapp';
    if (/facebook|fb\.com/.test(h)) return 'facebook';
    if (/google\./.test(h)) return 'google';
    if (/tiktok/.test(h)) return 'tiktok';
    if (/youtube|youtu\.be/.test(h)) return 'youtube';
    return 'outros';
  } catch { return 'direto'; }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  const ua = String(req.headers['user-agent'] || '');
  if (!ua || BOT.test(ua)) return res.status(204).end();
  let e = req.body;
  if (typeof e === 'string') { try { e = JSON.parse(e); } catch { e = null; } }
  const site = String(req.query.s || '');
  if (!e || !EVENTS.has(e.event) || !SLUG.test(site)) return res.status(400).json({ ok: false });
  const id = SLUG.test(e.id || '') ? e.id : '-';
  const brt = new Date(Date.now() - 3 * 3600e3); // horário de Brasília
  const key = `bb:${site}:${brt.toISOString().slice(0, 10)}`;
  const cmds = [['HINCRBY', key, `${e.event}:${id}`, 1]];
  if (e.event === 'page_view') {
    cmds.push(['HINCRBY', key, `dev:${/mobile|android|iphone/i.test(ua) ? 'celular' : 'computador'}`, 1]);
    cmds.push(['HINCRBY', key, `ref:${origem(ua, e.ref)}`, 1]);
    cmds.push(['HINCRBY', key, `hr:${String(brt.getUTCHours()).padStart(2, '0')}`, 1]);
  }
  cmds.push(['EXPIRE', key, KEEP]);
  try {
    await pipeline(cmds);
    res.status(200).json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
};

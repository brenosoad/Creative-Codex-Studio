const crypto = require('crypto');
const { pipeline } = require('./_redis');

// Chave do criador. A variável de ambiente, se existir, tem prioridade.
const ADMIN_KEY = process.env.BLINKBIO_ADMIN_KEY || 'blink-f5reRTAMyXbHjBXO';

const same = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const KEY_RE = /^[A-Za-z0-9_-]{8,64}$/;

// Slug do cliente dono da chave enviada (ou null).
async function clientFor(req) {
  const k = String(req.headers['x-key'] || '');
  if (!KEY_RE.test(k)) return null;
  const [slug] = await pipeline([['GET', `bbkeyidx:${k}`]]);
  return slug || null;
}

module.exports = { isAdmin: req => same(req.headers['x-key'] || '', ADMIN_KEY), clientFor, newKey: () => crypto.randomBytes(12).toString('base64url') };

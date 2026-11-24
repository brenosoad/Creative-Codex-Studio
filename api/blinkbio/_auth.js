const crypto = require('crypto');

// Chave do painel. A variável de ambiente, se existir, tem prioridade.
const ADMIN_KEY = process.env.BLINKBIO_ADMIN_KEY || 'blink-f5reRTAMyXbHjBXO';

const same = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

module.exports = { isAdmin: req => same(req.headers['x-key'] || '', ADMIN_KEY) };

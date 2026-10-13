import { kv } from '@vercel/kv';
import { createHmac, timingSafeEqual } from 'node:crypto';

const KEY = 'painel_dados';
const SESSION_MS = 12 * 3600 * 1000;
const MAX_PROSPECTS = 2000;

// Defina PAINEL_SENHA_DONO, PAINEL_SENHA_ESTAGIARIO e PAINEL_SECRET nas variáveis de ambiente da Vercel.
// Os valores abaixo só existem para o painel não parar antes da configuração. Troque as senhas.
// 'estagiario' é o Fábio (id mantido para não perder os dados antigos). Todos os acessos que não são 'dono' têm perfil de estagiário.
const PASSWORDS = {
  dono: process.env.PAINEL_SENHA_DONO || 'BS100218*',
  estagiario: process.env.PAINEL_SENHA_ESTAGIARIO || 'Fabio2026*',
  diogo: process.env.PAINEL_SENHA_DIOGO || 'Diogo2026*'
};
const ROLES = Object.keys(PASSWORDS);
const SECRET = process.env.PAINEL_SECRET || ('cc:' + ROLES.map((k) => PASSWORDS[k]).join(':'));

const sign = (payload) => createHmac('sha256', SECRET).update(payload).digest('base64url');

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function makeToken(role) {
  const payload = Buffer.from(JSON.stringify({ role, exp: Date.now() + SESSION_MS })).toString('base64url');
  return payload + '.' + sign(payload);
}

function readToken(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return ROLES.includes(data.role) ? data.role : null;
  } catch { return null; }
}

const STATUS = ['prospectando', 'semresposta', 'negociando', 'fechado', 'perdido'];
const str = (v, n) => String(v ?? '').slice(0, n);

function clean(p, role) {
  if (!p || typeof p !== 'object' || !p.id) return null;
  const status = STATUS.includes(p.status) ? p.status : 'prospectando';
  const history = Array.isArray(p.history)
    ? p.history.slice(-60).map((h) => ({ at: str(h.at, 30), type: str(h.type, 20), text: str(h.text, 300) }))
    : [];
  return {
    id: str(p.id, 40),
    name: str(p.name, 120),
    contact: str(p.contact, 120),
    service: str(p.service, 120),
    value: Math.max(0, Number(p.value) || 0),
    recurring: !!p.recurring,
    status,
    date: str(p.date, 30),
    closedAt: p.closedAt ? str(p.closedAt, 30) : null,
    nextContact: p.nextContact ? str(p.nextContact, 10) : '',
    notes: str(p.notes, 2000),
    lostReason: str(p.lostReason, 200),
    commissionPaid: !!p.commissionPaid,
    responsavel: role !== 'dono' ? role : (ROLES.includes(p.responsavel) ? p.responsavel : 'dono'),
    history,
    updatedAt: Number(p.updatedAt) || Date.now()
  };
}

function view(data, role) {
  if (role === 'dono') return data;
  // estagiário só enxerga valores e notas dos próprios negócios e não vê meta
  const prospects = (data.prospects || []).map((p) =>
    p.responsavel === role ? p : { ...p, value: null, notes: '', history: [] }
  );
  return { prospects, goal: null, goals: null };
}

async function loginLimit(req) {
  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const k = 'painel_login_' + ip;
  const n = await kv.incr(k);
  if (n === 1) await kv.expire(k, 600);
  return n <= 8;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    // login
    if (req.method === 'POST' && req.query.action === 'login') {
      if (!(await loginLimit(req))) return res.status(429).json({ error: 'Muitas tentativas. Aguarde 10 minutos.' });
      const pw = (req.body || {}).password || '';
      const role = ROLES.find((k) => safeEqual(pw, PASSWORDS[k])) || null;
      if (!role) return res.status(401).json({ error: 'Senha incorreta.' });
      return res.status(200).json({ token: makeToken(role), role, expiresIn: SESSION_MS });
    }

    const role = readToken(req);
    if (!role) return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });

    const current = (await kv.get(KEY)) || { prospects: [], goal: 0, goals: {} };
    current.prospects = current.prospects || [];
    current.goals = current.goals || {};

    if (req.method === 'GET') return res.status(200).json(view(current, role));

    if (req.method === 'POST') {
      const body = req.body || {};
      const incoming = Array.isArray(body.prospects) ? body.prospects : [];
      const deleted = new Set(Array.isArray(body.deleted) ? body.deleted.map(String) : []);
      const byId = new Map(current.prospects.map((p) => [p.id, p]));

      for (const raw of incoming.slice(0, MAX_PROSPECTS)) {
        const p = clean(raw, role);
        if (!p) continue;
        const old = byId.get(p.id);
        if (role !== 'dono') {
          if (old && old.responsavel !== role) continue; // não mexe nos de outros
          p.commissionPaid = old ? old.commissionPaid : false;
        }
        if (old && old.updatedAt > p.updatedAt) continue; // versão mais nova já salva
        if (old && role !== 'dono' && old.value != null && p.value == null) p.value = old.value;
        byId.set(p.id, p);
      }
      for (const id of deleted) {
        const old = byId.get(id);
        if (!old) continue;
        if (role !== 'dono' && old.responsavel !== role) continue;
        byId.delete(id);
      }

      const next = { prospects: [...byId.values()].slice(0, MAX_PROSPECTS), goal: current.goal || 0, goals: current.goals };
      if (role === 'dono') {
        if (typeof body.goal === 'number' && body.goal >= 0) next.goal = body.goal;
        if (body.goals && typeof body.goals === 'object') {
          for (const [m, v] of Object.entries(body.goals)) {
            if (/^\d{4}-\d{2}$/.test(m) && typeof v === 'number' && v >= 0) next.goals[m] = v;
          }
        }
      }
      await kv.set(KEY, next);
      return res.status(200).json({ ok: true, ...view(next, role) });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error('Erro no /api/data:', err);
    return res.status(500).json({ error: 'Erro ao acessar o banco de dados' });
  }
}

// Página pública de assinatura: o cliente abre o link, lê e assina.
import { kv } from '@vercel/kv';
import { createHash, randomBytes } from 'crypto';

const KEY = 'painel_dados', LOG_KEY = 'painel_log', IDX = 'painel_ct_index';
const ID_RE = /^[a-f0-9]{32}$/;
const digits = (v) => String(v || '').replace(/\D/g, '');

function cpfOk(c) {
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (const n of [9, 10]) { let s = 0; for (let i = 0; i < n; i++) s += +c[i] * (n + 1 - i); const d = ((s * 10) % 11) % 10; if (d !== +c[n]) return false; }
  return true;
}
function cnpjOk(c) {
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  for (const n of [12, 13]) { let s = 0, p = n - 7; for (let i = 0; i < n; i++) { s += +c[i] * p--; if (p < 2) p = 9; } const d = s % 11 < 2 ? 0 : 11 - (s % 11); if (d !== +c[n]) return false; }
  return true;
}
export const docHash = (c) => createHash('sha256').update(JSON.stringify({ id: c.id, createdAt: c.createdAt, contractor: c.contractor, client: c.client, items: c.items, once: c.once, monthly: c.monthly, clauses: c.clauses })).digest('hex');

const publicView = (c) => ({ id: c.id, status: c.status, createdAt: c.createdAt, contractor: c.contractor, client: c.client, items: c.items, once: c.once, monthly: c.monthly, clauses: c.clauses, hash: docHash(c), signature: c.signature || null });

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const id = String(req.query.id || '');
    if (!ID_RE.test(id)) return res.status(404).json({ error: 'Contrato não encontrado.' });
    const key = 'painel_ct_' + id;
    const c = await kv.get(key);
    if (!c || c.status === 'cancelado') return res.status(404).json({ error: 'Contrato não encontrado ou cancelado.' });

    if (req.method === 'GET') return res.status(200).json(publicView(c));

    if (req.method === 'POST') {
      const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
      const rk = 'painel_sign_' + ip, n = await kv.incr(rk);
      if (n === 1) await kv.expire(rk, 600);
      if (n > 15) return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
      if (c.status !== 'pendente') return res.status(409).json({ error: 'Este contrato já foi assinado.' });
      const b = req.body || {};
      const name = String(b.name || '').trim().replace(/\s+/g, ' ').slice(0, 120), doc = digits(b.doc);
      if (name.length < 5 || !name.includes(' ')) return res.status(400).json({ error: 'Digite seu nome completo.' });
      if (!(cpfOk(doc) || cnpjOk(doc))) return res.status(400).json({ error: 'CPF ou CNPJ inválido.' });
      if (b.accept !== true) return res.status(400).json({ error: 'Marque que leu e concorda com o contrato.' });
      const now = Date.now();
      c.signature = { name, doc, at: now, ip, ua: String(req.headers['user-agent'] || '').slice(0, 250) };
      c.status = 'assinado';
      c.signature.hash = docHash(c);
      await kv.set(key, c);
      const idx = (await kv.get(IDX)) || [];
      const e = idx.find((x) => x.id === id); if (e) { e.status = 'assinado'; e.signedAt = now; await kv.set(IDX, idx); }
      try { // venda fechada: atualiza o lead e registra no histórico de atividade
        if (c.leadId) {
          const data = await kv.get(KEY);
          const p = data && (data.prospects || []).find((x) => x.id === c.leadId);
          if (p) {
            p.status = 'fechado'; p.closedAt = new Date(now).toISOString(); p.nextContact = '';
            p.value = c.once > 0 ? c.once : c.monthly; p.recurring = !(c.once > 0) && c.monthly > 0;
            p.history = [...(p.history || []), { at: new Date(now).toISOString(), type: 'status', text: 'Contrato assinado pelo cliente' }].slice(-60);
            p.updatedAt = now; await kv.set(KEY, data);
          }
        }
        const log = (await kv.get(LOG_KEY)) || [];
        log.unshift({ at: now, by: 'cliente', lead: c.leadId || '', name: c.client.name, type: 'contract', text: 'Contrato assinado por ' + name });
        await kv.set(LOG_KEY, log.slice(0, 500));
      } catch (err) { console.error('pós-assinatura', err); }
      return res.status(200).json(publicView(c));
    }
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error('Erro no /api/contract:', err);
    return res.status(500).json({ error: 'Erro ao processar. Tente novamente.' });
  }
}

import { kv } from '@vercel/kv';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHmac, timingSafeEqual, randomBytes, scryptSync } from 'node:crypto';

const KEY = 'painel_dados';
const SESSION_MS = 12 * 3600 * 1000;
const MAX_PROSPECTS = 2000;
const SEED_FLAG = 'painel_seed_v1';

// Carga inicial única de prospectos (api/seed.json). Registros apagados depois não voltam.
async function applySeed(current) {
  if (await kv.get(SEED_FLAG)) return current;
  let seed = [];
  try { seed = JSON.parse(readFileSync(join(process.cwd(), 'api', 'seed.json'), 'utf8')); } catch { return current; }
  const have = new Set(current.prospects.map((p) => p.id));
  for (const raw of seed) {
    const p = clean(raw, 'dono');
    if (p && !have.has(p.id)) current.prospects.push(p);
  }
  await kv.set(KEY, current);
  await kv.set(SEED_FLAG, 1);
  return current;
}

// Dono: senha em PAINEL_SENHA_DONO (ou o padrão abaixo). Funcionários: ficam no banco (aba Equipe), com senha criptografada.
// Fábio ('estagiario') e Diogo ('diogo') são criados na primeira execução com as senhas iniciais abaixo; depois a senha é trocada pela aba Equipe.
const DONO_PW = process.env.PAINEL_SENHA_DONO || 'BS100218*';
const EMP_KEY = 'painel_funcionarios';
const SECRET_KEY = 'painel_secret';
const INICIAIS = [
  { id: 'estagiario', name: 'Fábio', pw: process.env.PAINEL_SENHA_ESTAGIARIO || 'Fabio2026*' },
  { id: 'diogo', name: 'Diogo', pw: process.env.PAINEL_SENHA_DIOGO || 'Diogo2026*' }
];

const hashPw = (pw) => { const salt = randomBytes(16).toString('hex'); return salt + ':' + scryptSync(String(pw), salt, 32).toString('hex'); };
function checkPw(pw, stored) {
  const [salt, h] = String(stored || '').split(':');
  if (!salt || !h) return false;
  return safeEqual(scryptSync(String(pw), salt, 32).toString('hex'), h);
}

async function loadEmployees() {
  let list = await kv.get(EMP_KEY);
  if (!Array.isArray(list)) {
    list = INICIAIS.map((e) => ({ id: e.id, name: e.name, hash: hashPw(e.pw), active: true, createdAt: Date.now() }));
    await kv.set(EMP_KEY, list);
  }
  return list;
}
async function getSecret() {
  if (process.env.PAINEL_SECRET) return process.env.PAINEL_SECRET;
  let sec = await kv.get(SECRET_KEY);
  if (!sec) { await kv.set(SECRET_KEY, randomBytes(32).toString('hex'), { nx: true }); sec = await kv.get(SECRET_KEY); }
  return sec;
}

const sign = (payload, secret) => createHmac('sha256', secret).update(payload).digest('base64url');

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function makeToken(role, secret) {
  const payload = Buffer.from(JSON.stringify({ role, exp: Date.now() + SESSION_MS })).toString('base64url');
  return payload + '.' + sign(payload, secret);
}

// devolve o perfil ('dono' ou id de funcionário ativo) ou null
function readToken(req, secret, emps) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !safeEqual(sig, sign(payload, secret))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.exp || data.exp < Date.now()) return null;
    if (data.role === 'dono') return 'dono';
    return emps.some((e) => e.id === data.role && e.active) ? data.role : null;
  } catch { return null; }
}

const STATUS = ['novo', 'prospectando', 'semresposta', 'negociando', 'fechado', 'perdido'];
// Quem assumiu o contato com o prospecto (só uma pessoa por vez). Prospectos antigos de estagiário/Diogo contam como assumidos por quem os criou.
const claimOf = (p) => (p && (p.claimedBy || (p.responsavel && p.responsavel !== 'dono' ? p.responsavel : ''))) || '';
const str = (v, n) => String(v ?? '').slice(0, n);

function clean(p, role, ids = ['dono']) {
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
    paidAt: p.paidAt ? str(p.paidAt, 30) : '',
    paidNote: str(p.paidNote, 200),
    claimedBy: ids.includes(p.claimedBy) && p.claimedBy !== 'dono' ? p.claimedBy : '',
    responsavel: role !== 'dono' ? role : (ids.includes(p.responsavel) ? p.responsavel : 'dono'),
    history,
    updatedAt: Number(p.updatedAt) || Date.now()
  };
}

// Funcionários (todo perfil que não é 'dono') trabalham em TODOS os prospectos, sem acesso a valores de outros, comissões e meta.
// O nome de quem assumiu um prospecto fica escondido deles: veem só que está indisponível.
function view(data, role, emps) {
  const users = {};
  if (role === 'dono') for (const e of emps) users[e.id] = { name: e.name, active: e.active };
  if (role === 'dono') return { ...data, users };
  const me = emps.find((e) => e.id === role);
  users[role] = { name: me ? me.name : '', active: true };
  const prospects = (data.prospects || []).map((p) =>
    p.responsavel === role && claimOf(p) === role ? p
      : (claimOf(p) && claimOf(p) !== role) || (!claimOf(p) && p.status !== 'novo') ? { ...p, value: null, contact: '', notes: '', history: [], nextContact: '', claimedBy: '*', responsavel: '*' }
      : { ...p, value: null, responsavel: p.responsavel === 'dono' ? 'dono' : '*' }
  );
  return { prospects, goal: null, goals: null, users };
}

async function loginLimit(req) {
  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const k = 'painel_login_' + ip;
  const n = await kv.incr(k);
  if (n === 1) await kv.expire(k, 600);
  return n <= 8;
}

const TPL_KEY = 'painel_modelos', LOG_KEY = 'painel_log', BAK_KEY = 'painel_backups', BAK_AT = 'painel_backup_at';
const RELEASE_MS = 7 * 86400000, BAK_EVERY = 86400000, BAK_KEEP = 14;
const OPEN = ['novo', 'prospectando', 'semresposta', 'negociando'];

const MODELOS = [
  ['Primeiro contato', 'Geral', 'Oi, {nome}! Tudo bem? Aqui é {meu_nome}, da Creative Codex, de São Carlos, SP. A gente cria sites e artes para negócios como o seu. Posso te mandar uma ideia rápida de como ficaria o seu?'],
  ['Primeiro contato', 'Academia', 'Oi, {nome}! Tudo bem? Aqui é {meu_nome}, da Creative Codex. A gente faz site e landing page para academias, com planos, horários e botão direto para matrícula no WhatsApp. Posso te mostrar um exemplo?'],
  ['Primeiro contato', 'Restaurante', 'Oi, {nome}! Tudo bem? Aqui é {meu_nome}, da Creative Codex. A gente faz cardápio digital com QR Code e pedidos pelo WhatsApp, sem taxa por pedido. Posso te mostrar como fica?'],
  ['Primeiro contato', 'Igreja', 'Oi, {nome}! Paz do Senhor! Aqui é {meu_nome}, da Creative Codex. A gente cria sites para igrejas, com programação dos cultos, avisos, eventos e área de contribuição. Posso te mostrar um exemplo?'],
  ['Acompanhamento', 'Geral', 'Oi, {nome}! Passando para saber se você chegou a ver minha mensagem sobre {servico}. Se fizer sentido, te mando uma proposta sem compromisso.'],
  ['Envio de proposta', 'Geral', '{nome}, segue a proposta de {servico}. Qualquer dúvida é só me chamar, e posso ajustar o que for preciso.'],
  ['Após o fechamento', 'Geral', 'Fechado, {nome}! Para começar, vou precisar do logo, das cores e dos textos do seu negócio. Posso te mandar a lista do que preciso?'],
  ['Acompanhamento', 'Segundo contato', 'Oi, {nome}! Sei que a rotina é corrida. Só queria saber se faz sentido conversarmos sobre {servico}. Se preferir, te mando um exemplo pronto para você ver como fica.'],
  ['Acompanhamento', 'Último contato', 'Oi, {nome}! Vou encerrar por aqui para não incomodar. Se mais para frente quiser {servico}, é só me chamar. Fico à disposição!'],
  ['Negociação', 'Pediu desconto', 'Entendo, {nome}. O valor já considera o tempo de criação e a entrega completa. Posso te oferecer pagamento em duas parcelas ou um pacote mais enxuto de {servico}. Qual prefere?'],
  ['Contrato', 'Envio do link', '{nome}, seu contrato de {servico} está pronto. É só abrir o link, ler e assinar pelo celular. Qualquer dúvida, me chame.'],
  ['Pagamento', 'Lembrete', 'Oi, {nome}! Passando para lembrar do pagamento de {servico}. Se já fez, pode desconsiderar. Qualquer dúvida, me chame.'],
  ['Pós-entrega', 'Pedido de indicação', '{nome}, que bom que você gostou do resultado! Se conhecer alguém que também precisa de site ou artes, pode me indicar. Vou cuidar bem dele, como cuidei de você.'],
  ['Manutenção', 'Mensal', 'Oi, {nome}! Passando para lembrar que a manutenção mensal do seu site está ativa. Se precisar trocar textos, fotos ou preços, é só me mandar por aqui.']
].map(([title, segment, text], i) => ({ id: 'm' + (i + 1), title, segment, text }));

async function logPush(entries) {
  if (!entries.length) return;
  const old = (await kv.get(LOG_KEY)) || [];
  await kv.set(LOG_KEY, [...entries.slice().reverse(), ...old].slice(0, 500));
}

// lead assumido e parado por 7 dias volta para a fila livre
// lead livre fica como 'novo'; lead com dono deixa de ser 'novo'
function normStatus(cur, migrate) {
  let n = 0;
  for (const p of cur.prospects) {
    const c = claimOf(p);
    if (!c && OPEN.includes(p.status) && p.status !== 'novo' && migrate) { p.status = 'novo'; n++; } // migração única
    else if (c && p.status === 'novo') { p.status = 'prospectando'; n++; }
  }
  return n;
}

// migração única: lead assumido sem nenhum contato registrado volta para a fila
function releaseUntouched(cur, entries) {
  const noteless = (p) => !String(p.notes || '').trim();
  let n = 0;
  for (const p of cur.prospects) {
    const c = claimOf(p);
    if (!c || (p.status !== 'prospectando' && p.status !== 'novo') || p.nextContact) continue;
    if (!noteless(p) || (p.history || []).some((h) => h.type === 'contact' || h.type === 'note')) continue;
    entries.push({ at: Date.now(), by: 'sistema', lead: p.id, name: p.name, type: 'release', text: 'Liberado: assumido sem contato registrado', who: c });
    p.claimedBy = ''; if (p.responsavel === c) p.responsavel = 'dono'; p.status = 'novo'; p.updatedAt = Date.now(); n++;
  }
  return n;
}

function autoRelease(cur, entries) {
  const now = Date.now(), t = new Date().toISOString().slice(0, 10);
  let n = 0;
  for (const p of cur.prospects) {
    const c = claimOf(p);
    if (!c || !OPEN.includes(p.status) || now - (p.updatedAt || 0) < RELEASE_MS || (p.nextContact && p.nextContact >= t)) continue;
    entries.push({ at: now, by: 'sistema', lead: p.id, name: p.name, type: 'release', text: 'Liberado por falta de atividade (7 dias)', who: c });
    p.claimedBy = ''; if (p.responsavel === c) p.responsavel = 'dono'; p.status = 'novo'; p.updatedAt = now; n++;
  }
  return n;
}

async function snapshot(cur, emps, kind) {
  const at = Date.now(), id = String(at);
  const data = { at, prospects: cur.prospects, goal: cur.goal || 0, goals: cur.goals || {}, employees: emps.map((e) => ({ id: e.id, name: e.name, active: e.active })) };
  await kv.set('painel_bak_' + id, data);
  const idx = (await kv.get(BAK_KEY)) || [];
  idx.unshift({ id, at, kind, count: cur.prospects.length });
  for (const old of idx.splice(BAK_KEEP)) await kv.del('painel_bak_' + old.id);
  await kv.set(BAK_KEY, idx);
  await kv.set(BAK_AT, at);
}

const IG_TOKEN = 'painel_insta_token';
async function igGet(path, params, token) {
  const url = 'https://graph.instagram.com/' + path + '?' + new URLSearchParams({ ...params, access_token: token });
  const r = await fetch(url), j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error((j.error && j.error.message) || 'erro ' + r.status);
  return j;
}
// busca os números atuais e grava o registro de hoje (no máximo 1 vez por dia, a menos que force)
async function igSync(force) {
  let c = await kv.get(IG_TOKEN);
  if (!c) return;
  const today = new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10);
  let list = (await kv.get('painel_insta')) || [];
  if (!force && c.synced === today) return;
  if (Date.now() - c.at > 30 * 86400000) { // renova o token (vale 60 dias)
    try { const r = await igGet('refresh_access_token', { grant_type: 'ig_refresh_token' }, c.token); c = { ...c, token: r.access_token || c.token, at: Date.now() }; } catch (e) { console.error('ig refresh', e.message); }
  }
  const p = await igGet('me', { fields: 'followers_count,follows_count,media_count' }, c.token);
  let reach = 0, interactions = 0;
  try {
    const until = Math.floor(Date.now() / 1000), since = until - 29 * 86400;
    const ins = await igGet('me/insights', { metric: 'reach,total_interactions', metric_type: 'total_value', period: 'day', since, until }, c.token);
    for (const m of ins.data || []) { const v = m.total_value && m.total_value.value; if (m.name === 'reach') reach = v || 0; if (m.name === 'total_interactions') interactions = v || 0; }
  } catch (e) { const last = list[list.length - 1]; if (last) { reach = last.reach; interactions = last.interactions; } console.error('ig insights', e.message); }
  list = list.filter((x) => x.date !== today);
  list.push({ date: today, followers: p.followers_count || 0, following: p.follows_count || 0, posts: p.media_count || 0, reach, interactions, note: 'Automático' });
  await kv.set('painel_insta', list.sort((x, y) => x.date.localeCompare(y.date)).slice(-400));
  await kv.set(IG_TOKEN, { ...c, synced: today });
}

const PRICE_KEY = 'painel_precos';
const PRECOS = {
  services: [
    { name: 'Landing Page', price: 600, deadline: '5 dias úteis', recurring: false, includes: ['1 página responsiva (celular e computador)', 'Botão e link direto para o WhatsApp', 'Formulário de contato', 'SEO básico para aparecer no Google', 'Publicação no ar'] },
    { name: 'Site Institucional', price: 1200, deadline: '10 dias úteis', recurring: false, includes: ['Até 5 páginas (início, sobre, serviços, galeria, contato)', 'Design personalizado e responsivo', 'Botão do WhatsApp e redes sociais', 'SEO básico e mapa do Google', 'Publicação no ar'] },
    { name: 'Cardápio Digital', price: 500, deadline: '7 dias úteis', recurring: false, includes: ['Cardápio online com fotos e categorias', 'QR Code para as mesas', 'Pedidos direto no WhatsApp, sem taxa', 'Atualização fácil dos preços'] },
    { name: 'Loja Virtual', price: 2500, deadline: '20 dias úteis', recurring: false, includes: ['Catálogo de produtos', 'Carrinho e pagamento online', 'Painel para gerenciar pedidos', 'Design responsivo', 'Treinamento de uso'] },
    { name: 'Manutenção mensal do site', price: 150, deadline: 'Mensal', recurring: true, includes: ['Atualizações de textos e imagens', 'Monitoramento e backups', 'Suporte pelo WhatsApp'] },
    { name: 'Pacote de artes para redes sociais', price: 250, deadline: '5 dias úteis', recurring: false, includes: ['8 artes para feed ou stories', 'Identidade visual do cliente', 'Arquivos prontos para postar'] },
    { name: 'Identidade visual (logo)', price: 400, deadline: '7 dias úteis', recurring: false, includes: ['Criação do logotipo', '2 propostas e 2 ajustes', 'Arquivos em PNG e vetor'] }
  ].map((x, i) => ({ id: 's' + i, ...x })),
  extras: [['Domínio .com.br (1 ano)', 60], ['Hospedagem (1 ano)', 240], ['Textos profissionais', 150], ['Página extra', 150], ['Integração com Google Meu Negócio', 120], ['Entrega urgente (metade do prazo)', 200]].map(([name, price], i) => ({ id: 'e' + i, name, price }))
};

const trim = (v, n) => String(v ?? '').trim().slice(0, n);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const emps = await loadEmployees();
    const secret = await getSecret();

    // login
    if (req.method === 'POST' && req.query.action === 'login') {
      if (!(await loginLimit(req))) return res.status(429).json({ error: 'Muitas tentativas. Aguarde 10 minutos.' });
      const pw = (req.body || {}).password || '';
      let role = safeEqual(pw, DONO_PW) ? 'dono' : null;
      if (!role) { const e = emps.find((x) => x.active && checkPw(pw, x.hash)); if (e) role = e.id; }
      if (!role) return res.status(401).json({ error: 'Senha incorreta.' });
      return res.status(200).json({ token: makeToken(role, secret), role, expiresIn: SESSION_MS });
    }

    const role = readToken(req, secret, emps);
    if (!role) return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
    const ids = ['dono', ...emps.map((e) => e.id)];

    const current = (await kv.get(KEY)) || { prospects: [], goal: 0, goals: {} };
    current.prospects = current.prospects || [];
    current.goals = current.goals || {};
    try { await applySeed(current); } catch (e) { console.error('seed', e); }

    const logs = [];
    try {
      if (!(await kv.get('painel_novo_v6'))) { // pedido do dono: todos os prospectos em aberto voltam para Novo, sem responsável
        await snapshot(current, emps, 'antes de zerar');
        let z = 0;
        for (const p of current.prospects) {
          if (!OPEN.includes(p.status) || (p.status === 'novo' && !claimOf(p))) continue;
          p.status = 'novo'; p.claimedBy = ''; p.responsavel = 'dono'; p.updatedAt = Date.now(); z++;
        }
        logs.push({ at: Date.now(), by: 'sistema', type: 'release', text: 'Todos os prospectos em aberto voltaram para Novo (' + z + ')' });
        await kv.set(KEY, current); await kv.set('painel_novo_v6', 1);
      }
      const mig = !(await kv.get('painel_novo_v2')), mig3 = !(await kv.get('painel_novo_v5'));
      if (autoRelease(current, logs) + normStatus(current, mig) + (mig3 ? releaseUntouched(current, logs) : 0)) { await kv.set(KEY, current); await logPush(logs.splice(0)); }
      if (mig) await kv.set('painel_novo_v2', 1);
      if (mig3) await kv.set('painel_novo_v5', 1);
      const lastBak = Number(await kv.get(BAK_AT)) || 0;
      if (current.prospects.length && Date.now() - lastBak > BAK_EVERY) await snapshot(current, emps, 'auto');
    } catch (e) { console.error('manutenção', e); }

    // dono entra na conta de um funcionário sem precisar da senha dele
    if (req.method === 'POST' && req.query.action === 'impersonate') {
      if (role !== 'dono') return res.status(403).json({ error: 'Sem permissão.' });
      const id = String((req.body || {}).id || '');
      if (id === 'dono') return res.status(200).json({ token: makeToken('dono', secret), role: 'dono' });
      const e = emps.find((x) => x.id === id && x.active);
      if (!e) return res.status(404).json({ error: 'Funcionário não encontrado.' });
      await logPush([{ at: Date.now(), by: 'dono', type: 'impersonate', text: 'Dono entrou na conta de ' + e.name, who: e.id }]);
      return res.status(200).json({ token: makeToken(e.id, secret), role: e.id });
    }

    // dados da empresa (contratada nos contratos)
    if (req.query.action === 'company') {
      if (req.method === 'POST') {
        if (role !== 'dono') return res.status(403).json({ error: 'Sem permissão.' });
        const b = req.body || {};
        const co = { name: trim(b.name, 120), doc: trim(b.doc, 20), address: trim(b.address, 200), email: trim(b.email, 120), whatsapp: trim(b.whatsapp, 30) };
        await kv.set('painel_empresa', co);
        return res.status(200).json({ company: co });
      }
      return res.status(200).json({ company: (await kv.get('painel_empresa')) || { name: '', doc: '', address: '', email: '', whatsapp: '(16) 99783-7454' } });
    }

    // contratos (cria, lista e cancela; a assinatura é feita pelo cliente em /api/contract)
    if (req.query.action === 'contracts') {
      let idx = (await kv.get('painel_ct_index')) || [];
      if (req.method === 'POST') {
        const b = req.body || {};
        if (b.cancel) {
          const e = idx.find((x) => x.id === String(b.cancel));
          if (!e || e.status !== 'pendente' || (role !== 'dono' && e.by !== role)) return res.status(403).json({ error: 'Não é possível cancelar.' });
          const c = await kv.get('painel_ct_' + e.id); if (c) { c.status = 'cancelado'; await kv.set('painel_ct_' + e.id, c); }
          e.status = 'cancelado'; await kv.set('painel_ct_index', idx);
        } else if (b.create) {
          const x = b.create, company = (await kv.get('painel_empresa')) || {};
          if (!company.name || !company.doc || !company.address) return res.status(400).json({ error: 'Preencha os dados da empresa antes (botão Dados da empresa, só o dono).' });
          const items = (Array.isArray(x.items) ? x.items : []).slice(0, 30).map((i) => ({ t: trim(i.t, 160), v: Math.round((Number(i.v) || 0) * 100) / 100, rec: !!i.rec })).filter((i) => i.t);
          const clauses = (Array.isArray(x.clauses) ? x.clauses : []).slice(0, 30).map((cl) => ({ h: trim(cl.h, 120), p: (Array.isArray(cl.p) ? cl.p : []).slice(0, 12).map((t) => trim(t, 1800)) })).filter((cl) => cl.h);
          const cl = x.client || {};
          const client = { name: trim(cl.name, 120), doc: trim(cl.doc, 20), address: trim(cl.address, 200), email: trim(cl.email, 120), phone: trim(cl.phone, 30) };
          if (!client.name || !items.length || !clauses.length) return res.status(400).json({ error: 'Dados do contrato incompletos.' });
          const once = items.filter((i) => !i.rec).reduce((s, i) => s + i.v, 0), monthly = items.filter((i) => i.rec).reduce((s, i) => s + i.v, 0);
          const id = randomBytes(16).toString('hex');
          const leadId = trim(x.leadId, 40);
          const c = { id, createdAt: Date.now(), by: role, leadId, status: 'pendente', contractor: company, client, items, once, monthly, clauses };
          await kv.set('painel_ct_' + id, c);
          idx.unshift({ id, client: client.name, total: once || monthly, recurring: !once && monthly > 0, status: 'pendente', createdAt: c.createdAt, by: role, leadId });
          idx = idx.slice(0, 500); await kv.set('painel_ct_index', idx);
          return res.status(200).json({ id, contracts: idx.filter((e) => role === 'dono' || e.by === role) });
        }
      }
      return res.status(200).json({ contracts: idx.filter((e) => role === 'dono' || e.by === role) });
    }

    // tabela de preços (todos leem, só o dono edita)
    if (req.query.action === 'prices') {
      if (req.method === 'POST') {
        if (role !== 'dono') return res.status(403).json({ error: 'Sem permissão.' });
        const b = req.body || {}, n = (v) => Math.max(0, Math.round((Number(v) || 0) * 100) / 100);
        const services = (Array.isArray(b.services) ? b.services : []).slice(0, 30).map((x, i) => ({ id: 's' + i, name: trim(x.name, 80), price: n(x.price), deadline: trim(x.deadline, 40), recurring: !!x.recurring, includes: (Array.isArray(x.includes) ? x.includes : []).slice(0, 12).map((t) => trim(t, 120)).filter(Boolean) })).filter((x) => x.name);
        const extras = (Array.isArray(b.extras) ? b.extras : []).slice(0, 30).map((x, i) => ({ id: 'e' + i, name: trim(x.name, 80), price: n(x.price) })).filter((x) => x.name);
        if (!services.length) return res.status(400).json({ error: 'Informe ao menos um serviço.' });
        await kv.set(PRICE_KEY, { services, extras });
        return res.status(200).json({ prices: { services, extras } });
      }
      return res.status(200).json({ prices: (await kv.get(PRICE_KEY)) || PRECOS });
    }

    // modelos de mensagem (todos leem, só o dono edita)
    if (req.query.action === 'templates') {
      if (req.method === 'POST') {
        if (role !== 'dono') return res.status(403).json({ error: 'Sem permissão.' });
        const list = (Array.isArray((req.body || {}).templates) ? req.body.templates : []).slice(0, 40)
          .map((m) => ({ id: trim(m.id, 20) || 'm' + randomBytes(3).toString('hex'), title: trim(m.title, 60), segment: trim(m.segment, 30) || 'Geral', text: trim(m.text, 1200) }))
          .filter((m) => m.title && m.text);
        await kv.set(TPL_KEY, list);
        return res.status(200).json({ templates: list });
      }
      let tl = await kv.get(TPL_KEY);
      if (tl && !(await kv.get('painel_modelos_v2'))) { // acrescenta os modelos novos a quem já salvou a lista
        const have = new Set(tl.map((x) => x.id));
        tl = [...tl, ...MODELOS.filter((m) => !have.has(m.id))];
        await kv.set(TPL_KEY, tl); await kv.set('painel_modelos_v2', 1);
      }
      return res.status(200).json({ templates: tl || MODELOS });
    }

    // conexão automática com o Instagram (token guardado só no servidor)
    if (req.query.action === 'insta_connect') {
      if (role !== 'dono') return res.status(403).json({ error: 'Sem permissão.' });
      if (req.method === 'POST') {
        const b = req.body || {};
        if (b.disconnect) { await kv.del(IG_TOKEN); return res.status(200).json({ connected: false }); }
        const token = trim(b.token, 600).replace(/\s/g, '');
        if (token.length < 30) return res.status(400).json({ error: 'Cole o token completo.' });
        try {
          const me = await igGet('me', { fields: 'user_id,username' }, token);
          await kv.set(IG_TOKEN, { token, id: String(me.user_id || me.id), username: me.username, at: Date.now() });
          await igSync(true);
        } catch (e) { return res.status(400).json({ error: 'O Instagram recusou o token: ' + e.message }); }
      }
      const c = await kv.get(IG_TOKEN);
      return res.status(200).json({ connected: !!c, username: c ? c.username : '', insta: (await kv.get('painel_insta')) || [] });
    }

    // números do Instagram (só o dono, lançados à mão)
    if (req.query.action === 'insta') {
      if (role !== 'dono') return res.status(403).json({ error: 'Sem permissão.' });
      let list = (await kv.get('painel_insta')) || [];
      let ig = await kv.get(IG_TOKEN), igError = '';
      if (ig && req.query.sync) { try { await igSync(req.query.sync === 'force'); list = (await kv.get('painel_insta')) || []; } catch (e) { igError = e.message; } }
      if (req.method === 'POST') {
        const b = req.body || {};
        const date = /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : '';
        if (!date) return res.status(400).json({ error: 'Data inválida.' });
        list = list.filter((x) => x.date !== date);
        if (!b.remove) {
          const n = (v) => Math.max(0, Math.round(Number(v) || 0));
          list.push({ date, followers: n(b.followers), following: n(b.following), posts: n(b.posts), reach: n(b.reach), interactions: n(b.interactions), note: trim(b.note, 200) });
        }
        list = list.sort((x, y) => x.date.localeCompare(y.date)).slice(-400);
        await kv.set('painel_insta', list);
      }
      return res.status(200).json({ insta: list, connected: !!ig, username: ig ? ig.username : '', igError });
    }

    // atividade e backups (só o dono)
    if (req.query.action === 'log' || req.query.action === 'backups') {
      if (role !== 'dono') return res.status(403).json({ error: 'Sem permissão.' });
      if (req.query.action === 'log') return res.status(200).json({ log: ((await kv.get(LOG_KEY)) || []).slice(0, 200) });
      if (req.method === 'GET' && req.query.id) {
        const d = await kv.get('painel_bak_' + String(req.query.id).replace(/\D/g, ''));
        return d ? res.status(200).json(d) : res.status(404).json({ error: 'Backup não encontrado.' });
      }
      if (req.method === 'POST') {
        const b = req.body || {};
        if (b.restore) {
          const d = await kv.get('painel_bak_' + String(b.restore).replace(/\D/g, ''));
          if (!d || !Array.isArray(d.prospects)) return res.status(404).json({ error: 'Backup não encontrado.' });
          await snapshot(current, emps, 'antes de restaurar');
          const now = Date.now();
          current.prospects = d.prospects.map((p) => ({ ...p, updatedAt: now }));
          current.goal = d.goal || 0; current.goals = d.goals || {};
          await kv.set(KEY, current);
          await logPush([{ at: now, by: 'dono', lead: '', name: '', type: 'restore', text: 'Backup restaurado (' + d.prospects.length + ' leads)' }]);
          return res.status(200).json({ ok: true });
        }
        await snapshot(current, emps, 'manual');
      }
      return res.status(200).json({ backups: (await kv.get(BAK_KEY)) || [] });
    }

    // cadastro de funcionários (só o dono)
    if (req.query.action === 'employees') {
      if (role !== 'dono') return res.status(403).json({ error: 'Sem permissão.' });
      if (req.method === 'GET') {
        const list = emps.map((e) => {
          const mine = current.prospects.filter((p) => claimOf(p) === e.id);
          return { id: e.id, name: e.name, active: e.active, createdAt: e.createdAt, leads: mine.length, closed: mine.filter((p) => p.status === 'fechado').length };
        });
        return res.status(200).json({ employees: list });
      }
      if (req.method === 'POST') {
        const b = req.body || {};
        const name = trim(b.name, 40), pw = String(b.password || '');
        let e = b.id ? emps.find((x) => x.id === String(b.id)) : null;
        if (b.id && !e) return res.status(404).json({ error: 'Funcionário não encontrado.' });
        if (!e && name.length < 2) return res.status(400).json({ error: 'Informe o nome.' });
        if (!e && pw.length < 6) return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
        if (e && pw && pw.length < 6) return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
        if (pw && (safeEqual(pw, DONO_PW) || emps.some((x) => x !== e && x.active && checkPw(pw, x.hash)))) return res.status(400).json({ error: 'Essa senha já está em uso. Escolha outra.' });
        if (!e) { e = { id: 'f' + randomBytes(3).toString('hex'), name, hash: hashPw(pw), active: true, createdAt: Date.now() }; emps.push(e); }
        else {
          if (name) e.name = name;
          if (pw) e.hash = hashPw(pw);
          if (typeof b.active === 'boolean' && b.active !== e.active) {
            e.active = b.active;
            if (!e.active) { // libera os leads em aberto dele para outras pessoas
              for (const p of current.prospects) {
                if (claimOf(p) === e.id && p.status !== 'fechado' && p.status !== 'perdido') { p.claimedBy = ''; if (p.responsavel === e.id) p.responsavel = 'dono'; p.status = 'novo'; p.updatedAt = Date.now(); }
              }
              await kv.set(KEY, current);
            }
          }
        }
        if (e && b.release === true) { // devolve todos os leads em aberto dele para a fila
          let n = 0;
          for (const p of current.prospects) {
            const worked = String(p.notes || '').trim() || p.nextContact || (p.history || []).some((h) => h.type === 'contact');
            if (claimOf(p) === e.id && p.status !== 'fechado' && p.status !== 'perdido' && !worked) { p.claimedBy = ''; if (p.responsavel === e.id) p.responsavel = 'dono'; p.status = 'novo'; p.updatedAt = Date.now(); n++; }
          }
          await kv.set(KEY, current);
          return res.status(200).json({ ok: true, released: n });
        }
        await kv.set(EMP_KEY, emps);
        return res.status(200).json({ ok: true });
      }
    }

    if (req.method === 'GET') return res.status(200).json(view(current, role, emps));

    if (req.method === 'POST') {
      const body = req.body || {};
      const incoming = Array.isArray(body.prospects) ? body.prospects : [];
      const deleted = new Set(Array.isArray(body.deleted) ? body.deleted.map(String) : []);
      const byId = new Map(current.prospects.map((p) => [p.id, p]));
      const conflicts = [];

      for (const raw of incoming.slice(0, MAX_PROSPECTS)) {
        const p = clean(raw, role, ids);
        if (!p) continue;
        const old = byId.get(p.id);
        if (role !== 'dono') {
          if (old && !(p.updatedAt > old.updatedAt)) continue; // funcionário reenviou a lista sem mexer neste lead: não assume
          if (old && ((claimOf(old) && claimOf(old) !== role) || (!claimOf(old) && old.status !== 'novo'))) { conflicts.push(p.id); continue; } // outra pessoa já assumiu, ou o dono reservou
          p.claimedBy = role; // quem mexe primeiro assume o prospecto
          p.commissionPaid = old ? old.commissionPaid : false;
          p.paidAt = old ? old.paidAt || '' : ''; p.paidNote = old ? old.paidNote || '' : '';
          if (old && old.responsavel === 'dono' && !claimOf(old)) {
            p.responsavel = role; // lead livre do dono: quem assume passa a ser o responsável e recebe a comissão
            p.value = p.value != null ? p.value : (old.value || 0);
          } else if (old && old.responsavel !== role) { // em prospecto de outro: só dados de trabalho
            p.value = old.value; p.recurring = old.recurring; p.responsavel = old.responsavel;
          }
        }
        if (role === 'dono' && old && !Object.prototype.hasOwnProperty.call(raw, 'claimedBy')) p.claimedBy = old.claimedBy || '';
        if (p.status === 'novo' && claimOf(p)) p.status = 'prospectando';
        if (old && old.updatedAt > p.updatedAt) continue; // versão mais nova já salva
        if (old && role !== 'dono' && old.value != null && p.value == null) p.value = old.value;
        if (!old) logs.push({ at: Date.now(), by: role, lead: p.id, name: p.name, type: 'new', text: 'Lead cadastrado' });
        else {
          if (!claimOf(old) && claimOf(p)) logs.push({ at: Date.now(), by: role, lead: p.id, name: p.name, type: 'claim', text: 'Assumiu o lead', who: claimOf(p) });
          if (old.status !== p.status) logs.push({ at: Date.now(), by: role, lead: p.id, name: p.name, type: 'status', text: old.status + ' > ' + p.status });
          if (!old.commissionPaid && p.commissionPaid) logs.push({ at: Date.now(), by: role, lead: p.id, name: p.name, type: 'paid', text: 'Comissão paga' });
        }
        byId.set(p.id, p);
      }
      for (const id of deleted) {
        const old = byId.get(id);
        if (!old) continue;
        if (role !== 'dono' && old.responsavel !== role) continue;
        logs.push({ at: Date.now(), by: role, lead: id, name: old.name, type: 'delete', text: 'Lead excluído' });
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
      try { await logPush(logs); } catch (e) { console.error('log', e); }
      return res.status(200).json({ ok: true, conflicts, ...view(next, role, emps) });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error('Erro no /api/data:', err);
    return res.status(500).json({ error: 'Erro ao acessar o banco de dados' });
  }
}

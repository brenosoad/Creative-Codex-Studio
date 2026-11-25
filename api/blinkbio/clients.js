const { pipeline } = require('./_redis');
const { isAdmin, newKey } = require('./_auth');

const SLUG = /^[a-z0-9-]{1,32}$/;
const HEX = /^#[0-9a-f]{6}$/i;
const MAX_BODY = 150 * 1024;
const TIPOS = new Set(['capa', 'destaque', 'parceiro']);

const str = (v, n = 300) => (typeof v === 'string' ? v.slice(0, n) : '');
const link = v => (/^(https?:\/\/|#)/i.test(str(v, 600)) ? str(v, 600) : '');
const imgRef = v => (/^(img:[a-z0-9._-]{1,60}|img\/[\w./-]{1,80}|https?:\/\/\S{1,300})$/i.test(str(v, 400)) ? str(v, 400) : '');
const num = v => (Number.isFinite(+v) && +v > 0 && +v < 10000 ? Math.round(+v) : undefined);

function cleanCard(c, i) {
  if (!c || !TIPOS.has(c.tipo)) return null;
  const o = {
    tipo: c.tipo,
    id: SLUG.test(c.id || '') ? c.id : `card-${i + 1}`,
    cat: SLUG.test(c.cat || '') ? c.cat : undefined,
    titulo: str(c.titulo, 120), texto: str(c.texto, 280), selo: str(c.selo, 30),
    kicker: str(c.kicker, 40), cta: str(c.cta, 40), aria: str(c.aria, 120),
    marca: str(c.marca, 60), valor: str(c.valor, 12), sufixo: str(c.sufixo, 20),
    cupom: str(c.cupom, 30), link: link(c.link), botao: str(c.botao, 30),
    imagem: imgRef(c.imagem), alt: str(c.alt, 140), posicao: /^[\d.%a-z\s-]{1,30}$/i.test(c.posicao || '') ? c.posicao : undefined,
    alinhar: c.alinhar === 'centro' || c.alinhar === 'direita' ? c.alinhar : undefined,
    w: num(c.w), h: num(c.h),
    claro: c.claro ? true : undefined, destaqueBotao: c.destaqueBotao ? true : undefined
  };
  Object.keys(o).forEach(k => (o[k] === '' || o[k] === undefined) && delete o[k]);
  return o;
}

const LARG = { pc: ['terco', 'meia', 'cheia'], cel: ['meia', 'cheia'] };
function cleanLayout(l) {
  const out = {};
  for (const m of ['pc', 'cel']) {
    const x = l && l[m]; if (!x || typeof x !== 'object') continue;
    const ordem = (Array.isArray(x.ordem) ? x.ordem : []).filter(i => typeof i === 'string' && SLUG.test(i)).slice(0, 40);
    const larg = {};
    Object.entries(x.larg && typeof x.larg === 'object' ? x.larg : {}).slice(0, 40).forEach(([k, v]) => { if (SLUG.test(k) && LARG[m].includes(v)) larg[k] = v; });
    if (ordem.length || Object.keys(larg).length) out[m] = { ordem: ordem.length ? ordem : undefined, larg: Object.keys(larg).length ? larg : undefined };
  }
  return Object.keys(out).length ? out : undefined;
}

function cleanTam(t) {
  const o = {};
  Object.entries(t && typeof t === 'object' ? t : {}).slice(0, 60).forEach(([k, v]) => {
    const n = Math.round(+v * 100) / 100;
    if (/^[A-Za-z0-9_-]{1,40}(\.[A-Za-z0-9]{1,12}){1,3}$/.test(k) && n >= 0.5 && n <= 2.5 && n !== 1) o[k] = n;
  });
  return Object.keys(o).length ? o : undefined;
}
function clean(c) {
  const t = c.tema || {}, cats = {};
  Object.entries(c.categorias || {}).slice(0, 8).forEach(([k, v]) => { if (SLUG.test(k)) cats[k] = str(v, 30); });
  const logo = c.logo?.arquivo ? { arquivo: imgRef(c.logo.arquivo), w: num(c.logo.w), h: num(c.logo.h) } : undefined;
  const fab = c.botaoFlutuante?.texto ? { texto: str(c.botaoFlutuante.texto, 24), id: 'fab', link: link(c.botaoFlutuante.link), aria: str(c.botaoFlutuante.aria, 120) } : undefined;
  return {
    nome: str(c.nome, 80), titulo: str(c.titulo, 120), descricao: str(c.descricao, 300), tagline: str(c.tagline, 160),
    tema: { cor: HEX.test(t.cor) ? t.cor : '#EE5A0C', cor2: HEX.test(t.cor2) ? t.cor2 : '#FF8A3D', fundo: HEX.test(t.fundo) ? t.fundo : '#101214' },
    logo, favicon: imgRef(c.favicon) || undefined, iconeApple: imgRef(c.iconeApple) || undefined, og: imgRef(c.og) || undefined,
    numeros: (Array.isArray(c.numeros) ? c.numeros : []).slice(0, 4).map(n => ({ valor: str(n?.valor, 16), rotulo: str(n?.rotulo, 24) })).filter(n => n.valor),
    categorias: cats, botaoFlutuante: fab, layout: cleanLayout(c.layout), tamanhos: cleanTam(c.tamanhos),
    cards: (Array.isArray(c.cards) ? c.cards : []).slice(0, 40).map(cleanCard).filter(Boolean)
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const slug = String(req.query.c || '');
  try {
    if (req.method === 'GET' && req.query.list) {
      if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
      const [members] = await pipeline([['SMEMBERS', 'bbidx:clients']]);
      const slugs = [...members].sort();
      const cfgs = slugs.length ? await pipeline(slugs.map(s => ['GET', `bbcfg:${s}`])) : [];
      return res.status(200).json({ clients: slugs.map((s, i) => { let n = s; try { n = JSON.parse(cfgs[i]).nome || s; } catch {} return { slug: s, nome: n }; }) });
    }
    if (!SLUG.test(slug)) return res.status(400).json({ error: 'slug' });

    if (req.query.action === 'key') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
      const [cur] = await pipeline([['GET', `bbkey:${slug}`]]);
      if (req.method === 'GET') return res.status(200).json({ key: cur || null });
      if (req.method !== 'POST') return res.status(405).end();
      const key = newKey();
      await pipeline([...(cur ? [['DEL', `bbkeyidx:${cur}`]] : []), ['SET', `bbkey:${slug}`, key], ['SET', `bbkeyidx:${key}`, slug]]);
      return res.status(200).json({ key });
    }

    if (req.method === 'GET') {
      const [v] = await pipeline([['GET', `bbcfg:${slug}`]]);
      if (!v) return res.status(404).json({ error: 'not_found' });
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).end(v);
    }
    if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'POST' || req.method === 'PUT') {
      let b = req.body;
      if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
      if (!b || typeof b !== 'object') return res.status(400).json({ error: 'body' });
      const cfg = clean(b);
      if (!cfg.nome) return res.status(400).json({ error: 'nome_obrigatorio' });
      const json = JSON.stringify(cfg);
      if (json.length > MAX_BODY) return res.status(413).json({ error: 'grande' });
      await pipeline([['SET', `bbcfg:${slug}`, json], ['SADD', 'bbidx:clients', slug]]);
      return res.status(200).json({ ok: true, cfg });
    }
    if (req.method === 'DELETE') {
      const [imgs] = await pipeline([['KEYS', `bbimg:${slug}:*`]]);
      const [cur] = await pipeline([['GET', `bbkey:${slug}`]]);
      await pipeline([['DEL', `bbcfg:${slug}`], ['SREM', 'bbidx:clients', slug], ['DEL', `bbkey:${slug}`], ['DEL', `bbfin:${slug}`], ...(cur ? [['DEL', `bbkeyidx:${cur}`]] : []), ...imgs.map(k => ['DEL', k])]);
      return res.status(200).json({ ok: true });
    }
    res.status(405).end();
  } catch {
    res.status(500).json({ error: 'db' });
  }
};

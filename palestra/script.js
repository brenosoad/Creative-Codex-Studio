// abre o WhatsApp certo pro dispositivo: celular usa o app (wa.me), PC usa o WhatsApp Web
// (evita um bug do app Desktop do Windows que corrompe emoji recebidos via link)
function isMobileDevice(){
  return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent);
}
function openWhatsApp(phone, text){
  const encoded = encodeURIComponent(text || '');
  const url = isMobileDevice()
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`;
  window.open(url, '_blank', 'noopener');
}
// intercepta os links estáticos de WhatsApp da página e usa a mesma lógica
document.querySelectorAll('a[href*="wa.me/"]').forEach(link => {
  link.addEventListener('click', (e) => {
    let phone, text;
    try {
      const url = new URL(link.href);
      phone = url.pathname.replace('/', '');
      text = url.searchParams.get('text') || '';
    } catch (err) { return; } // se der erro, deixa o link normal funcionar
    e.preventDefault();
    openWhatsApp(phone, text);
  });
});

// splash de carregamento: desenha o L, depois o W, depois revela o nome letra por letra
const splash = document.getElementById('splash');
if (splash) {
  const pathL = document.getElementById('splashPathL');
  const pathW = document.getElementById('splashPathW');
  const letters = Array.from(splash.querySelectorAll('.splash-line span'));
  const DRAW_MS = 700;
  const FILL_MS = 280;
  const GAP_MS = 150;
  const LETTER_STAGGER_MS = 32;
  const LETTER_MS = 300;

  function prepStroke(path){
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    path.style.transition = `stroke-dashoffset ${DRAW_MS}ms ease, fill-opacity ${FILL_MS}ms ease`;
  }

  // espera o próximo transitionend de uma propriedade específica, com trava de segurança por tempo
  function onceTransition(el, prop, fallbackMs){
    return new Promise(resolve => {
      let done = false;
      const finish = () => { if (done) return; done = true; resolve(); };
      el.addEventListener('transitionend', (e) => { if (e.propertyName === prop) finish(); }, { once: true });
      setTimeout(finish, fallbackMs + 150); // nunca trava a sequência pra sempre
    });
  }

  function revealLetters(){
    return new Promise(resolve => {
      if (!letters.length) return resolve();
      letters.forEach((el, i) => {
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, i * LETTER_STAGGER_MS);
      });
      setTimeout(resolve, letters.length * LETTER_STAGGER_MS + LETTER_MS);
    });
  }

  async function playSequence(){
    if (pathL && pathW) {
      prepStroke(pathL);
      prepStroke(pathW);
      await new Promise(r => setTimeout(r, 60)); // garante que o estado inicial foi pintado

      pathL.style.strokeDashoffset = '0';
      await onceTransition(pathL, 'stroke-dashoffset', DRAW_MS);
      pathL.style.fillOpacity = '1';
      await onceTransition(pathL, 'fill-opacity', FILL_MS);
      await new Promise(r => setTimeout(r, GAP_MS));

      pathW.style.strokeDashoffset = '0';
      await onceTransition(pathW, 'stroke-dashoffset', DRAW_MS);
      pathW.style.fillOpacity = '1';
      await onceTransition(pathW, 'fill-opacity', FILL_MS);
      await new Promise(r => setTimeout(r, GAP_MS));
    }
    await revealLetters();
    await new Promise(r => setTimeout(r, 400));

    splash.classList.add('is-hidden');
    splash.addEventListener('transitionend', () => splash.remove(), { once: true });
    setTimeout(() => splash.remove(), 700); // trava extra caso o transitionend não dispare
  }
  playSequence();
}

// barra de progresso de leitura + header: encolhe e ganha sombra ao rolar
const progress = document.getElementById('progress');
const siteHeader = document.querySelector('.site-header');

function updateProgress(){
  if (!progress) return;
  const h = document.documentElement;
  const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
  progress.style.width = (scrolled * 100) + '%';
}
function updateHeaderState(){
  if (!siteHeader) return;
  siteHeader.classList.toggle('is-scrolled', window.scrollY > 4);
}

let scrollTicking = false;
function onScroll(){
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    updateProgress();
    updateHeaderState();
    scrollTicking = false;
  });
}
document.addEventListener('scroll', onScroll, { passive: true });

// estado inicial sem transição: evita o "pulo" visível ao recarregar já rolado
if (siteHeader){
  siteHeader.style.transition = 'none';
  updateHeaderState();
  requestAnimationFrame(() => {
    siteHeader.offsetHeight; // força o navegador a aplicar o estado antes de reativar a transição
    siteHeader.style.transition = '';

  });
} else {
  updateHeaderState();
}

// menu mobile: abre/fecha com o hambúrguer
const navToggle = document.getElementById('navToggle');
const siteNav = document.querySelector('.site-header nav');
if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.classList.toggle('is-open');
    siteNav.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
  });
  siteNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('is-open');
      siteNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// tabs interativas de categoria
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.explorer-panel');
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabBtns.forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('is-active');
    btn.setAttribute('aria-selected', 'true');
    tabPanels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === target));
  });
});
document.querySelectorAll('.hero-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const target = chip.dataset.jump;
    document.querySelector(`.tab-btn[data-tab="${target}"]`)?.click();
    document.getElementById('categorias')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// FAQ em accordion
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-q');
  btn.addEventListener('click', () => {
    const wasOpen = item.classList.contains('is-open');
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('is-open');
      i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });
    if (!wasOpen){
      item.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// carrossel de depoimentos
const testiSlides = document.querySelectorAll('.testi blockquote');
const testiDotsWrap = document.querySelector('.testi-dots');
let testiIndex = 0;
function goToTesti(i){
  testiIndex = (i + testiSlides.length) % testiSlides.length;
  testiSlides.forEach((s, idx) => s.classList.toggle('is-active', idx === testiIndex));
  document.querySelectorAll('.testi-dots button').forEach((d, idx) => d.classList.toggle('is-active', idx === testiIndex));
}
if (testiDotsWrap && testiSlides.length) {
  testiSlides.forEach((_, i) => {
    const dot = document.createElement('button');
    if (i === 0) dot.classList.add('is-active');
    dot.setAttribute('aria-label', `Depoimento ${i + 1}`);
    dot.addEventListener('click', () => goToTesti(i));
    testiDotsWrap.appendChild(dot);
  });
}
document.querySelector('.testi-arrow.prev')?.addEventListener('click', () => { goToTesti(testiIndex - 1); restartTestiAutoplay(); });
document.querySelector('.testi-arrow.next')?.addEventListener('click', () => { goToTesti(testiIndex + 1); restartTestiAutoplay(); });

let testiTimer = null;
function startTestiAutoplay(){
  if (testiSlides.length < 2) return;
  testiTimer = setInterval(() => goToTesti(testiIndex + 1), 6000);
}
function restartTestiAutoplay(){
  clearInterval(testiTimer);
  startTestiAutoplay();
}
const testiSection = document.querySelector('.testi');
if (testiSection){
  startTestiAutoplay();
  testiSection.addEventListener('pointerdown', restartTestiAutoplay);
}

// revelar seções ao rolar
const revealTargets = document.querySelectorAll(
  '.section-head, .section-lede, .stats, .about-lead, .about-copy, .service-card, ' +
  '.process-steps li, .timeline li, .port-item, .port-cta-bar, .faq-item, .cta-card, ' +
  '.testi, .final-cta, .value-card'
);
revealTargets.forEach(el => el.classList.add('reveal'));

// cascata: itens dentro do mesmo grid entram em sequência
const staggerGroups = document.querySelectorAll('.services-grid, .process-steps, .port-grid, .cta-duo, .value-grid');
staggerGroups.forEach(group => {
  [...group.children].forEach((child, i) => {
    child.style.transitionDelay = `${Math.min(i * 90, 360)}ms`;
  });
});

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealTargets.forEach(el => {
  const rect = el.getBoundingClientRect();
  const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
  if (alreadyVisible) {
    el.style.transition = 'none'; // já está na tela: mostra direto, sem animar
    el.classList.add('in');
  } else {
    io.observe(el);
  }
});

// filtro de portfólio
const filterBtns = document.querySelectorAll('.filter-btn');
const portItems = document.querySelectorAll('.port-item');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    portItems.forEach(item => {
      const cat = item.dataset.category;
      const show = filter === 'all' || cat === filter || !cat;
      item.classList.toggle('hidden', !show);
    });
  });
});

// lightbox do portfólio (com navegação de galeria pro projeto em destaque)
const lightbox = document.getElementById('lightbox');
const lightboxStage = document.getElementById('lightbox-stage');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxVideo = document.getElementById('lightbox-video');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxThumbs = document.getElementById('lightbox-thumbs');
if (lightbox && lightboxImg && lightboxVideo) {
  const galleryRoot = document.getElementById('featured-gallery');
  const galleryItems = galleryRoot ? Array.from(galleryRoot.querySelectorAll('.port-item.photo, .port-item.video')) : [];
  let galleryIndex = -1; // -1 = item avulso, sem navegação
  let thumbButtons = [];

  function renderItem(item){
    const img = item.querySelector('img');
    if (item.classList.contains('video')) {
      lightboxImg.style.display = 'none';
      lightboxVideo.style.display = 'block';
      lightboxVideo.src = item.dataset.video;
      lightboxVideo.poster = img?.src || '';
      lightboxVideo.currentTime = 0;
      lightboxVideo.play().catch(() => {});
    } else {
      lightboxVideo.pause();
      lightboxVideo.removeAttribute('src');
      lightboxVideo.style.display = 'none';
      lightboxImg.style.display = 'block';
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
    }
  }

  function showItem(item, animate){
    if (!animate) { renderItem(item); return; }
    lightboxStage.classList.add('is-changing');
    setTimeout(() => {
      renderItem(item);
      lightboxStage.classList.remove('is-changing');
    }, 180);
  }

  function updateThumbActive(){
    thumbButtons.forEach((btn, i) => btn.classList.toggle('is-active', i === galleryIndex));
    const active = thumbButtons[galleryIndex];
    active?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function buildThumbs(){
    lightboxThumbs.innerHTML = '';
    thumbButtons = galleryItems.map((item, i) => {
      const img = item.querySelector('img');
      const btn = document.createElement('button');
      btn.className = 'lightbox-thumb';
      btn.setAttribute('aria-label', `Ver item ${i + 1}`);
      btn.innerHTML = `<img src="${img.src}" alt="">`;
      btn.addEventListener('click', (e) => { e.stopPropagation(); jumpTo(i); });
      lightboxThumbs.appendChild(btn);
      return btn;
    });
  }

  function openSingle(item){
    galleryIndex = -1;
    lightbox.classList.remove('has-nav');
    showItem(item, false);
    lightbox.classList.add('open');
  }

  function openGallery(index){
    galleryIndex = index;
    lightbox.classList.toggle('has-nav', galleryItems.length > 1);
    if (!thumbButtons.length) buildThumbs();
    lightboxCounter.textContent = `${galleryIndex + 1} / ${galleryItems.length}`;
    updateThumbActive();
    showItem(galleryItems[galleryIndex], false);
    lightbox.classList.add('open');
  }

  function jumpTo(index){
    if (index === galleryIndex) return;
    galleryIndex = index;
    lightboxCounter.textContent = `${galleryIndex + 1} / ${galleryItems.length}`;
    updateThumbActive();
    showItem(galleryItems[galleryIndex], true);
  }

  function goTo(step){
    if (galleryIndex < 0 || !galleryItems.length) return;
    jumpTo((galleryIndex + step + galleryItems.length) % galleryItems.length);
  }

  function closeLightbox(){
    lightbox.classList.remove('open');
    lightboxVideo.pause();
    lightboxVideo.removeAttribute('src');
    lightboxVideo.load();
  }

  document.querySelectorAll('.port-item.photo, .port-item.video').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.port-link')) return;
      const idx = galleryItems.indexOf(item);
      if (idx > -1) openGallery(idx);
      else openSingle(item);
    });
  });

  lightboxPrev?.addEventListener('click', (e) => { e.stopPropagation(); goTo(-1); });
  lightboxNext?.addEventListener('click', (e) => { e.stopPropagation(); goTo(1); });
  document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') goTo(1);
    if (e.key === 'ArrowLeft') goTo(-1);
  });

  // swipe no celular
  let touchStartX = 0;
  lightboxStage.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lightboxStage.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) goTo(diff < 0 ? 1 : -1);
  }, { passive: true });
}

// contadores animados das estatísticas
const counters = document.querySelectorAll('[data-count]');
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.count, 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    const start = performance.now();
    function tick(now){
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = prefix + Math.round(progress * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    counterIO.unobserve(el);
  });
}, { threshold: 0.5 });
counters.forEach(el => counterIO.observe(el));

// scroll suave só nos cliques em links de âncora (não interfere no scroll do mouse)
document.querySelectorAll('a[href^="#"]:not([data-open-budget])').forEach(link => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
// modal de orçamento: abre no clique, envia as respostas formatadas pro WhatsApp da empresa
const WHATSAPP_EMPRESA = '5516992609843';
const budgetModal = document.getElementById('budgetModal');
const budgetForm = document.getElementById('budgetForm');
const telefoneInput = document.getElementById('bf-telefone');
if (telefoneInput) {
  telefoneInput.addEventListener('input', () => {
    let digitos = telefoneInput.value.replace(/\D/g, '').slice(0, 11);
    let formatado = digitos;
    if (digitos.length > 10) {
      formatado = digitos.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    } else if (digitos.length > 6) {
      formatado = digitos.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (digitos.length > 2) {
      formatado = digitos.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    } else if (digitos.length > 0) {
      formatado = digitos.replace(/(\d{0,2})/, '($1');
    }
    telefoneInput.value = formatado.trim();
  });
}
if (budgetModal && budgetForm) {
  const openBudgetModal = (e) => {
    e.preventDefault();
    budgetModal.classList.add('open');
    budgetModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    budgetForm.querySelector('#bf-nome')?.focus();
  };
  const closeBudgetModal = () => {
    budgetModal.classList.remove('open');
    budgetModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('[data-open-budget]').forEach(btn => btn.addEventListener('click', openBudgetModal));
  budgetModal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeBudgetModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && budgetModal.classList.contains('open')) closeBudgetModal();
  });

  budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = budgetForm.nome.value.trim();
    const telefone = budgetForm.telefone.value.trim();
    const ambiente = budgetForm.ambiente.value;
    const detalhes = budgetForm.detalhes.value.trim() || 'Não informado';

    const mensagem =
      `Olá, Palestra Móveis Planejados, vim pelo site! \u{1F44B}\n\n` +
      `Gostaria de solicitar um orçamento:\n\n` +
      `\u{1F464} *Nome:* ${nome}\n` +
      `\u{1F4DE} *Telefone:* ${telefone}\n` +
      `\u{1F3E0} *Ambiente:* ${ambiente}\n` +
      `\u{1F4DD} *Detalhes:* ${detalhes}\n\n` +
      `Aguardo o retorno, obrigado(a)!`;

    openWhatsApp(WHATSAPP_EMPRESA, mensagem);
    closeBudgetModal();
    budgetForm.reset();
  });
}

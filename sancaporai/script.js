// =========================================================
// SANCA POR AÍ — MÍDIA KIT DIGITAL
// Animações: header, menu mobile, reveal on scroll,
// contagem numérica, scroll suave com offset do header,
// destaque do link ativo no menu.
// =========================================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== header on scroll (via requestAnimationFrame, evita jank) =====
const header = document.getElementById('siteHeader');
let lastScrollState = false;
let ticking = false;

function updateHeader() {
  const shouldBeScrolled = window.scrollY > 40;
  if (shouldBeScrolled !== lastScrollState) {
    header.classList.toggle('scrolled', shouldBeScrolled);
    lastScrollState = shouldBeScrolled;
  }
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateHeader);
    ticking = true;
  }
}, { passive: true });

// ===== mobile nav =====
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  burger.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => navLinks.classList.remove('open'))
);

// ===== scroll suave com offset do header fixo =====
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smoothScrollTo(targetY, duration) {
  const startY = window.scrollY;
  const distance = targetY - startY;
  if (prefersReducedMotion || Math.abs(distance) < 2) {
    window.scrollTo(0, targetY);
    return;
  }
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + distance * easeInOutCubic(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  const targetId = link.getAttribute('href');
  if (targetId.length <= 1) return; // ignora href="#"
  const targetEl = document.querySelector(targetId);
  if (!targetEl) return;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const headerHeight = header.offsetHeight;
    const targetY = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
    smoothScrollTo(Math.max(targetY, 0), 650);
    history.pushState(null, '', targetId);
  });
});

// ===== destaque do link ativo no menu conforme a seção visível =====
const sections = Array.from(document.querySelectorAll('section[id]'));
const navAnchors = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));

if (sections.length && navAnchors.length) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = '#' + entry.target.id;
      const link = navAnchors.find(a => a.getAttribute('href') === id);
      if (!link) return;
      if (entry.isIntersecting) {
        navAnchors.forEach(a => a.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach(s => navObserver.observe(s));
}

// ===== reveal on scroll =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => revealObserver.observe(el));

// ===== animação de contagem numérica =====
// Detecta números dentro do texto (formatos: 2.321.285 / 70,6 / 97)
// e anima do zero até o valor final, preservando o restante do texto.
const NUMBER_PATTERN = /\d{1,3}(?:\.\d{3})+|\d+,\d+|\d+/g;

function parseToken(token) {
  if (/^\d{1,3}(?:\.\d{3})+$/.test(token)) {
    return {
      type: 'thousands',
      target: parseInt(token.replace(/\./g, ''), 10)
    };
  }
  if (/^\d+,\d+$/.test(token)) {
    const decimals = token.split(',')[1].length;
    return {
      type: 'decimal',
      decimals,
      target: parseFloat(token.replace(',', '.'))
    };
  }
  return { type: 'plain', target: parseInt(token, 10) };
}

function formatToken(value, parsed) {
  if (parsed.type === 'thousands') {
    return Math.round(value).toLocaleString('pt-BR');
  }
  if (parsed.type === 'decimal') {
    return value.toFixed(parsed.decimals).replace('.', ',');
  }
  return String(Math.round(value));
}

function animateCounter(el) {
  const original = el.textContent;
  const matches = [...original.matchAll(NUMBER_PATTERN)];
  if (!matches.length) return;

  const tokens = matches.map(m => ({ raw: m[0], index: m.index, parsed: parseToken(m[0]) }));

  if (prefersReducedMotion) return; // mantém o texto final, sem animar

  const duration = 1300;
  const startTime = performance.now();

  function buildText(progress) {
    let result = '';
    let cursor = 0;
    tokens.forEach(t => {
      result += original.slice(cursor, t.index);
      const current = t.parsed.target * progress;
      result += formatToken(current, t.parsed);
      cursor = t.index + t.raw.length;
    });
    result += original.slice(cursor);
    return result;
  }

  function step(now) {
    const elapsed = now - startTime;
    const rawProgress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - rawProgress, 3); // easeOutCubic
    el.textContent = buildText(eased);
    if (rawProgress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = original; // garante formatação exata no final
    }
  }
  requestAnimationFrame(step);
}

const counterTargets = document.querySelectorAll(
  '.hero-stats strong, .stat-hero .num, .split-stats .box .num'
);
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
counterTargets.forEach(el => counterObserver.observe(el));

// ===== animação das barras de métricas =====
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.w + '%';
      });
      barObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.metric-card').forEach(el => barObserver.observe(el));

// ===== hero interativa: o logo "acende" e segue o cursor =====
const heroSection = document.querySelector('.hero');
const heroLogo = document.querySelector('.hero-content .brand-logo');
const heroGlowEl = document.querySelector('.hero-glow');
const cornerEls = document.querySelectorAll('.hero-corner i');

if (heroSection && heroLogo && !prefersReducedMotion) {
  heroSection.addEventListener('pointermove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5 a 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    heroLogo.style.transform =
      `perspective(700px) rotateX(${(-ny * 12).toFixed(2)}deg) rotateY(${(nx * 14).toFixed(2)}deg) scale(1.03)`;

    if (heroGlowEl) {
      heroGlowEl.style.setProperty('--gx', `${(nx * 90).toFixed(1)}px`);
      heroGlowEl.style.setProperty('--gy', `${(ny * 90).toFixed(1)}px`);
    }

    cornerEls.forEach((el, i) => {
      const dir = i % 2 === 0 ? -1 : 1;
      el.style.transform = `translate(${(nx * 16 * dir).toFixed(1)}px, ${(ny * 16 * dir).toFixed(1)}px)`;
    });
  });

  heroSection.addEventListener('pointerleave', () => {
    heroLogo.style.transform = '';
    if (heroGlowEl) {
      heroGlowEl.style.setProperty('--gx', '0px');
      heroGlowEl.style.setProperty('--gy', '0px');
    }
    cornerEls.forEach(el => { el.style.transform = ''; });
  });

  // clique no logo: pisca a lâmpada, como se acendesse
  heroLogo.addEventListener('click', () => {
    heroSection.classList.add('is-lit');
    heroLogo.style.filter = 'drop-shadow(0 0 26px rgba(255,138,61,.85))';
    setTimeout(() => {
      heroSection.classList.remove('is-lit');
      heroLogo.style.filter = '';
    }, 650);
  });
}
/* Creative Codex site v3 */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = function () { return typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined'; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  // segurança: se algo falhar, nada fica escondido
  setTimeout(function () { if (!window.__ccReady) root.classList.add('show-all'); }, 5200);

  /* ---------- palavras do h2 ---------- */
  function splitWords(el) {
    var nodes = Array.prototype.slice.call(el.childNodes), k = 0;
    el.textContent = '';
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { el.appendChild(d.createTextNode(' ')); return; }
          var w = d.createElement('span'), i = d.createElement('span');
          w.className = 'w'; i.textContent = t; i.style.setProperty('--k', k++); w.appendChild(i); el.appendChild(w);
        });
      } else {
        var w2 = d.createElement('span'), i2 = d.createElement('span');
        w2.className = 'w'; i2.style.setProperty('--k', k++); i2.appendChild(n); w2.appendChild(i2); el.appendChild(w2);
      }
    });
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  }
  $$('.split').forEach(splitWords);

  /* ---------- contadores ---------- */
  function countUp(el) {
    if (el.__done) return; el.__done = true;
    var to = parseFloat(el.getAttribute('data-count')), suf = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = to + suf; return; }
    var t0 = performance.now(), dur = 1500;
    (function step(t) {
      var p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- reveal por scroll ---------- */
  var io = null;
  function startReveal() {
    if (!('IntersectionObserver' in window)) { root.classList.add('show-all'); $$('[data-count]').forEach(countUp); return; }
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        $$('[data-count]', e.target).forEach(countUp);
        if (e.target.hasAttribute('data-count')) countUp(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('[data-r], .split').forEach(function (el) { io.observe(el); });
    $$('[data-count]').forEach(function (el) { if (!el.closest('[data-r], .split')) io.observe(el); });
  }

  /* ---------- abertura em vídeo + intro ---------- */
  var pre = $('#pre'), preBar = $('#preBar'), loaded = d.readyState === 'complete', exited = false;
  window.addEventListener('load', function () { loaded = true; });
  var T0 = performance.now(), SCRIPT = '> iniciando creative-codex-studio ...', timers = [];
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function exitPre() {
    if (exited) return; exited = true;
    timers.forEach(clearTimeout);
    if (!pre) return intro();
    pre.style.animation = 'none';
    pre.classList.add('a', 'b', 'c', 'out');
    if (preBar) preBar.style.transform = 'scaleX(1)';
    setTimeout(intro, reduce ? 0 : 650);
    setTimeout(function () { pre.style.display = 'none'; }, reduce ? 0 : 1300);
  }
  if (pre) {
    $('#inSkip').addEventListener('click', exitPre);
    if (reduce) { exitPre(); }
    else {
      var code = $('#inCode'), n = 0;
      (function type() { if (exited) return; code.textContent = SCRIPT.slice(0, ++n); if (n < SCRIPT.length) setTimeout(type, 34); })();
      (function bar(t) { if (exited) return; var p = Math.min(1, (t - T0) / 4200); preBar.style.transform = 'scaleX(' + p + ')'; if (p < 1) requestAnimationFrame(bar); })(T0);
      at(250, function () { pre.classList.add('a'); });
      at(1500, function () { pre.classList.add('b'); });
      at(2700, function () { pre.classList.add('c'); });
      (function waitEnd() { if (exited) return; if (performance.now() - T0 >= 4300 && (loaded || performance.now() - T0 > 7000)) exitPre(); else setTimeout(waitEnd, 100); })();
    }
  } else { intro(); }

  function intro() {
    var hl = $('#heroTitle');
    $$('.ln', hl).forEach(function (l, i) { l.firstElementChild.style.setProperty('--k', i); });
    hl.classList.add('in');
    $$('.hero [data-r]').forEach(function (el, i) { el.style.setProperty('--d', (0.35 + i * 0.12) + 's'); el.classList.add('in'); });
    $$('.hero [data-count]').forEach(countUp);
    startReveal();
    if (window.__ccScene) window.__ccScene.appear();
  }

  /* ---------- nav ---------- */
  var nav = $('#nav'), burger = $('#burger'), links = $('#navLinks'), lastY = 0;
  function setMenu(o) { links.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); }
  burger.addEventListener('click', function () { setMenu(!links.classList.contains('open')); });
  var prog = $('#progress');
  function onScroll() {
    var y = window.pageYOffset, h = root.scrollHeight - innerHeight;
    prog.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    nav.classList.toggle('solid', y > 40);
    nav.classList.toggle('hide', y > 500 && y > lastY + 4 && !links.classList.contains('open'));
    if (y < lastY - 4 || y < 500) nav.classList.remove('hide');
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  try { localStorage.setItem('creative-codex-lang', 'pt'); } catch (e) {}
  var en = $('#langEn'); if (en) en.addEventListener('click', function () { try { localStorage.setItem('creative-codex-lang', 'en'); } catch (e) {} });

  // seção ativa
  var navA = $$('.nav-links a[href^="#"]');
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) navA.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['sobre', 'servicos', 'projetos', 'parceiros', 'depoimentos', 'faq', 'contato'].forEach(function (id) { var s = d.getElementById(id); if (s) so.observe(s); });
  }

  // transição de cortina entre seções distantes
  var curtain = $('#curtain'), going = false;
  d.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href'); if (id.length < 2) return;
    var t = d.querySelector(id); if (!t) return;
    setMenu(false);
    var far = Math.abs(t.getBoundingClientRect().top) > innerHeight * 1.4;
    if (!hasGsap() || reduce || !far) return;
    ev.preventDefault(); if (going) return; going = true;
    var tl = window.gsap.timeline({ onComplete: function () { going = false; } });
    tl.set(curtain, { transformOrigin: '50% 100%' })
      .to(curtain, { scaleY: 1, duration: 0.45, ease: 'power3.inOut' })
      .add(function () {
        root.style.scrollBehavior = 'auto';
        window.scrollTo(0, t.getBoundingClientRect().top + window.pageYOffset);
        if (window.ScrollTrigger) window.ScrollTrigger.update();
        root.style.scrollBehavior = '';
      })
      .set(curtain, { transformOrigin: '50% 0%' })
      .to(curtain, { scaleY: 0, duration: 0.55, ease: 'power3.inOut' }, '+=0.05');
  });

  /* ---------- glow, tilt, magnético ---------- */
  var glow = $('#glow');
  if (fine) {
    window.addEventListener('pointermove', function (e) { glow.classList.add('on'); glow.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)'; }, { passive: true });
    $$('.tilt').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt')) || 8;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add('moving');
        el.style.transform = 'perspective(900px) rotateX(' + (-y * max).toFixed(2) + 'deg) rotateY(' + (x * max).toFixed(2) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { el.classList.remove('moving'); el.style.transform = ''; });
    });
    $$('.mag').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        if (!hasGsap()) return;
        var r = el.getBoundingClientRect();
        window.gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.35, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', function () { if (hasGsap()) window.gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,.5)' }); });
    });
  }

  /* ---------- FAQ ---------- */
  $$('.acc-i').forEach(function (it) {
    var b = $('button', it);
    b.addEventListener('click', function () {
      var open = !it.classList.contains('open');
      $$('.acc-i.open').forEach(function (o) { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', 'false'); });
      if (open) { it.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- formulário → WhatsApp ---------- */
  var form = $('#form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.website.value) return;
    var ok = true;
    function chk(id, cond, msg) {
      var f = d.getElementById(id).closest('.f'), er = d.getElementById('e-' + id);
      f.classList.toggle('bad', !cond); if (er) er.textContent = cond ? '' : msg; if (!cond) ok = false;
    }
    var n = form.name.value.trim(), s = form.service.value, m = form.message.value.trim(), b = form.budget.value;
    chk('name', n.length >= 2, 'Informe seu nome.');
    chk('service', !!s, 'Escolha o tipo de projeto.');
    chk('message', m.length >= 10, 'Conte um pouco mais sobre o projeto.');
    if (!ok) return;
    var txt = 'Olá! Meu nome é ' + n + '.\nTenho interesse em: ' + s + (b ? '\nOrçamento aproximado: ' + b : '') + '\n\nDetalhes: ' + m;
    var url = 'https://wa.me/5516997837454?text=' + encodeURIComponent(txt);
    var w = window.open(url, '_blank', 'noopener');
    if (!w) location.href = url;
  });

  /* ---------- coverflow de depoimentos ---------- */
  (function () {
    var cf = $('#cf'); if (!cf) return;
    var stage = $('.cf-stage', cf), items = $$('.cf-i', cf), dotsBox = $('#cfDots'), idx = 0, timer = null, dots = [];
    items.forEach(function (_, i) {
      var b = d.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Depoimento ' + (i + 1));
      b.addEventListener('click', function () { go(i, true); }); dotsBox.appendChild(b); dots.push(b);
    });
    function layout() {
      var w = items[0].offsetWidth, narrow = innerWidth < 700, X = w * (narrow ? 0.92 : 0.74);
      items.forEach(function (it, i) {
        var o = i - idx, a = Math.abs(o);
        it.style.transform = 'translateX(calc(-50% + ' + (o * X) + 'px)) translateZ(' + (-a * 220) + 'px) rotateY(' + (-o * (narrow ? 28 : 36)) + 'deg) scale(' + (a ? 0.9 : 1) + ')';
        it.style.opacity = a > 1 ? 0 : (a ? (narrow ? 0.35 : 0.55) : 1);
        it.style.filter = a ? 'brightness(.6)' : 'none';
        it.style.zIndex = 10 - a;
        it.style.pointerEvents = a > 1 ? 'none' : 'auto';
        it.classList.toggle('act', !a); it.setAttribute('aria-hidden', a ? 'true' : 'false');
      });
      dots.forEach(function (b, i) { b.classList.toggle('on', i === idx); });
    }
    function size() { var h = 0; items.forEach(function (it) { it.style.minHeight = ''; h = Math.max(h, it.offsetHeight); }); items.forEach(function (it) { it.style.minHeight = h + 'px'; }); stage.style.height = (h + 30) + 'px'; }
    function go(i, user) { idx = (i + items.length) % items.length; layout(); if (user) restart(); }
    function restart() { clearInterval(timer); if (reduce) return; timer = setInterval(function () { go(idx + 1); }, 7500); }
    items.forEach(function (it, i) { it.addEventListener('click', function () { if (i !== idx) go(i, true); }); });
    $('#cfPrev').addEventListener('click', function () { go(idx - 1, true); });
    $('#cfNext').addEventListener('click', function () { go(idx + 1, true); });
    var sx = null;
    stage.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    stage.addEventListener('pointerup', function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1), true); });
    cf.addEventListener('mouseenter', function () { clearInterval(timer); });
    cf.addEventListener('mouseleave', restart);
    function init() { size(); layout(); }
    init(); window.addEventListener('resize', init); window.addEventListener('load', init);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es[0].isIntersecting ? restart() : clearInterval(timer); }).observe(cf);
  })();

  /* ---------- GSAP / ScrollTrigger ---------- */
  function initScroll() {
    if (!hasGsap() || reduce) return;
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);

    // serviços: cards empilhados recuam
    var cards = $$('.svc');
    cards.forEach(function (c, i) {
      var next = cards[i + 1]; if (!next) return;
      gsap.to($('.svc-in', c), { scale: 0.93, '--dim': 0.4, ease: 'none',
        scrollTrigger: { trigger: next, start: 'top 88%', end: 'top ' + (92 + (i + 1) * 18) + 'px', scrub: true } });
    });

    // projetos: rolagem horizontal presa
    var mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', function () {
      var work = $('#projetos'), track = $('#workTrack'), bar = $('#workBar');
      work.classList.add('pinned');
      var dist = function () { return Math.max(0, track.scrollWidth - innerWidth); };
      gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: '#workPin', start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: function (s) { bar.style.transform = 'scaleX(' + s.progress + ')'; } } });
      return function () { work.classList.remove('pinned'); track.style.transform = ''; };
    });

    // processo: linha que preenche
    var steps = $('#steps'), lis = $$('li', steps);
    function setEnd() { var l = lis[lis.length - 1]; steps.style.setProperty('--end', Math.max(0, l.offsetHeight - parseFloat(getComputedStyle(d.documentElement).fontSize) * 1.2 - 24) + 'px'); }
    setEnd(); window.addEventListener('resize', setEnd); window.addEventListener('load', setEnd);
    ST.create({ trigger: steps, start: 'top 70%', end: 'bottom 60%', scrub: true,
      onUpdate: function (s) {
        steps.style.setProperty('--p', s.progress.toFixed(3));
        lis.forEach(function (li) { li.classList.toggle('on', li.getBoundingClientRect().top < innerHeight * 0.66); });
      } });
    lis[0].classList.add('on');
    window.addEventListener('load', function () { ST.refresh(); });
  }

  /* ---------- cena 3D do hero: esfera líquida ---------- */
  function initScene() {
    var canvas = $('#scene');
    if (!canvas || typeof window.THREE === 'undefined' || reduce) return;
    var THREE = window.THREE, renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'high-performance' }); } catch (e) { return; }
    renderer.setClearColor(0x000000, 0);
    var hero = $('.hero'), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    cam.position.z = 9;
    var group = new THREE.Group(); scene.add(group);

    var noise = 'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}vec4 perm(vec4 x){return mod289(((x*34.0)+1.0)*x);}vec4 tis(vec4 r){return 1.79284291400159-0.85373472095314*r;}' +
      'float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);' +
      'vec4 p=perm(perm(perm(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;' +
      'vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);vec4 norm=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}';
    var vert = 'uniform float uTime;uniform float uAmp;varying vec3 vN;varying vec3 vV;varying float vD;' + noise +
      'float disp(vec3 p){return snoise(p*0.9+vec3(0.0,uTime*0.22,uTime*0.12))*uAmp;}' +
      'void main(){vec3 p=position;float d=disp(p);vec3 q=p+normal*d;' +
      'vec3 t=normalize(cross(normal,vec3(0.0,1.0,0.001)));vec3 bt=normalize(cross(normal,t));float e=0.02;' +
      'vec3 pt=p+t*e;vec3 pb=p+bt*e;vec3 qt=pt+normal*disp(pt);vec3 qb=pb+normal*disp(pb);vec3 nn=normalize(cross(qt-q,qb-q));if(dot(nn,normal)<0.0)nn=-nn;' +
      'vN=normalize(normalMatrix*nn);vec4 mv=modelViewMatrix*vec4(q,1.0);vV=normalize(-mv.xyz);vD=d;gl_Position=projectionMatrix*mv;}';
    var frag = 'varying vec3 vN;varying vec3 vV;varying float vD;' +
      'void main(){vec3 n=normalize(vN);vec3 v=normalize(vV);float f=pow(1.0-max(dot(n,v),0.0),2.4);' +
      'vec3 deep=vec3(0.02,0.05,0.2);vec3 blue=vec3(0.18,0.42,1.0);vec3 cyan=vec3(0.13,0.83,0.93);' +
      'float band=0.5+0.5*sin(vD*9.0+n.y*3.0);vec3 base=mix(deep,blue,0.35+0.5*band*(0.4+f));' +
      'vec3 col=mix(base,cyan,f*0.95);vec3 L=normalize(vec3(-0.5,0.8,0.7));float sp=pow(max(dot(reflect(-L,n),v),0.0),38.0);' +
      'col+=vec3(0.75,0.9,1.0)*sp*0.7;col+=cyan*pow(f,3.0)*0.35;gl_FragColor=vec4(col,1.0);}';
    var mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: { uTime: { value: 0 }, uAmp: { value: 0.3 } } });
    var orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 48), mat); group.add(orb);

    var wire = new THREE.Mesh(new THREE.IcosahedronGeometry(2.25, 2), new THREE.MeshBasicMaterial({ color: 0x6aa5ff, wireframe: true, transparent: true, opacity: 0.12, depthWrite: false }));
    group.add(wire);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.008, 8, 220), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.55 }));
    ring.rotation.set(1.25, 0.3, 0); group.add(ring);
    var ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.006, 8, 220), new THREE.MeshBasicMaterial({ color: 0x5b8cff, transparent: true, opacity: 0.35 }));
    ring2.rotation.set(1.9, -0.5, 0.4); group.add(ring2);
    var dotG = new THREE.SphereGeometry(0.06, 12, 12), dot1 = new THREE.Mesh(dotG, new THREE.MeshBasicMaterial({ color: 0x9be8ff })), dot2 = new THREE.Mesh(dotG, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    ring.add(dot1); ring2.add(dot2);

    var N = 420, arr = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) { arr[i * 3] = (Math.random() - 0.5) * 26; arr[i * 3 + 1] = (Math.random() - 0.5) * 16; arr[i * 3 + 2] = Math.random() * 14 - 9; }
    var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    var pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x8fb8ff, size: 0.04, transparent: true, opacity: 0.6, depthWrite: false }));
    scene.add(pts);

    var mx = 0, my = 0, tx = 0, ty = 0, vel = 0, lastY = window.pageYOffset, visible = true, running = true, T = 0, w = 0, h = 0, appear = 0, narrow = false;
    function resize() {
      w = hero.clientWidth; h = hero.clientHeight; narrow = w < 860;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrow ? 1.5 : 2));
      renderer.setSize(w, h, false); cam.aspect = w / h;
      group.scale.setScalar(narrow ? 0.62 : 1);
      cam.updateProjectionMatrix();
    }
    resize(); window.addEventListener('resize', resize);
    window.addEventListener('pointermove', function (e) { tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(hero);
    d.addEventListener('visibilitychange', function () { running = !d.hidden; });

    var clock = new THREE.Clock();
    function frame() {
      requestAnimationFrame(frame);
      if (!visible || !running) return;
      var dt = Math.min(clock.getDelta(), 0.05); T += dt;
      var y = window.pageYOffset, sp = (y - lastY) / Math.max(dt, 0.001); lastY = y;
      vel += (clamp(Math.abs(sp) / 2500, 0, 1) - vel) * 0.06;
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      var p = clamp(y / Math.max(h, 1), 0, 1), k = 1 - Math.pow(1 - appear, 3);
      var px = narrow ? 0 : 3.0, py = narrow ? -2.1 : 0.1;
      group.position.set(px + mx * 0.25, py - my * 0.15 + p * 2.2, -(1 - k) * 4);
      group.scale.setScalar((narrow ? 0.6 : 0.88) * (0.6 + 0.4 * k) * (1 - p * 0.25));
      group.rotation.y = mx * 0.35 + T * 0.1; group.rotation.x = my * 0.2;
      mat.uniforms.uTime.value = T; mat.uniforms.uAmp.value = 0.28 + vel * 0.25;
      wire.rotation.y = -T * 0.08; wire.rotation.x = T * 0.05;
      ring.rotation.z = T * 0.22; ring2.rotation.z = -T * 0.15;
      dot1.position.set(2.75, 0, 0); dot2.position.set(3.2, 0, 0);
      pts.rotation.y = T * 0.012;
      renderer.render(scene, cam);
    }
    frame();
    window.__ccScene = {
      appear: function () {
        if (hasGsap() && !reduce) window.gsap.to({ v: 0 }, { v: 1, duration: 1.8, ease: 'power2.out', onUpdate: function () { appear = this.targets()[0].v; } });
        else appear = 1;
      }
    };
    if (exited) window.__ccScene.appear();
  }

  function boot() {
    try { initScroll(); } catch (e) { console.warn('scroll', e); }
    try { initScene(); } catch (e) { console.warn('scene', e); }
    window.__ccReady = true;
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();

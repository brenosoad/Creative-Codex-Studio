(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(hover:none)').matches;

  /* Mobile menu */
  var menuBtn = document.getElementById('menuBtn');
  var mobileNav = document.getElementById('mobileNav');
  if (menuBtn && mobileNav) {
    var closeMenu = function(){
      menuBtn.classList.remove('open'); mobileNav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded','false'); menuBtn.setAttribute('aria-label','Abrir menu');
      document.body.classList.remove('nav-open');
    };
    menuBtn.addEventListener('click', function(){
      var isOpen = mobileNav.classList.toggle('open');
      menuBtn.classList.toggle('open', isOpen);
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      menuBtn.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      document.body.classList.toggle('nav-open', isOpen);
    });
    mobileNav.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeMenu(); });
    window.addEventListener('resize', function(){ if(window.innerWidth > 900) closeMenu(); });
  }

  /* Máscara do WhatsApp: (16) 99999-9999 */
  var waInput = document.getElementById('f-whatsapp');
  if (waInput) {
    waInput.addEventListener('input', function(){
      var d = waInput.value.replace(/\D/g,'').slice(0,11);
      var out = d;
      if (d.length > 2) out = '(' + d.slice(0,2) + ') ' + d.slice(2);
      else if (d.length > 0) out = '(' + d;
      if (d.length > 6) out = '(' + d.slice(0,2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
      waInput.value = out;
    });
  }

  /* Botão flutuante do WhatsApp: some no topo e na área de contato */
  var waFloat = document.getElementById('waFloat');
  var contato = document.getElementById('contato');
  if (waFloat) {
    var nearContact = false;
    var updateWa = function(){ waFloat.classList.toggle('is-hidden', window.scrollY < 500 || nearContact); };
    if (contato && 'IntersectionObserver' in window) {
      new IntersectionObserver(function(en){ nearContact = en[0].isIntersecting; updateWa(); }, {rootMargin:'0px 0px -20% 0px'}).observe(contato);
    }
    document.addEventListener('scroll', function(){ requestAnimationFrame(updateWa); }, {passive:true});
    updateWa();
  }

  /* Contact form -> WhatsApp */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      var nome = contactForm.nome.value.trim();
      var whatsapp = contactForm.whatsapp.value.trim();
      var idade = contactForm.idade.value.trim();
      var mensagem = contactForm.mensagem.value.trim();
      var texto = 'Olá, Amália! Meu nome é ' + nome + ' (WhatsApp: ' + whatsapp + ').';
      if (idade) texto += ' Idade da criança: ' + idade + '.';
      if (mensagem) texto += ' ' + mensagem;
      var url = 'https://wa.me/5516997556576?text=' + encodeURIComponent(texto);
      window.open(url, '_blank');
    });
  }

  /* Header background on scroll */
  var headerEl = document.querySelector('header');
  function onHeaderScroll(){
    headerEl.classList.toggle('scrolled', window.scrollY > 40);
  }
  document.addEventListener('scroll', function(){ requestAnimationFrame(onHeaderScroll); }, {passive:true});
  onHeaderScroll();

  /* Scroll progress bar */
  var bar = document.getElementById('progressBar');
  function updateProgress(){
    var h = document.documentElement;
    var pct = (h.scrollTop || document.body.scrollTop) / ((h.scrollHeight||document.body.scrollHeight) - h.clientHeight) * 100;
    bar.style.width = pct + '%';
  }
  document.addEventListener('scroll', function(){ requestAnimationFrame(updateProgress); }, {passive:true});
  updateProgress();

  /* Reveal on scroll */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {threshold:0.15});
    revealEls.forEach(function(el){ io.observe(el); });
  } else { revealEls.forEach(function(el){ el.classList.add('in'); }); }

  /* Tilt 3D on cards */
  if(!coarse && !reduce){
    document.querySelectorAll('.tilt-card').forEach(function(card){
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left)/r.width - 0.5;
        var py = (e.clientY - r.top)/r.height - 0.5;
        card.style.transform = 'perspective(700px) rotateY('+(px*7)+'deg) rotateX('+(py*-7)+'deg) translateZ(4px)';
      });
      card.addEventListener('mouseleave', function(){ card.style.transform=''; });
    });

    /* Magnetic buttons */
    document.querySelectorAll('.btn,.navbtn,.insta-btn').forEach(function(btn){
      btn.addEventListener('mousemove', function(e){
        var r = btn.getBoundingClientRect();
        var mx = (e.clientX - r.left - r.width/2) * 0.25;
        var my = (e.clientY - r.top - r.height/2) * 0.35;
        btn.style.transform = 'translate('+mx+'px,'+my+'px)';
      });
      btn.addEventListener('mouseleave', function(){ btn.style.transform=''; });
    });

    /* Breathing widget */
  (function(){
    var widget = document.getElementById('breatheWidget');
    var label = document.getElementById('breatheLabel');
    if(!widget) return;
    var phase = 0, timer;
    function tick(){ label.textContent = phase===0 ? 'Inspire' : 'Solte'; phase = 1-phase; }
    function start(){ tick(); timer = setInterval(tick, 4000); }
    if(reduce){ label.textContent = 'Respire'; } else { start(); }
    var paused = false;
    function toggle(){
      paused = !paused;
      widget.classList.toggle('paused', paused);
      if(paused){ clearInterval(timer); label.style.opacity = 0.6; }
      else { label.style.opacity = 1; start(); }
    }
    widget.addEventListener('click', toggle);
    widget.addEventListener('keydown', function(e){ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggle(); } });
  })();

  /* Hero parallax */
    var heroVisual = document.getElementById('heroVisual');
    if(heroVisual){
      heroVisual.addEventListener('mousemove', function(e){
        var r = heroVisual.getBoundingClientRect();
        var px = (e.clientX - r.left)/r.width - 0.5;
        var py = (e.clientY - r.top)/r.height - 0.5;
        heroVisual.querySelectorAll('[data-depth]').forEach(function(el){
          var d = parseFloat(el.dataset.depth);
          var base = el.classList.contains('frame') ? 'rotate(3deg) ' : '';
          el.style.transform = base + 'translate('+(px*d)+'px,'+(py*d)+'px)';
        });
      });
      heroVisual.addEventListener('mouseleave', function(){
        heroVisual.querySelectorAll('[data-depth]').forEach(function(el){ el.style.transform = el.classList.contains('frame') ? 'rotate(3deg)' : ''; });
      });
    }
  }

  /* Hero 3D: pausa quando fora da tela */
  var heroScene = document.getElementById('heroScene');
  if(heroScene && 'IntersectionObserver' in window){
    new IntersectionObserver(function(en){ heroScene.classList.toggle('hs-paused', !en[0].isIntersecting); }).observe(heroScene);
  }

  /* Scrollspy nav */
  var navLinks = document.querySelectorAll('nav a[href^="#"]');
  var sections = Array.prototype.map.call(navLinks, function(a){ return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  function onScrollSpy(){
    var y = window.scrollY + 140;
    var current = sections[0];
    sections.forEach(function(sec){ if(sec.offsetTop <= y) current = sec; });
    navLinks.forEach(function(a){ a.classList.toggle('active', a.getAttribute('href') === '#'+current.id); });
  }
  document.addEventListener('scroll', function(){ requestAnimationFrame(onScrollSpy); }, {passive:true});
  onScrollSpy();

  /* Timeline draw + circle pop */
  var timeline = document.querySelector('.timeline');
  if(timeline){
    var circles = timeline.querySelectorAll('.circle');
    function onTimelineScroll(){
      var r = timeline.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (vh*0.75 - r.top) / r.height;
      progress = Math.max(0, Math.min(1, progress));
      timeline.style.setProperty('--tl', progress);
      circles.forEach(function(c, i){
        var stepProgress = (i+0.5) / circles.length;
        c.classList.toggle('pop', progress >= stepProgress);
      });
    }
    document.addEventListener('scroll', function(){ requestAnimationFrame(onTimelineScroll); }, {passive:true});
    onTimelineScroll();
  }

  /* FAQ accordion */
  document.querySelectorAll('.faq-item').forEach(function(item){
    var btn = item.querySelector('.faq-q');
    var ans = item.querySelector('.faq-a');
    btn.addEventListener('click', function(){
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function(o){
        if(o !== item){ o.classList.remove('open'); o.querySelector('.faq-a').style.maxHeight = null; }
      });
      if(isOpen){ item.classList.remove('open'); ans.style.maxHeight = null; }
      else { item.classList.add('open'); ans.style.maxHeight = ans.scrollHeight + 'px'; }
    });
  });
})();

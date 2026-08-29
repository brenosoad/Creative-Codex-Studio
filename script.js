// ============================================
// CREATIVE CODEX - SCRIPT OTIMIZADO PARA MOBILE
// ============================================

(function() {
    'use strict';
    
    // ===== CONFIGURAÇÕES GERAIS =====
    const config = {
        mobileBreakpoint: 768,
        scrollOffset: 80,
        animationDuration: 300,
        whatsappNumber: '5516997837454'
    };
    
    // ===== IDIOMA (usado nas mensagens geradas dinamicamente) =====
    const LANG = document.documentElement.lang === 'en' ? 'en' : 'pt';
    
    const strings = {
        pt: {
            formRequired: 'Este campo é obrigatório',
            whatsappHeader: 'NOVA PROPOSTA - CREATIVE CODEX',
            whatsappName: 'Nome',
            whatsappProject: 'Projeto',
            whatsappBudget: 'Orçamento',
            whatsappBudgetDefault: 'A definir',
            whatsappMessage: 'Mensagem',
            whatsappFooter: 'Enviado através do site Creative Codex',
            serviceInterestMessage: (service) => `Olá! Tenho interesse em ${service} e gostaria de conversar sobre um orçamento.`,
            shareTitle: 'Creative Codex - Design & Desenvolvimento Web',
            shareText: 'Dá uma olhada no trabalho do Creative Codex!',
            linkCopied: '<i class="fas fa-check" aria-hidden="true"></i> Link copiado!',
            themeToDark: 'Modo escuro',
            themeToLight: 'Modo claro',
            whatsappFloatMessage: '👋 *Olá! Gostaria de conversar sobre um projeto.*\n\nEncontrei você através do site Creative Codex.\n\nPodemos conversar?'
        },
        en: {
            formRequired: 'This field is required',
            whatsappHeader: 'NEW PROPOSAL - CREATIVE CODEX',
            whatsappName: 'Name',
            whatsappProject: 'Project',
            whatsappBudget: 'Budget',
            whatsappBudgetDefault: 'To be defined',
            whatsappMessage: 'Message',
            whatsappFooter: 'Sent from the Creative Codex website',
            serviceInterestMessage: (service) => `Hi! I'm interested in ${service} and would like to talk about a quote.`,
            shareTitle: 'Creative Codex - Design & Web Development',
            shareText: 'Check out Creative Codex\'s work!',
            linkCopied: '<i class="fas fa-check" aria-hidden="true"></i> Link copied!',
            themeToDark: 'Dark mode',
            themeToLight: 'Light mode',
            whatsappFloatMessage: '👋 *Hi! I\'d like to talk about a project.*\n\nI found you through the Creative Codex website.\n\nCan we chat?'
        }
    }[LANG];
    
    // ===== ELEMENTOS DO DOM =====
    const DOM = {
        navbar: document.querySelector('.navbar'),
        menuToggle: document.querySelector('.menu-toggle'),
        navMenu: document.querySelector('.nav-menu'),
        navLinks: document.querySelectorAll('.nav-link'),
        backToTop: document.querySelector('.back-to-top'),
        navProgress: document.querySelector('.nav-progress'),
        filterButtons: document.querySelectorAll('.filter-btn'),
        projectCards: document.querySelectorAll('.project-card'),
        currentYear: document.getElementById('current-year'),
        whatsappForm: document.getElementById('whatsapp-form'),
        whatsappFloat: document.querySelector('.whatsapp-float'),
        sections: document.querySelectorAll('section'),
        partnersTrack: document.querySelector('.partners-track'),
        addProjectCard: document.querySelector('.portfolio-add-banner'),
        serviceWhatsappLinks: document.querySelectorAll('.service-whatsapp-link'),
        faqItems: document.querySelectorAll('.faq-item')
    };
    
    // ===== SISTEMA DE LOG (DESATIVADO EM PRODUÇÃO) =====
    const DEBUG = false;
    const log = {
        info: (msg) => DEBUG && console.log(msg),
        error: (msg) => DEBUG && console.error(msg),
        success: (msg) => DEBUG && console.log(msg)
    };
    
    // ===== UTILITÁRIOS =====
    const utils = {
        isMobile: () => window.innerWidth < config.mobileBreakpoint,
        
        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        throttle: (func, limit) => {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    };
    
    // ===== MENU MOBILE - CORRIGIDO =====
    function initMobileMenu() {
        if (!DOM.menuToggle || !DOM.navMenu) return;
        
        const closeMenu = () => {
            DOM.menuToggle.classList.remove('active');
            DOM.navMenu.classList.remove('active');
            DOM.menuToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        };
        
        const toggleMenu = () => {
            DOM.menuToggle.classList.toggle('active');
            DOM.navMenu.classList.toggle('active');
            const isOpen = DOM.navMenu.classList.contains('active');
            DOM.menuToggle.setAttribute('aria-expanded', isOpen);
            
            // Corrigido: controlar overflow apenas no mobile
            if (utils.isMobile()) {
                document.body.style.overflow = isOpen ? 'hidden' : '';
            }
        };
        
        // Toggle ao clicar no botão
        DOM.menuToggle.addEventListener('click', toggleMenu);
        
        // Fechar ao clicar em link - CORRIGIDO
        DOM.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (DOM.navMenu.classList.contains('active')) closeMenu();
            });
        });
        
        // Fechar ao clicar fora - NOVO E CORRIGIDO
        document.addEventListener('click', (e) => {
            if (!DOM.navMenu.classList.contains('active')) return;
            
            const isClickInsideMenu = DOM.navMenu.contains(e.target);
            const isClickOnToggle = DOM.menuToggle.contains(e.target);
            
            if (!isClickInsideMenu && !isClickOnToggle) closeMenu();
        });
        
        // Fechar ao redimensionar para desktop
        window.addEventListener('resize', utils.debounce(() => {
            if (!utils.isMobile() && DOM.navMenu.classList.contains('active')) closeMenu();
        }, 250));
        
        log.success('Menu mobile inicializado');
    }
    
    // ===== SCROLL E PROGRESS BAR - CORRIGIDO =====
    function initScrollEffects() {
        if (!DOM.sections.length) return;
        
        // Navbar transparente no topo, sólida ao rolar - listener próprio,
        // sem throttle, pra nunca "travar" no estado errado quando o scroll
        // termina no meio de uma janela de throttle
        const updateNavbarState = () => {
            if (DOM.navbar) {
                DOM.navbar.classList.toggle('is-scrolled', window.scrollY > 60);
            }
        };
        
        window.addEventListener('scroll', updateNavbarState, { passive: true });
        updateNavbarState();
        
        const updateOnScroll = () => {
            const scrollPosition = window.scrollY + 100;
            
            // Progress bar
            if (DOM.navProgress) {
                const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
                DOM.navProgress.style.width = `${progress}%`;
            }
            
            // Menu ativo - CORRIGIDO
            const nearBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 5;
            
            if (nearBottom) {
                DOM.navLinks.forEach(link => link.classList.remove('active'));
                DOM.navLinks[DOM.navLinks.length - 1].classList.add('active');
            } else {
                DOM.sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    const sectionHeight = section.clientHeight;
                    const sectionId = section.getAttribute('id');
                    
                    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                        DOM.navLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${sectionId}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                });
            }
            
            // Botão voltar ao topo
            if (DOM.backToTop) {
                DOM.backToTop.classList.toggle('visible', window.scrollY > 500);
            }
        };
        
        // Usar throttle para performance
        window.addEventListener('scroll', utils.throttle(updateOnScroll, 100), { passive: true });
        updateOnScroll(); // Inicializar
        
        // Botão voltar ao topo
        if (DOM.backToTop) {
            DOM.backToTop.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
        
        log.success('Efeitos de scroll inicializados');
    }
    
    // ===== FILTRO DE PORTFÓLIO - CORRIGIDO =====
    function initPortfolioFilter() {
        if (!DOM.filterButtons.length || !DOM.projectCards.length) return;
        
        // Inicializar todos como visíveis
        DOM.projectCards.forEach(card => {
            card.classList.add('visible');
        });
        
        DOM.filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Atualizar botões ativos
                DOM.filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                const filterValue = this.getAttribute('data-filter');
                
                // Filtrar projetos - CORRIGIDO
                DOM.projectCards.forEach(card => {
                    const categories = card.getAttribute('data-category').split(' ');
                    
                    if (filterValue === 'all' || categories.includes(filterValue)) {
                        card.classList.remove('hidden');
                        setTimeout(() => {
                            card.classList.add('visible');
                        }, 10);
                    } else {
                        card.classList.remove('visible');
                        setTimeout(() => {
                            card.classList.add('hidden');
                        }, 10);
                    }
                });
            });
        });
        
        log.success('Filtro de portfólio inicializado');
    }
    
    // ===== FORMULÁRIO WHATSAPP - CORRIGIDO =====
    function initWhatsAppForm() {
        if (!DOM.whatsappForm) return;
        
        // Limpar erro assim que o usuário começa a corrigir o campo
        ['name', 'service', 'message'].forEach(key => {
            const el = DOM.whatsappForm.querySelector(`#${key}`);
            if (!el) return;
            
            el.addEventListener('input', () => {
                const group = el.closest('.form-group');
                const errorEl = document.getElementById(`${key}-error`);
                if (group) group.classList.remove('has-error');
                if (errorEl) errorEl.textContent = '';
            });
        });
        
        DOM.whatsappForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Honeypot: se o campo escondido veio preenchido, é bot - ignora silenciosamente
            if (data.website) return;
            
            // Validação
            const requiredFields = [
                { key: 'name', el: this.querySelector('#name') },
                { key: 'service', el: this.querySelector('#service') },
                { key: 'message', el: this.querySelector('#message') }
            ];
            
            let firstInvalid = null;
            
            requiredFields.forEach(({ key, el }) => {
                if (!el) return;
                const errorEl = document.getElementById(`${key}-error`);
                const group = el.closest('.form-group');
                
                if (!data[key]) {
                    if (group) group.classList.add('has-error');
                    if (errorEl) errorEl.textContent = strings.formRequired;
                    if (!firstInvalid) firstInvalid = el;
                } else {
                    if (group) group.classList.remove('has-error');
                    if (errorEl) errorEl.textContent = '';
                }
            });
            
            if (firstInvalid) {
                firstInvalid.focus();
                return;
            }
            
            // Evita que * _ ~ digitados pelo usuário quebrem a formatação do WhatsApp
            const escapeWa = (str) => str.replace(/([*_~])/g, '\\$1');
            
            // Formatar mensagem
            const whatsappMessage = 
                `*${strings.whatsappHeader}*\n\n` +
                `👤 *${strings.whatsappName}:* ${escapeWa(data.name)}\n` +
                `🎯 *${strings.whatsappProject}:* ${escapeWa(data.service)}\n` +
                `💰 *${strings.whatsappBudget}:* ${escapeWa(data.budget || strings.whatsappBudgetDefault)}\n\n` +
                `📝 *${strings.whatsappMessage}:*\n${escapeWa(data.message)}\n\n` +
                `_${strings.whatsappFooter}_`;
            
            const phoneNumber = config.whatsappNumber;
            const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;
            
            // Feedback visual
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalHTML = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Abrindo WhatsApp...';
            submitBtn.disabled = true;
            
            // Abrir WhatsApp
            setTimeout(() => {
                const newWindow = window.open(whatsappURL, '_blank');
                
                if (newWindow) {
                    submitBtn.innerHTML = '<i class="fas fa-check"></i> WhatsApp Aberto!';
                    submitBtn.style.backgroundColor = '#25D366';
                    
                    // Resetar após 2 segundos
                    setTimeout(() => {
                        this.reset();
                        submitBtn.innerHTML = originalHTML;
                        submitBtn.style.backgroundColor = '';
                        submitBtn.disabled = false;
                    }, 2000);
                } else {
                    // Fallback se popup for bloqueado
                    submitBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> Clique para abrir';
                    submitBtn.onclick = () => window.open(whatsappURL, '_blank');
                    submitBtn.disabled = false;
                }
            }, 800);
        });
        
        log.success('Formulário WhatsApp inicializado');
    }
    
    // ===== WHATSAPP FLOAT - CORRIGIDO =====
    function initWhatsAppFloat() {
        if (!DOM.whatsappFloat) return;
        
        DOM.whatsappFloat.addEventListener('click', function(e) {
            e.preventDefault();
            
            const phoneNumber = config.whatsappNumber;
            const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(strings.whatsappFloatMessage)}`;
            
            // Tenta abrir em nova aba, fallback para mesma aba
            const newWindow = window.open(whatsappURL, '_blank');
            if (!newWindow) {
                window.location.href = whatsappURL;
            }
        });
        
        log.success('Botão WhatsApp flutuante inicializado');
    }
    
    // ===== SCROLL SUAVE - CORRIGIDO =====
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Ignorar links especiais
                if (href === '#' || href.includes('javascript:') || href.includes('mailto:') || href.includes('tel:')) {
                    return;
                }
                
                // Verificar se é link interno
                if (href.startsWith('#') && href.length > 1) {
                    e.preventDefault();
                    
                    const targetId = href.substring(1);
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        // Fechar menu mobile se aberto
                        if (DOM.navMenu && DOM.navMenu.classList.contains('active')) {
                            DOM.menuToggle.classList.remove('active');
                            DOM.navMenu.classList.remove('active');
                            DOM.menuToggle.setAttribute('aria-expanded', 'false');
                            if (utils.isMobile()) {
                                document.body.style.overflow = '';
                            }
                        }
                        
                        // Calcular offset - CORRIGIDO PARA MOBILE
                        const offset = config.scrollOffset;
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - offset;
                        
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                        
                        // Atualizar URL sem recarregar
                        history.pushState(null, null, href);
                    }
                }
            });
        });
        
        log.success('Scroll suave inicializado');
    }
    
    // ===== ANIMAÇÕES AO SCROLL - OTIMIZADO =====
    function initScrollAnimations() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });
            
            // Observar apenas elementos importantes
            document.querySelectorAll('.service-card, .project-card, .skill-card, .tech-icon, .partner-logo, .testimonial-card, .pricing-card, .faq-item, .contact-method, .footer-links, .footer-services, .footer-contact').forEach(el => {
                observer.observe(el);
            });
        }
        
        // Animação inicial do hero - SIMPLIFICADA
        setTimeout(() => {
            document.querySelectorAll('.hero-badge, .hero-title, .hero-description, .hero-actions').forEach((el, i) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                
                setTimeout(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, 100 + (i * 100));
            });
        }, 300);
        
        log.success('Animações inicializadas');
    }
    
    // ===== CONTADOR ANIMADO (badge "21+" de parceiros) =====
    function initCounterAnimation() {
        const counters = document.querySelectorAll('[data-count-to]');
        if (!counters.length || !('IntersectionObserver' in window)) return;
        
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;
        
        const duration = 1200;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-count-to'), 10);
                const suffix = el.getAttribute('data-suffix') || '';
                if (isNaN(target)) return;
                
                const startTime = performance.now();
                
                const tick = (now) => {
                    const progress = Math.min((now - startTime) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
                    const value = Math.round(eased * target);
                    el.textContent = `${value}${suffix}`;
                    
                    if (progress < 1) {
                        requestAnimationFrame(tick);
                    }
                };
                
                requestAnimationFrame(tick);
                observer.unobserve(el);
            });
        }, { threshold: 0.5 });
        
        counters.forEach(el => observer.observe(el));
    }
    
    // ===== ANO ATUAL =====
    // ===== MOCKUP DE CÓDIGO NO HERO (efeito "digitando") =====
    function initHeroCodeTypewriter() {
        const container = document.getElementById('hero-code');
        if (!container) return;
        
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isDesktop = window.matchMedia('(min-width: 992px)').matches;
        if (!isDesktop) return;
        
        const lang = document.documentElement.lang === 'en' ? 'en' : 'pt';
        
        const codeLines = {
            pt: [
                [{ t: '<h1 class="hero">', c: 'tag' }, { t: 'Design', c: 'text' }, { t: '</h1>', c: 'tag' }],
                [{ t: '<span>', c: 'tag' }, { t: '+ Code', c: 'text' }, { t: '</span>', c: 'tag' }],
                [],
                [{ t: '.criativo ', c: 'sel' }, { t: '{', c: 'punct' }],
                [{ t: '  display', c: 'prop' }, { t: ': ', c: 'punct' }, { t: 'flex', c: 'value' }, { t: ';', c: 'punct' }],
                [{ t: '  paixao', c: 'prop' }, { t: ': ', c: 'punct' }, { t: '100%', c: 'value' }, { t: ';', c: 'punct' }],
                [{ t: '}', c: 'punct' }],
                [],
                [{ t: 'function ', c: 'keyword' }, { t: 'converter', c: 'func' }, { t: '(ideia) ', c: 'punct' }, { t: '{', c: 'punct' }],
                [{ t: '  return ', c: 'keyword' }, { t: 'sucesso', c: 'value' }, { t: ';', c: 'punct' }],
                [{ t: '}', c: 'punct' }]
            ],
            en: [
                [{ t: '<h1 class="hero">', c: 'tag' }, { t: 'Design', c: 'text' }, { t: '</h1>', c: 'tag' }],
                [{ t: '<span>', c: 'tag' }, { t: '+ Code', c: 'text' }, { t: '</span>', c: 'tag' }],
                [],
                [{ t: '.creative ', c: 'sel' }, { t: '{', c: 'punct' }],
                [{ t: '  display', c: 'prop' }, { t: ': ', c: 'punct' }, { t: 'flex', c: 'value' }, { t: ';', c: 'punct' }],
                [{ t: '  passion', c: 'prop' }, { t: ': ', c: 'punct' }, { t: '100%', c: 'value' }, { t: ';', c: 'punct' }],
                [{ t: '}', c: 'punct' }],
                [],
                [{ t: 'function ', c: 'keyword' }, { t: 'convert', c: 'func' }, { t: '(idea) ', c: 'punct' }, { t: '{', c: 'punct' }],
                [{ t: '  return ', c: 'keyword' }, { t: 'success', c: 'value' }, { t: ';', c: 'punct' }],
                [{ t: '}', c: 'punct' }]
            ]
        }[lang];
        
        // Sem animação: renderiza tudo de uma vez
        if (prefersReducedMotion) {
            codeLines.forEach((tokens, i) => {
                const lineEl = document.createElement('div');
                lineEl.className = 'code-line';
                const num = document.createElement('span');
                num.className = 'line-number';
                num.textContent = i + 1;
                lineEl.appendChild(num);
                tokens.forEach(tok => {
                    const span = document.createElement('span');
                    span.className = `token-${tok.c}`;
                    span.textContent = tok.t;
                    lineEl.appendChild(span);
                });
                container.appendChild(lineEl);
            });
            return;
        }
        
        let lineIndex = 0;
        let tokenIndex = 0;
        let charIndex = 0;
        let currentLineEl = null;
        let currentTokenEl = null;
        let cursorEl = null;
        
        const typeChar = () => {
            const tokens = codeLines[lineIndex];
            
            // Nova linha
            if (tokenIndex === 0 && charIndex === 0) {
                currentLineEl = document.createElement('div');
                currentLineEl.className = 'code-line';
                const num = document.createElement('span');
                num.className = 'line-number';
                num.textContent = lineIndex + 1;
                currentLineEl.appendChild(num);
                container.appendChild(currentLineEl);
                
                cursorEl = document.createElement('span');
                cursorEl.className = 'code-cursor';
                currentLineEl.appendChild(cursorEl);
            }
            
            // Linha vazia: pula rápido
            if (tokens.length === 0) {
                setTimeout(() => {
                    lineIndex++;
                    tokenIndex = 0;
                    charIndex = 0;
                    if (lineIndex < codeLines.length) typeChar();
                }, 80);
                return;
            }
            
            const token = tokens[tokenIndex];
            
            if (charIndex === 0) {
                currentTokenEl = document.createElement('span');
                currentTokenEl.className = `token-${token.c}`;
                currentLineEl.insertBefore(currentTokenEl, cursorEl);
            }
            
            currentTokenEl.textContent += token.t[charIndex];
            charIndex++;
            
            if (charIndex < token.t.length) {
                setTimeout(typeChar, 16 + Math.random() * 18);
                return;
            }
            
            // Token concluído
            charIndex = 0;
            tokenIndex++;
            
            if (tokenIndex < tokens.length) {
                setTimeout(typeChar, 16 + Math.random() * 18);
                return;
            }
            
            // Linha concluída
            if (cursorEl) cursorEl.remove();
            lineIndex++;
            tokenIndex = 0;
            
            if (lineIndex < codeLines.length) {
                setTimeout(typeChar, 90);
            } else {
                // Terminou tudo: deixa um cursor piscando na última linha
                const finalCursor = document.createElement('span');
                finalCursor.className = 'code-cursor';
                currentLineEl.appendChild(finalCursor);
            }
        };
        
        setTimeout(typeChar, 900);
    }
    
    // ===== PARALLAX SUAVE NO HERO (segue o mouse) =====
    function initHeroParallax() {
        const hero = document.querySelector('.hero');
        const stars = document.querySelector('.hero-stars');
        const aurora = document.querySelector('.hero-aurora');
        const mockup = document.querySelector('.hero-mockup');
        if (!hero || utils.isMobile()) return;
        
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;
        
        let targetX = 0, targetY = 0;
        let currentX = 0, currentY = 0;
        let rafId = null;
        
        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            
            if (!rafId) rafId = requestAnimationFrame(animateParallax);
        });
        
        hero.addEventListener('mouseleave', () => {
            targetX = 0;
            targetY = 0;
            if (!rafId) rafId = requestAnimationFrame(animateParallax);
        });
        
        function animateParallax() {
            currentX += (targetX - currentX) * 0.06;
            currentY += (targetY - currentY) * 0.06;
            
            if (aurora) aurora.style.transform = `translate(${currentX * 18}px, ${currentY * 18}px)`;
            if (stars) stars.style.transform = `translate(${currentX * -8}px, ${currentY * -8}px)`;
            if (mockup) mockup.style.transform = `translate(${currentX * 10}px, ${currentY * 10}px)`;
            
            if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
                rafId = requestAnimationFrame(animateParallax);
            } else {
                rafId = null;
            }
        }
    }
    
    // ===== BOTÕES MAGNÉTICOS (puxam levemente na direção do cursor) =====
    // ===== EFEITO RIPPLE (ondulação ao clicar) =====
    function initRippleEffect() {
        const selector = '.btn, .btn-service, .project-link, .filter-btn, .carousel-arrow, .faq-question, .nav-options-item';
        
        document.addEventListener('click', (e) => {
            const target = e.target.closest(selector);
            if (!target) return;
            
            const rect = target.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const ripple = document.createElement('span');
            
            ripple.className = 'btn-ripple';
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            
            target.appendChild(ripple);
            setTimeout(() => ripple.remove(), 650);
        });
    }
    
    function initMagneticButtons() {
        if (utils.isMobile()) return;
        
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;
        
        document.querySelectorAll('[data-magnetic]').forEach(btn => {
            const strength = 0.35;
            const radius = 70;
            
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const relX = e.clientX - (rect.left + rect.width / 2);
                const relY = e.clientY - (rect.top + rect.height / 2);
                const distance = Math.sqrt(relX * relX + relY * relY);
                
                if (distance < radius) {
                    btn.style.transform = `translate(${relX * strength}px, ${relY * strength}px)`;
                }
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0, 0)';
            });
        });
    }
    
    // ===== PRELOADER =====
    function initPreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;
        
        let hidden = false;
        const hide = () => {
            if (hidden) return;
            hidden = true;
            preloader.classList.add('is-hidden');
            setTimeout(() => preloader.remove(), 500);
        };
        
        window.addEventListener('load', hide);
        // Rede de segurança: nunca prender a pessoa atrás do preloader
        setTimeout(hide, 2500);
    }
    
    function initCurrentYear() {
        if (DOM.currentYear) {
            DOM.currentYear.textContent = new Date().getFullYear();
        }
    }
    
    // ===== PARCEIROS SLIDER - OTIMIZADO =====
    function initPartnersSlider() {
        const track = DOM.partnersTrack;
        const prevBtn = document.querySelector('.carousel-arrow-prev');
        const nextBtn = document.querySelector('.carousel-arrow-next');
        const progressBar = document.querySelector('.partners-progress-bar');
        if (!track || !prevBtn || !nextBtn) return;
        
        // Rola quase uma "página" inteira visível, não só 2 cards fixos
        const getScrollAmount = () => track.clientWidth * 0.85;
        
        const updateProgress = () => {
            const maxScroll = track.scrollWidth - track.clientWidth;
            const ratio = maxScroll > 0 ? track.scrollLeft / maxScroll : 1;
            if (progressBar) {
                progressBar.style.width = `${Math.min(100, Math.max(6, ratio * 100))}%`;
            }
        };
        
        const updateArrowState = () => {
            const maxScroll = track.scrollWidth - track.clientWidth - 2;
            prevBtn.disabled = track.scrollLeft <= 2;
            nextBtn.disabled = track.scrollLeft >= maxScroll;
            updateProgress();
        };
        
        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });
        
        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        });
        
        // Navegação por teclado (setas) quando o carrossel está focado
        track.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
            }
        });
        
        // Arrastar com o mouse no desktop (o touch já funciona nativamente)
        let isDragging = false;
        let dragStartX = 0;
        let dragScrollStart = 0;
        let dragMoved = false;
        
        track.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragMoved = false;
            dragStartX = e.pageX;
            dragScrollStart = track.scrollLeft;
            track.classList.add('is-dragging');
        });
        
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const delta = e.pageX - dragStartX;
            if (Math.abs(delta) > 4) dragMoved = true;
            track.scrollLeft = dragScrollStart - delta;
        });
        
        window.addEventListener('mouseup', () => {
            isDragging = false;
            track.classList.remove('is-dragging');
        });
        
        // Evita que o arraste dispare o link do card sem querer
        track.addEventListener('click', (e) => {
            if (dragMoved) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
        
        track.addEventListener('scroll', utils.debounce(updateArrowState, 100));
        window.addEventListener('resize', utils.debounce(updateArrowState, 250));
        updateArrowState();
        
        // ===== AUTO-SCROLL SUAVE (pausa em qualquer interação) =====
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (!prefersReducedMotion) {
            const AUTO_SPEED = 0.5; // px por frame (~30px/s)
            const RESUME_DELAY = 3500; // ms parado até voltar a rolar sozinho
            let autoRAF = null;
            let resumeTimeout = null;
            let userPaused = false;
            
            const stepAuto = () => {
                if (userPaused || isDragging) {
                    autoRAF = null;
                    return;
                }
                
                const maxScroll = track.scrollWidth - track.clientWidth - 1;
                
                if (track.scrollLeft >= maxScroll) {
                    // Chegou ao fim: pausa um instante e volta pro início suavemente
                    autoRAF = null;
                    setTimeout(() => {
                        if (userPaused) return;
                        track.scrollTo({ left: 0, behavior: 'smooth' });
                        setTimeout(() => { if (!userPaused) startAuto(); }, 600);
                    }, 1200);
                    return;
                }
                
                track.scrollLeft += AUTO_SPEED;
                autoRAF = requestAnimationFrame(stepAuto);
            };
            
            function startAuto() {
                if (autoRAF) return;
                autoRAF = requestAnimationFrame(stepAuto);
            }
            
            function pauseAuto() {
                userPaused = true;
                if (autoRAF) {
                    cancelAnimationFrame(autoRAF);
                    autoRAF = null;
                }
                clearTimeout(resumeTimeout);
                resumeTimeout = setTimeout(() => {
                    userPaused = false;
                    startAuto();
                }, RESUME_DELAY);
            }
            
            // Qualquer interação pausa e reagenda a retomada
            ['mouseenter', 'mousedown', 'touchstart', 'wheel'].forEach(evt => {
                track.addEventListener(evt, pauseAuto, { passive: true });
            });
            
            [prevBtn, nextBtn].forEach(btn => {
                btn.addEventListener('click', pauseAuto);
            });
            
            track.addEventListener('keydown', pauseAuto);
            
            startAuto();
        }
        
        log.success('Carrossel de parceiros inicializado');
    }
    
    // ===== CARD "ADICIONAR PROJETO" =====
    function initAddProjectCard() {
        if (!DOM.addProjectCard) return;
        
        DOM.addProjectCard.addEventListener('click', function(e) {
            if (!e.target.closest('a') && !e.target.closest('button')) {
                // Redirecionar suavemente para contato
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                    if (DOM.navMenu && DOM.navMenu.classList.contains('active')) {
                        DOM.menuToggle.classList.remove('active');
                        DOM.navMenu.classList.remove('active');
                        DOM.menuToggle.setAttribute('aria-expanded', 'false');
                        if (utils.isMobile()) {
                            document.body.style.overflow = '';
                        }
                    }
                    
                    setTimeout(() => {
                        contactSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }, 100);
                }
            }
        });
    }
    
    // ===== LINKS DE WHATSAPP POR SERVIÇO =====
    function initServiceWhatsappLinks() {
        if (!DOM.serviceWhatsappLinks.length) return;
        
        DOM.serviceWhatsappLinks.forEach(link => {
            const service = link.getAttribute('data-service') || 'um projeto';
            const message = strings.serviceInterestMessage(service);
            link.href = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        });
        
        log.success('Links de WhatsApp por serviço inicializados');
    }
    
    // ===== FAQ (ACCORDION) =====
    function initFAQ() {
        if (!DOM.faqItems.length) return;
        
        DOM.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            if (!question) return;
            
            question.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');
                
                DOM.faqItems.forEach(i => {
                    i.classList.remove('open');
                    i.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
                });
                
                if (!isOpen) {
                    item.classList.add('open');
                    question.setAttribute('aria-expanded', 'true');
                }
            });
        });
        
        log.success('FAQ inicializado');
    }
    
    // ===== TELA DE ESCOLHA DE IDIOMA (primeira visita) =====
    function initLangGate() {
        const gate = document.getElementById('lang-gate');
        if (!gate) return;
        
        const STORAGE_KEY = 'creative-codex-lang';
        const currentLang = document.documentElement.lang === 'en' ? 'en' : 'pt';
        const saved = localStorage.getItem(STORAGE_KEY);
        
        const targetPage = (lang) => lang === 'en' ? 'index-en.html' : 'index.html';
        
        const choose = (lang) => {
            localStorage.setItem(STORAGE_KEY, lang);
            
            if (lang !== currentLang) {
                window.location.href = targetPage(lang);
                return;
            }
            
            gate.hidden = true;
            document.body.style.overflow = '';
        };
        
        // Só mostra na primeira visita (sem preferência salva ainda)
        if (!saved) {
            gate.hidden = false;
            document.body.style.overflow = 'hidden';
            const firstOption = gate.querySelector('.lang-gate-option');
            if (firstOption) firstOption.focus();
        }
        
        gate.querySelectorAll('.lang-gate-option').forEach(btn => {
            btn.addEventListener('click', () => choose(btn.getAttribute('data-lang')));
        });
        
        // Clicar fora ou apertar Esc = continuar no idioma atual da página
        const dismissWithCurrent = () => choose(currentLang);
        
        gate.querySelectorAll('[data-lang-gate-default]').forEach(el => {
            el.addEventListener('click', dismissWithCurrent);
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !gate.hidden) dismissWithCurrent();
        });
        
        log.success('Tela de escolha de idioma inicializada');
        
        // Manter a preferência sincronizada se a pessoa trocar pelo menu de opções
        const headerSwitch = document.querySelector('.nav-options-item[href]');
        if (headerSwitch) {
            headerSwitch.addEventListener('click', () => {
                const targetLang = currentLang === 'en' ? 'pt' : 'en';
                localStorage.setItem(STORAGE_KEY, targetLang);
            });
        }
    }
    
    // ===== MODAL DE CASE COMPLETO =====
    const caseStudies = window.caseStudiesData || {
        lais: {
            tag: 'Landing Page · Media Kit',
            title: 'Laís Cavicchioli - Media Kit',
            challenge: 'Como influenciadora, ela dependia só do Instagram para negociar parcerias com marcas, sem um espaço próprio e profissional para apresentar seus números e portfólio.',
            solution: 'Criei uma landing page personalizada reunindo apresentação, métricas de audiência e portfólio de trabalhos anteriores, com visual alinhado à identidade dela e fácil de compartilhar em qualquer negociação.',
            result: 'Ela ganhou uma ferramenta profissional própria para fechar parcerias, sem depender só de prints e do direct do Instagram.',
            link: 'https://brenosoad.github.io/Midia-Kit-Lais-/'
        },
        zeek: {
            tag: 'Landing Page · Captação',
            title: 'Zeek Cursos - Workshop Informática Executiva',
            challenge: 'A Zeek precisava de uma página focada em captar inscrições para um workshop específico, direcionando o público certo e facilitando o cadastro.',
            solution: 'Desenvolvi uma landing page com copy e estrutura voltadas à conversão: apresentação clara do workshop, benefícios e um formulário de cadastro simples, mantendo a identidade visual da marca.',
            result: 'A Zeek passou a ter uma página própria para cada campanha, em vez de direcionar tráfego pago para redes sociais genéricas.',
            link: 'https://zeekcursos.com.br/Workshop/Informatica-Executiva'
        }
    };
    
    function initCaseModal() {
        const modal = document.getElementById('case-modal');
        if (!modal) return;
        
        const tagEl = document.getElementById('case-modal-tag');
        const titleEl = document.getElementById('case-modal-title');
        const challengeEl = document.getElementById('case-modal-challenge');
        const solutionEl = document.getElementById('case-modal-solution');
        const resultEl = document.getElementById('case-modal-result');
        const linkEl = document.getElementById('case-modal-link');
        
        let lastFocused = null;
        
        const openModal = (caseId) => {
            const data = caseStudies[caseId];
            if (!data) return;
            
            tagEl.textContent = data.tag;
            titleEl.textContent = data.title;
            challengeEl.textContent = data.challenge;
            solutionEl.textContent = data.solution;
            resultEl.textContent = data.result;
            linkEl.href = data.link;
            
            lastFocused = document.activeElement;
            modal.hidden = false;
            document.body.style.overflow = 'hidden';
            modal.querySelector('.case-modal-close').focus();
        };
        
        const closeModal = () => {
            modal.hidden = true;
            document.body.style.overflow = '';
            if (lastFocused) lastFocused.focus();
        };
        
        document.querySelectorAll('.case-trigger').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.getAttribute('data-case')));
        });
        
        modal.querySelectorAll('[data-close-modal]').forEach(el => {
            el.addEventListener('click', closeModal);
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.hidden) closeModal();
        });
        
        log.success('Modal de case inicializado');
    }
    
    // ===== TEMA CLARO/ESCURO =====
    function initThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;
        
        const STORAGE_KEY = 'creative-codex-theme';
        const label = toggle.querySelector('.theme-toggle-label');
        
        const updateLabel = () => {
            if (!label) return;
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            label.textContent = isDark ? strings.themeToLight : strings.themeToDark;
        };
        
        // Tema inicial já foi aplicado por um script inline no <head> (evita flash)
        updateLabel();
        
        toggle.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem(STORAGE_KEY, 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem(STORAGE_KEY, 'dark');
            }
            
            updateLabel();
        });
        
        log.success('Tema claro/escuro inicializado');
    }
    
    // ===== MENU DE OPÇÕES (IDIOMA + TEMA) =====
    function initNavOptionsMenu() {
        const toggle = document.getElementById('nav-options-toggle');
        const menu = document.getElementById('nav-options-menu');
        if (!toggle || !menu) return;
        
        const closeMenu = () => {
            menu.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
        };
        
        const openMenu = () => {
            menu.hidden = false;
            toggle.setAttribute('aria-expanded', 'true');
        };
        
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (menu.hidden) {
                openMenu();
            } else {
                closeMenu();
            }
        });
        
        // Fecha ao clicar fora
        document.addEventListener('click', (e) => {
            if (!menu.hidden && !menu.contains(e.target) && e.target !== toggle) {
                closeMenu();
            }
        });
        
        // Fecha com Esc
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !menu.hidden) {
                closeMenu();
                toggle.focus();
            }
        });
        
        // Fecha ao escolher o idioma (o tema mantém aberto pra ver a troca)
        menu.querySelectorAll('a.nav-options-item').forEach(item => {
            item.addEventListener('click', closeMenu);
        });
        
        log.success('Menu de opções inicializado');
    }
    
    // ===== COMPARTILHAR SITE =====
    function initShareButton() {
        const shareBtn = document.getElementById('share-button');
        if (!shareBtn) return;
        
        shareBtn.addEventListener('click', async () => {
            const shareData = {
                title: strings.shareTitle,
                text: strings.shareText,
                url: window.location.href
            };
            
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    // Usuário cancelou o share, sem problema
                }
                return;
            }
            
            // Fallback: copiar link
            try {
                await navigator.clipboard.writeText(shareData.url);
                const originalText = shareBtn.innerHTML;
                shareBtn.innerHTML = strings.linkCopied;
                setTimeout(() => {
                    shareBtn.innerHTML = originalText;
                }, 2000);
            } catch (err) {
                log.error('Não foi possível copiar o link');
            }
        });
        
        log.success('Botão de compartilhar inicializado');
    }
    
    // ===== PREVENIR COMPORTAMENTOS INDESEJADOS =====
    function initPreventDefaults() {
        // Prevenir submit de forms não tratados
        document.querySelectorAll('form:not(#whatsapp-form)').forEach(form => {
            form.addEventListener('submit', (e) => e.preventDefault());
        });
    }
    
    // ===== GERENCIAR IMAGENS QUE NÃO CARREGAM =====
    function initImageFallbacks() {
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('error', function() {
                if (!this.src.includes('img/')) return;
                
                // Substitui so a imagem quebrada por um icone discreto do mesmo tamanho,
                // sem cobrir o card inteiro
                const placeholder = document.createElement('span');
                placeholder.className = 'img-fallback';
                placeholder.setAttribute('aria-hidden', 'true');
                placeholder.innerHTML = '<i class="fas fa-image"></i>';
                
                if (this.classList.contains('logo-img')) placeholder.classList.add('logo-img');
                if (this.classList.contains('tech-logo')) placeholder.classList.add('tech-logo');
                if (this.classList.contains('profile-photo')) placeholder.classList.add('profile-photo', 'img-fallback-tall');
                if (this.closest('.logo-circle')) placeholder.classList.add('img-fallback-round');
                
                this.replaceWith(placeholder);
            });
        });
        
        // Fallback para imagens de fundo (background-image inline) - portfolio
        document.querySelectorAll('.project-image[style*="background-image"]').forEach(el => {
            const match = el.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
            if (!match) return;
            
            const testImg = new Image();
            testImg.onerror = () => {
                el.style.backgroundImage = 'none';
                el.classList.add('img-fallback-bg');
            };
            testImg.src = match[1];
        });
    }
    
    // ===== INICIALIZAÇÃO PRINCIPAL =====
    function init() {
        log.info('Inicializando Creative Codex...');
        
        // Ordem de inicialização importante
        initPreloader();
        initLangGate();
        initHeroCodeTypewriter();
        initHeroParallax();
        initMagneticButtons();
        initRippleEffect();
        initCurrentYear();
        initMobileMenu();
        initScrollEffects();
        initSmoothScroll();
        initScrollAnimations();
        initCounterAnimation();
        initPortfolioFilter();
        initWhatsAppForm();
        initWhatsAppFloat();
        initPartnersSlider();
        initAddProjectCard();
        initServiceWhatsappLinks();
        initFAQ();
        initCaseModal();
        initThemeToggle();
        initNavOptionsMenu();
        initShareButton();
        initPreventDefaults();
        initImageFallbacks();
        
        // Ajustes específicos para mobile
        if (utils.isMobile()) {
            document.body.classList.add('is-mobile');
            log.info('Modo mobile detectado');
        }
        
        log.success('Creative Codex totalmente inicializado!');
    }
    
    // ===== INICIAR TUDO =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
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
            formRequired: 'Por favor, preencha todos os campos obrigatórios (*)',
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
            linkCopied: '<i class="fas fa-check" aria-hidden="true"></i> Link copiado!'
        },
        en: {
            formRequired: 'Please fill in all required fields (*)',
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
            linkCopied: '<i class="fas fa-check" aria-hidden="true"></i> Link copied!'
        }
    }[LANG];
    
    // ===== ELEMENTOS DO DOM =====
    const DOM = {
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
        window.addEventListener('scroll', utils.throttle(updateOnScroll, 100));
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
        
        DOM.whatsappForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Honeypot: se o campo escondido veio preenchido, é bot - ignora silenciosamente
            if (data.website) return;
            
            // Validação
            if (!data.name || !data.service || !data.message) {
                alert(strings.formRequired);
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
            
            const defaultMessage = 
                `👋 *Olá! Gostaria de conversar sobre um projeto.*\n\n` +
                `Encontrei você através do site Creative Codex.\n\n` +
                `Podemos conversar?`;
            
            const phoneNumber = config.whatsappNumber;
            const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;
            
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
            document.querySelectorAll('.service-card, .project-card, .skill-card, .tech-icon, .partner-logo').forEach(el => {
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
        if (!track || !prevBtn || !nextBtn) return;
        
        // Quantidade de pixels por clique (aprox. 2 cards)
        const getScrollAmount = () => {
            const card = track.querySelector('.partner-logo');
            const cardWidth = card ? card.offsetWidth : 210;
            const gap = 24;
            return (cardWidth + gap) * 2;
        };
        
        const updateArrowState = () => {
            const maxScroll = track.scrollWidth - track.clientWidth - 2;
            prevBtn.disabled = track.scrollLeft <= 2;
            nextBtn.disabled = track.scrollLeft >= maxScroll;
        };
        
        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });
        
        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        });
        
        track.addEventListener('scroll', utils.debounce(updateArrowState, 100));
        window.addEventListener('resize', utils.debounce(updateArrowState, 250));
        updateArrowState();
        
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
    
    // ===== MODAL DE CASE COMPLETO =====
    const caseStudies = window.caseStudiesData || {
        lais: {
            tag: 'Landing Page · Media Kit',
            title: 'Laís Cavicchioli - Media Kit',
            challenge: 'Como influenciadora, ela dependia só do Instagram para negociar parcerias com marcas, sem um espaço próprio e profissional para apresentar seus números e portfólio.',
            solution: 'Criei uma landing page personalizada reunindo apresentação, métricas de audiência e portfólio de trabalhos anteriores, com visual alinhado à identidade dela e fácil de compartilhar em qualquer negociação.',
            result: 'Ela ganhou uma ferramenta profissional própria para fechar parcerias, sem depender só de prints e do direct do Instagram. [Adicione aqui um resultado real, se tiver: nº de propostas, parcerias fechadas etc.]',
            link: 'https://brenosoad.github.io/Midia-Kit-Lais-/'
        },
        zeek: {
            tag: 'Landing Page · Captação',
            title: 'Zeek Cursos - Workshop Informática Executiva',
            challenge: 'A Zeek precisava de uma página focada em captar inscrições para um workshop específico, direcionando o público certo e facilitando o cadastro.',
            solution: 'Desenvolvi uma landing page com copy e estrutura voltadas à conversão: apresentação clara do workshop, benefícios e um formulário de cadastro simples, mantendo a identidade visual da marca.',
            result: 'A Zeek passou a ter uma página própria para cada campanha, em vez de direcionar tráfego pago para redes sociais genéricas. [Adicione aqui um resultado real, se tiver: nº de inscritos, taxa de conversão etc.]',
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
        
        // Tema inicial já foi aplicado por um script inline no <head> (evita flash)
        toggle.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem(STORAGE_KEY, 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem(STORAGE_KEY, 'dark');
            }
        });
        
        log.success('Tema claro/escuro inicializado');
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
        // Prevenir menu de contexto em placeholders
        document.querySelectorAll('[class*="placeholder"]').forEach(el => {
            el.addEventListener('contextmenu', (e) => e.preventDefault());
        });
        
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
    
    // ===== HANDLERS PARA WINDOW =====
    window.addEventListener('resize', utils.debounce(() => {
        if (utils.isMobile()) {
            document.body.classList.add('is-mobile');
        } else {
            document.body.classList.remove('is-mobile');
        }
    }, 250));
    
    // Expor utils para debugging se necessário
    window.CreativeCodex = { utils, config };
    
})();
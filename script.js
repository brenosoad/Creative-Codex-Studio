// ============================================
// CREATIVE CODEX - SCRIPT OTIMIZADO PARA MOBILE
// ============================================

(function() {
    'use strict';
    
    // ===== CONFIGURAÇÕES GERAIS =====
    const config = {
        mobileBreakpoint: 768,
        scrollOffset: 80,
        animationDuration: 300
    };
    
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
        partnersSlider: document.querySelector('.partners-slider'),
        addProjectCard: document.querySelector('.add-project')
    };
    
    // ===== SISTEMA DE LOG (DEBUG) =====
    const log = {
        info: (msg) => console.log(`ℹ️ ${msg}`),
        error: (msg) => console.error(`❌ ${msg}`),
        success: (msg) => console.log(`✅ ${msg}`)
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
        
        const toggleMenu = () => {
            DOM.menuToggle.classList.toggle('active');
            DOM.navMenu.classList.toggle('active');
            
            // Corrigido: controlar overflow apenas no mobile
            if (utils.isMobile()) {
                document.body.style.overflow = DOM.navMenu.classList.contains('active') ? 'hidden' : '';
            }
        };
        
        // Toggle ao clicar no botão
        DOM.menuToggle.addEventListener('click', toggleMenu);
        
        // Fechar ao clicar em link - CORRIGIDO
        DOM.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (DOM.navMenu.classList.contains('active')) {
                    DOM.menuToggle.classList.remove('active');
                    DOM.navMenu.classList.remove('active');
                    if (utils.isMobile()) {
                        document.body.style.overflow = '';
                    }
                }
            });
        });
        
        // Fechar ao clicar fora - NOVO E CORRIGIDO
        document.addEventListener('click', (e) => {
            if (!DOM.navMenu.classList.contains('active')) return;
            
            const isClickInsideMenu = DOM.navMenu.contains(e.target);
            const isClickOnToggle = DOM.menuToggle.contains(e.target);
            
            if (!isClickInsideMenu && !isClickOnToggle) {
                DOM.menuToggle.classList.remove('active');
                DOM.navMenu.classList.remove('active');
                if (utils.isMobile()) {
                    document.body.style.overflow = '';
                }
            }
        });
        
        // Fechar ao redimensionar para desktop
        window.addEventListener('resize', utils.debounce(() => {
            if (!utils.isMobile() && DOM.navMenu.classList.contains('active')) {
                DOM.menuToggle.classList.remove('active');
                DOM.navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
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
        
        // Adicionar CSS para animação
        const style = document.createElement('style');
        style.textContent = `
            .project-card {
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
            .project-card.hidden {
                opacity: 0;
                transform: scale(0.95);
                pointer-events: none;
                position: absolute;
                visibility: hidden;
            }
            .project-card.visible {
                opacity: 1;
                transform: scale(1);
                position: relative;
                visibility: visible;
            }
        `;
        document.head.appendChild(style);
        
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
            
            // Validação
            if (!data.name || !data.service || !data.message) {
                alert('Por favor, preencha todos os campos obrigatórios (*)');
                return;
            }
            
            // Formatar mensagem
            const whatsappMessage = 
                `*NOVA PROPOSTA - CREATIVE CODEX*\n\n` +
                `👤 *Nome:* ${data.name}\n` +
                `🎯 *Projeto:* ${data.service}\n` +
                `💰 *Orçamento:* ${data.budget || 'A definir'}\n\n` +
                `📝 *Mensagem:*\n${data.message}\n\n` +
                `_Enviado através do site Creative Codex_`;
            
            const phoneNumber = '5516997837454';
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
            
            const phoneNumber = '5516997837454';
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
            document.querySelectorAll('.service-card, .project-card:not(.add-project), .skill-card, .tech-icon').forEach(el => {
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
    
    // ===== ANO ATUAL =====
    function initCurrentYear() {
        if (DOM.currentYear) {
            DOM.currentYear.textContent = new Date().getFullYear();
        }
    }
    
    // ===== PARCEIROS SLIDER - OTIMIZADO =====
    function initPartnersSlider() {
        if (!DOM.partnersSlider) return;
        
        const sliderTrack = DOM.partnersSlider.querySelector('.slider-track');
        if (!sliderTrack) return;
        
        // Ajustar velocidade baseado no dispositivo
        const adjustSpeed = () => {
            const speed = utils.isMobile() ? 40 : 30;
            sliderTrack.style.animationDuration = `${speed}s`;
        };
        
        adjustSpeed();
        window.addEventListener('resize', utils.debounce(adjustSpeed, 250));
        
        // Pausar no hover
        DOM.partnersSlider.addEventListener('mouseenter', () => {
            sliderTrack.style.animationPlayState = 'paused';
        });
        
        DOM.partnersSlider.addEventListener('mouseleave', () => {
            sliderTrack.style.animationPlayState = 'running';
        });
        
        log.success('Slider de parceiros inicializado');
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
                // Tentar fallback para SVG ou placeholder
                if (this.src.includes('img/')) {
                    this.style.display = 'none';
                    const parent = this.closest('.logo-container, .tech-icon, .skill-icon');
                    if (parent) {
                        const textElement = parent.querySelector('span, p, h5');
                        if (textElement) {
                            parent.style.backgroundColor = '#f0f4ff';
                            parent.style.display = 'flex';
                            parent.style.alignItems = 'center';
                            parent.style.justifyContent = 'center';
                            parent.style.padding = '10px';
                        }
                    }
                }
            });
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
        initPortfolioFilter();
        initWhatsAppForm();
        initWhatsAppFloat();
        initPartnersSlider();
        initAddProjectCard();
        initPreventDefaults();
        initImageFallbacks();
        
        // Ajustes específicos para mobile
        if (utils.isMobile()) {
            document.body.classList.add('is-mobile');
            log.info('Modo mobile detectado');
        }
        
        // Log final
        setTimeout(() => {
            log.success('Creative Codex totalmente inicializado!');
            console.log('📱 Dispositivo:', utils.isMobile() ? 'Mobile' : 'Desktop');
            console.log('🖥️  Largura:', window.innerWidth, 'px');
        }, 500);
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
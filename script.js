// ===== SCRIPT.JS - VERSÃO MELHORADA E CORRIGIDA =====

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== ELEMENTOS DO DOM =====
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const backToTop = document.querySelector('.back-to-top');
    const navProgress = document.querySelector('.nav-progress');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    const currentYear = document.getElementById('current-year');
    const whatsappForm = document.getElementById('whatsapp-form');
    const whatsappFloat = document.querySelector('.whatsapp-float');
    
    // ===== MENU MOBILE =====
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
    }
    
    // Fechar menu ao clicar em link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // ===== MENU ATIVO AO SCROLL + PROGRESS BAR =====
    const sections = document.querySelectorAll('section');
    
    function updateActiveSection() {
        let scrollPosition = window.scrollY + 200;
        
        // Atualizar barra de progresso
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        if (navProgress) {
            navProgress.style.width = `${progress}%`;
        }
        
        // Atualizar menu ativo
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
        
        // Botão voltar ao topo
        if (backToTop) {
            if (window.scrollY > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }
    }
    
    window.addEventListener('scroll', updateActiveSection);
    updateActiveSection(); // Inicializar
    
    // ===== BOTÃO VOLTAR AO TOPO =====
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // ===== FILTRO PORTFÓLIO =====
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Atualizar botões ativos
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filterValue = this.getAttribute('data-filter');
            
            // Filtrar projetos
            projectCards.forEach(card => {
                const categories = card.getAttribute('data-category').split(' ');
                
                if (filterValue === 'all' || categories.includes(filterValue)) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
    
    // ===== FORMULÁRIO WHATSAPP =====
    if (whatsappForm) {
        whatsappForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Pegar valores do formulário
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Validar campos obrigatórios
            if (!data.name || !data.service || !data.message) {
                alert('Por favor, preencha todos os campos obrigatórios (*)');
                return;
            }
            
            // Formatar a mensagem para WhatsApp (sem emojis, com traços)
            const whatsappMessage = 
                `- NOVA PROPOSTA - CREATIVE CODEX -\n\n` +
                `- Nome: ${data.name}\n` +
                `- Projeto: ${data.service}\n` +
                `- Orçamento: ${data.budget || 'Ainda não definido'}\n\n` +
                `- Mensagem:\n${data.message}\n\n` +
                `Enviado através do site Creative Codex`;
            
            // Seu número de WhatsApp (com código do país)
            const phoneNumber = '5516997837454';
            
            // Criar URL do WhatsApp
            const encodedMessage = encodeURIComponent(whatsappMessage);
            const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
            
            // Feedback visual
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            const originalBgColor = submitBtn.style.backgroundColor;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            submitBtn.disabled = true;
            
            // Pequeno delay para mostrar o feedback
            setTimeout(() => {
                // Abrir WhatsApp em nova aba
                window.open(whatsappURL, '_blank');
                
                // Mudar botão para sucesso
                submitBtn.innerHTML = '<i class="fas fa-check"></i> WhatsApp Aberto!';
                submitBtn.style.backgroundColor = '#25D366';
                
                // Resetar após 3 segundos
                setTimeout(() => {
                    this.reset();
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.backgroundColor = originalBgColor;
                    submitBtn.disabled = false;
                }, 3000);
            }, 500);
        });
    }
    
    // ===== WHATSAPP FLOAT =====
    if (whatsappFloat) {
        whatsappFloat.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Mensagem padrão sem emojis, com traços
            const defaultMessage = 
                `- Olá! Gostaria de conversar sobre um projeto. -\n\n` +
                `Encontrei você através do site Creative Codex.\n\n` +
                `Podemos conversar?`;
            
            const phoneNumber = '5516997837454';
            const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;
            
            // Abrir em nova aba
            window.open(whatsappURL, '_blank');
        });
    }
    
    // ===== ANIMAÇÃO AO SCROLL =====
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);
    
    // Observar elementos para animação
    document.querySelectorAll('.service-card, .project-card, .skill-card, .tech-icon, .partner-logo').forEach(el => {
        observer.observe(el);
    });
    
    // ===== ANO ATUAL =====
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }
    
    // ===== INTERAÇÕES DOS PROJETOS =====
    document.querySelectorAll('.project-view').forEach(button => {
        button.addEventListener('click', function(e) {
            // O link já tem target="_blank", então não precisamos fazer nada
            // Apenas garantir que o clique não seja bloqueado
        });
    });
    
    // ===== CARD "ADICIONAR PROJETO" =====
    const addProjectCard = document.querySelector('.add-project');
    if (addProjectCard) {
        addProjectCard.addEventListener('click', function(e) {
            if (!e.target.closest('.btn')) {
                // Redirecionar para contato
                window.location.hash = '#contact';
                window.scrollTo({
                    top: document.getElementById('contact').offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // ===== PARCEIROS - PAUSAR ANIMAÇÃO NO HOVER =====
    const partnersSlider = document.querySelector('.partners-slider');
    if (partnersSlider) {
        const sliderTrack = partnersSlider.querySelector('.slider-track');
        
        partnersSlider.addEventListener('mouseenter', () => {
            if (sliderTrack) {
                sliderTrack.style.animationPlayState = 'paused';
            }
        });
        
        partnersSlider.addEventListener('mouseleave', () => {
            if (sliderTrack) {
                sliderTrack.style.animationPlayState = 'running';
            }
        });
    }
    
    // ===== SMOOTH SCROLL PARA ÂNCORAS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Ignorar links vazios ou externos
            if (href === '#' || href.includes('javascript')) return;
            
            const targetElement = document.querySelector(href);
            
            if (targetElement) {
                e.preventDefault();
                
                const offsetTop = targetElement.offsetTop - 80;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ===== PREVENIR CONTEXTO MENU EM IMAGENS PLACEHOLDER =====
    document.querySelectorAll('.image-placeholder, .project-placeholder').forEach(el => {
        el.addEventListener('contextmenu', (e) => e.preventDefault());
    });
    
    // ===== ANIMAÇÃO INICIAL =====
    // Animar elementos do hero
    const heroElements = document.querySelectorAll('.hero-badge, .hero-title, .hero-description, .hero-stats, .hero-actions');
    heroElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
    });
    
    // ===== PREVENIR COMPORTAMENTO PADRÃO DE FORMULÁRIOS =====
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            // Só prevenir se não for o formulário do WhatsApp
            if (this.id !== 'whatsapp-form') {
                e.preventDefault();
            }
        });
    });
});

// ===== DEBUG: Log para verificar se o script carregou =====
console.log('✅ Creative Codex - JavaScript carregado com sucesso!');
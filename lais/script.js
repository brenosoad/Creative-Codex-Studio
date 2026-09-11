// Espera o DOM carregar completamente
document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // UTILITÁRIOS E FUNÇÕES AUXILIARES
    // ============================================
    
    // Debounce para otimizar performance em eventos frequentes
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Throttle para limitar execução de funções
    function throttle(func, limit) {
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
    
    // Feature detection para reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // ============================================
    // 1. MENU MOBILE - ACESSÍVEL E OTIMIZADO
    // ============================================
    function initMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (!mobileToggle || !navMenu) return;
        
        // Adiciona atributos ARIA para acessibilidade
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.setAttribute('aria-label', 'Abrir menu de navegação');
        mobileToggle.setAttribute('aria-controls', navMenu.id || 'nav-menu');
        
        function toggleMenu() {
            const isActive = navMenu.classList.contains('active');
            
            // Alterna estado do menu
            navMenu.classList.toggle('active');
            mobileToggle.setAttribute('aria-expanded', !isActive);
            
            // Atualiza ícone
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                if (!isActive) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                    mobileToggle.setAttribute('aria-label', 'Fechar menu de navegação');
                    
                    // Trap de foco quando menu está aberto
                    trapFocusInMenu();
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                    mobileToggle.setAttribute('aria-label', 'Abrir menu de navegação');
                    
                    // Libera foco
                    releaseFocusTrap();
                }
            }
            
            // Previne scroll no body quando menu está aberto
            document.body.style.overflow = isActive ? '' : 'hidden';
        }
        
        // Fecha menu ao clicar fora
        function closeMenuOnClickOutside(event) {
            if (navMenu.classList.contains('active') && 
                !navMenu.contains(event.target) && 
                !mobileToggle.contains(event.target)) {
                toggleMenu();
            }
        }
        
        // Fecha menu com tecla Escape
        function closeMenuOnEscape(event) {
            if (event.key === 'Escape' && navMenu.classList.contains('active')) {
                toggleMenu();
                mobileToggle.focus();
            }
        }
        
        // Trap de foco dentro do menu
        function trapFocusInMenu() {
            const focusableElements = navMenu.querySelectorAll(
                'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length === 0) return;
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            function handleTabKey(e) {
                if (e.key !== 'Tab') return;
                
                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
            
            navMenu.addEventListener('keydown', handleTabKey);
            navMenu.dataset.trapHandler = 'true';
            
            // Foca no primeiro elemento
            setTimeout(() => firstElement.focus(), 100);
        }
        
        function releaseFocusTrap() {
            if (navMenu.dataset.trapHandler === 'true') {
                navMenu.removeEventListener('keydown', trapFocusInMenu);
                delete navMenu.dataset.trapHandler;
            }
        }
        
        // Fecha menu ao clicar em um link
        function setupNavLinks() {
            const navLinks = document.querySelectorAll('.nav-menu a');
            navLinks.forEach(link => {
                link.addEventListener('click', function() {
                    if (navMenu.classList.contains('active')) {
                        toggleMenu();
                    }
                });
            });
        }
        
        // Event listeners
        mobileToggle.addEventListener('click', toggleMenu);
        document.addEventListener('click', closeMenuOnClickOutside);
        document.addEventListener('keydown', closeMenuOnEscape);
        setupNavLinks();
        
        // Limpeza ao sair da página
        window.addEventListener('beforeunload', () => {
            document.removeEventListener('click', closeMenuOnClickOutside);
            document.removeEventListener('keydown', closeMenuOnEscape);
        });
    }
    
    // ============================================
    // 2. ANIMAÇÃO DE REVELAÇÃO AO SCROLL - OTIMIZADA
    // ============================================
    function initScrollReveal() {
        const fadeElements = document.querySelectorAll('.fade-in');
        if (fadeElements.length === 0) return;
        
        // Usar Intersection Observer para melhor performance
        if ('IntersectionObserver' in window) {
            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };
            
            const fadeObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        fadeObserver.unobserve(entry.target);
                    }
                });
            }, observerOptions);
            
            fadeElements.forEach(element => {
                fadeObserver.observe(element);
            });
        } else {
            // Fallback para browsers antigos
            function checkScroll() {
                fadeElements.forEach(element => {
                    if (!element.classList.contains('visible')) {
                        const elementTop = element.getBoundingClientRect().top;
                        const windowHeight = window.innerHeight;
                        
                        if (elementTop < windowHeight - 100) {
                            element.classList.add('visible');
                        }
                    }
                });
            }
            
            const throttledCheckScroll = throttle(checkScroll, 100);
            window.addEventListener('scroll', throttledCheckScroll);
            checkScroll(); // Verifica inicial
        }
    }
    
  // ============================================
// 3. CONTADORES ANIMADOS - VERSÃO CORRIGIDA ESPECÍFICA PARA SEUS VALORES
// ============================================
function initAnimatedCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length === 0) return;
    
    console.log('🎯 Encontrados', statNumbers.length, 'contadores para animar');
    
    // DEBUG: Mostra todos os valores
    statNumbers.forEach((stat, i) => {
        console.log(`Contador ${i}: "${stat.textContent}"`);
    });
    
    let hasAnimated = false;
    let animationInstances = [];
    
    // FUNÇÃO CORRIGIDA para parsear SEUS valores específicos
    function parseNumericValue(text) {
        if (!text || typeof text !== 'string') return null;
        
        const cleanText = text.trim();
        console.log('📊 Parseando:', cleanText);
        
        // Regex ESPECÍFICA para seus formatos:
        // +4,5K, +60K, +300K, 72,3%, +10K, +1K
        const match = cleanText.match(/^([+\-]?)([\d,]+(?:\.\d+)?)([Kk%]?)$/);
        
        if (!match) {
            console.warn('❌ Não foi possível parsear:', cleanText);
            return null;
        }
        
        const [, sign, numberStr, suffix] = match;
        console.log('✅ Match:', { sign, numberStr, suffix });
        
        // Converte para número
        let numericValue;
        if (numberStr.includes(',')) {
            // Formato brasileiro: vírgula como decimal
            const normalized = numberStr.replace(/\./g, '').replace(',', '.');
            numericValue = parseFloat(normalized);
        } else {
            numericValue = parseFloat(numberStr);
        }
        
        if (isNaN(numericValue)) {
            console.warn('❌ Valor numérico inválido:', numberStr);
            return null;
        }
        
        // Para valores com K, multiplica por 1000
        const finalValue = (suffix.toLowerCase() === 'k') ? numericValue * 1000 : numericValue;
        
        return {
            value: finalValue,
            sign: sign || '',
            suffix: suffix.toLowerCase(),
            hasComma: numberStr.includes(','),
            originalText: cleanText
        };
    }
    
    // Formatação específica para seus valores
    function formatNumber(value, format) {
        let formatted;
        
        if (format.suffix === 'k') {
            // Converte de volta para K
            let kValue = value / 1000;
            
            if (format.hasComma) {
                // Mantém uma casa decimal com vírgula (ex: 4,5K)
                formatted = kValue.toFixed(1).replace('.', ',') + 'K';
            } else {
                // Sem casa decimal (ex: 150K)
                formatted = Math.round(kValue) + 'K';
            }
        } else if (format.suffix === '%') {
            // Porcentagem com uma casa decimal
            formatted = value.toFixed(1).replace('.', ',') + '%';
        } else {
            // Número normal
            formatted = Math.round(value).toLocaleString('pt-BR');
        }
        
        // Adiciona sinal de + se existia
        if (format.sign === '+') {
            formatted = '+' + formatted;
        }
        
        return formatted;
    }
    
    // Animação simplificada e garantida
    function animateCounter(element, parsedValue) {
        return new Promise(resolve => {
            if (prefersReducedMotion) {
                element.textContent = parsedValue.originalText;
                resolve();
                return;
            }
            
            const duration = 1500;
            const start = 0;
            const end = parsedValue.value;
            const startTime = Date.now();
            
            function update() {
                const now = Date.now();
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing suave
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const current = start + (end - start) * easeProgress;
                
                element.textContent = formatNumber(current, parsedValue);
                
                if (progress < 1) {
                    animationInstances.push(requestAnimationFrame(update));
                } else {
                    // Garante valor final exato
                    element.textContent = formatNumber(end, parsedValue);
                    resolve();
                }
            }
            
            update();
        });
    }
    
    // Anima todos os contadores
    async function animateAllCounters() {
        console.log('🚀 Iniciando animação dos contadores');
        
        const promises = [];
        
        statNumbers.forEach((stat, index) => {
            const originalText = stat.textContent;
            const parsedValue = parseNumericValue(originalText);
            
            if (parsedValue) {
                console.log(`✅ ${index + 1}: "${originalText}" -> ${parsedValue.value}`);
                
                // Guarda original como fallback
                stat.dataset.original = originalText;
                
                promises.push(
                    new Promise(resolve => {
                        setTimeout(() => {
                            animateCounter(stat, parsedValue).then(resolve);
                        }, index * 200);
                    })
                );
            } else {
                console.warn(`⚠️ ${index + 1}: Não pôde ser parseado: "${originalText}"`);
                // Mantém o texto original
            }
        });
        
        await Promise.all(promises);
        console.log('✅ Todos os contadores animados!');
    }
    
    // FORÇA a animação - garante que funcione
    function forceAnimation() {
        if (!hasAnimated) {
            console.log('⚡ Forçando animação manualmente');
            hasAnimated = true;
            animateAllCounters();
        }
    }
    
    // Tenta com IntersectionObserver primeiro
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasAnimated) {
                    console.log('👀 Seção visível via Observer');
                    hasAnimated = true;
                    animateAllCounters();
                    observer.disconnect();
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '100px'
        });
        
        const statsSection = document.querySelector('.reach');
        if (statsSection) {
            observer.observe(statsSection);
            
            // Fallback: força após 3 segundos
            setTimeout(() => {
                if (!hasAnimated) forceAnimation();
            }, 3000);
        } else {
            // Se não encontrar a seção, força animação
            setTimeout(forceAnimation, 1000);
        }
    } else {
        // Fallback para browsers antigos
        console.log('⚠️ Usando fallback para animação');
        setTimeout(forceAnimation, 1000);
    }
    
    // Fallbacks adicionais
    window.addEventListener('scroll', function() {
        setTimeout(() => {
            if (!hasAnimated) {
                const section = document.querySelector('.reach');
                if (section) {
                    const rect = section.getBoundingClientRect();
                    if (rect.top < window.innerHeight - 100) {
                        forceAnimation();
                    }
                }
            }
        }, 500);
    }, { once: true });
    
    // Fallback final: força após 5 segundos
    setTimeout(() => {
        if (!hasAnimated) {
            console.log('⏱️ Fallback final: animando após timeout');
            animateAllCounters();
        }
    }, 5000);
}
    
    // ============================================
    // 4. CARROSSEL OTIMIZADO - SEM MEMORY LEAK
    // ============================================
    function initAutoCarousel() {
        const carouselContainer = document.querySelector('.brands-carousel-container');
        const carousel = document.querySelector('.brands-carousel');
        
        if (!carouselContainer || !carousel) return;
        
        // Respeita preferência de reduced motion
        if (prefersReducedMotion) {
            carouselContainer.style.overflowX = 'auto';
            carousel.style.animation = 'none';
            return;
        }
        
        let animationFrameId = null;
        let isPaused = false;
        let speed = 25; // pixels por segundo
        let position = 0;
        let originalItems = [];
        let clones = [];
        
        // Inicializa itens
        function initializeItems() {
            // Limpa clones anteriores
            cleanupClones();
            
            // Coleta itens originais
            originalItems = Array.from(carousel.querySelectorAll('.brand-logo-item:not(.clone)'));
            if (originalItems.length === 0) return;
            
            // Calcula largura total
            const firstItem = originalItems[0];
            const itemWidth = firstItem.offsetWidth;
            const itemMargin = parseInt(window.getComputedStyle(firstItem).marginRight) || 30;
            const itemTotalWidth = itemWidth + itemMargin;
            const totalWidth = itemTotalWidth * originalItems.length;
            
            // Cria clones para efeito infinito
            clones = originalItems.map(item => {
                const clone = item.cloneNode(true);
                clone.classList.add('clone');
                clone.setAttribute('aria-hidden', 'true');
                carousel.appendChild(clone);
                return clone;
            });
            
            // Ajusta velocidade baseada na largura
            adjustSpeedForScreen(totalWidth);
            
            // Inicia animação
            startAnimation();
            
            // Configura controles de pausa
            setupPauseControls();
        }
        
        // Ajusta velocidade baseada na tela
        function adjustSpeedForScreen(totalWidth) {
            if (window.innerWidth < 768) {
                speed = totalWidth / 30; // Mais lento em mobile
            } else {
                speed = totalWidth / 20; // Velocidade proporcional ao conteúdo
            }
        }
        
        // Animação principal
        function startAnimation() {
            if (originalItems.length === 0 || isPaused) return;
            
            const firstItem = originalItems[0];
            const itemWidth = firstItem.offsetWidth;
            const itemMargin = parseInt(window.getComputedStyle(firstItem).marginRight) || 30;
            const itemTotalWidth = itemWidth + itemMargin;
            const totalOriginalWidth = itemTotalWidth * originalItems.length;
            
            function animate() {
                if (!isPaused) {
                    position -= speed / 60; // Ajuste para 60fps
                    
                    // Reinicia posição quando necessário
                    if (Math.abs(position) >= totalOriginalWidth) {
                        position = 0;
                    }
                    
                    carousel.style.transform = `translateX(${position}px)`;
                }
                
                if (!isPaused) {
                    animationFrameId = requestAnimationFrame(animate);
                }
            }
            
            // Cancela animação anterior se existir
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            
            animationFrameId = requestAnimationFrame(animate);
        }
        
        // Configura controles de pausa
        function setupPauseControls() {
            // Pausa ao interagir
            carouselContainer.addEventListener('mouseenter', () => {
                isPaused = true;
                carouselContainer.style.cursor = 'grab';
            });
            
            carouselContainer.addEventListener('mouseleave', () => {
                isPaused = false;
                carouselContainer.style.cursor = 'default';
                startAnimation();
            });
            
            // Touch events para mobile
            let touchStartX = 0;
            let touchStartTime = 0;
            
            carouselContainer.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartTime = Date.now();
                isPaused = true;
            }, { passive: true });
            
            carouselContainer.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndTime = Date.now();
                const swipeDistance = touchStartX - touchEndX;
                const swipeTime = touchEndTime - touchStartTime;
                
                // Detecta swipe rápido
                if (Math.abs(swipeDistance) > 50 && swipeTime < 300) {
                    // Ajusta posição baseada no swipe
                    position += swipeDistance * 2;
                }
                
                setTimeout(() => {
                    isPaused = false;
                    startAnimation();
                }, 500);
            }, { passive: true });
        }
        
        // Limpa clones
        function cleanupClones() {
            clones.forEach(clone => {
                if (clone.parentNode === carousel) {
                    carousel.removeChild(clone);
                }
            });
            clones = [];
        }
        
        // Reinitializa ao redimensionar
        const handleResize = debounce(() => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            initializeItems();
        }, 250);
        
        // Observador de mutação para detectar mudanças no DOM
        const observer = new MutationObserver((mutations) => {
            const itemsChanged = mutations.some(mutation => 
                mutation.type === 'childList' && 
                Array.from(mutation.addedNodes).some(node => 
                    node.classList && node.classList.contains('brand-logo-item')
                )
            );
            
            if (itemsChanged) {
                handleResize();
            }
        });
        
        // Inicialização
        initializeItems();
        
        // Event listeners
        window.addEventListener('resize', handleResize);
        observer.observe(carousel, { childList: true });
        
        // Limpeza
        function cleanupCarousel() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            cleanupClones();
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        }
        
        window.addEventListener('beforeunload', cleanupCarousel);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                isPaused = true;
            } else {
                isPaused = false;
                startAnimation();
            }
        });
    }
    
    // ============================================
    // 5. SLIDER DE DEPOIMENTOS - MELHORADO
    // ============================================
    function initTestimonialsSlider() {
        const slider = document.querySelector('.testimonial-slider');
        const testimonials = document.querySelectorAll('.testimonial');
        const dots = document.querySelectorAll('.dot');
        const prevBtn = document.querySelector('.testimonial-prev');
        const nextBtn = document.querySelector('.testimonial-next');
        
        if (!slider || testimonials.length === 0) return;
        
        let currentIndex = 0;
        let autoSlideInterval = null;
        let isTransitioning = false;
        const totalSlides = testimonials.length;
        
        // Adiciona atributos ARIA
        slider.setAttribute('role', 'region');
        slider.setAttribute('aria-label', 'Depoimentos de clientes');
        
        testimonials.forEach((testimonial, index) => {
            testimonial.setAttribute('aria-hidden', index !== 0 ? 'true' : 'false');
            testimonial.setAttribute('aria-live', 'polite');
        });
        
        dots.forEach(dot => {
            dot.setAttribute('role', 'tab');
            dot.setAttribute('tabindex', '0');
        });
        
        // Mostra slide específico
        function showSlide(index, direction = 'next') {
            if (isTransitioning || index === currentIndex) return;
            
            isTransitioning = true;
            
            // Atualiza índices
            const prevIndex = currentIndex;
            currentIndex = (index + totalSlides) % totalSlides;
            
            // Remove classes ativas
            testimonials.forEach(slide => slide.classList.remove('active', 'prev', 'next'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            // Adiciona classes para transição
            testimonials[prevIndex].classList.add('prev');
            testimonials[currentIndex].classList.add('active', direction);
            
            // Atualiza dots
            dots[currentIndex].classList.add('active');
            
            // Atualiza ARIA
            testimonials[prevIndex].setAttribute('aria-hidden', 'true');
            testimonials[currentIndex].setAttribute('aria-hidden', 'false');
            
            dots[prevIndex].setAttribute('aria-selected', 'false');
            dots[currentIndex].setAttribute('aria-selected', 'true');
            
            // Reseta transição
            setTimeout(() => {
                testimonials[prevIndex].classList.remove('prev', direction);
                testimonials[currentIndex].classList.remove('next', 'prev');
                isTransitioning = false;
            }, 500);
            
            // Reinicia auto-slide
            restartAutoSlide();
        }
        
        // Próximo slide
        function nextSlide() {
            showSlide(currentIndex + 1, 'next');
        }
        
        // Slide anterior
        function prevSlide() {
            showSlide(currentIndex - 1, 'prev');
        }
        
        // Configura auto-slide
        function setupAutoSlide() {
            if (prefersReducedMotion) return;
            
            clearInterval(autoSlideInterval);
            autoSlideInterval = setInterval(nextSlide, 5000);
        }
        
        function restartAutoSlide() {
            clearInterval(autoSlideInterval);
            if (!prefersReducedMotion) {
                autoSlideInterval = setInterval(nextSlide, 5000);
            }
        }
        
        // Event listeners para dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => showSlide(index));
            dot.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    showSlide(index);
                }
            });
        });
        
        // Event listeners para botões de navegação
        if (prevBtn) {
            prevBtn.addEventListener('click', prevSlide);
            prevBtn.setAttribute('aria-label', 'Depoimento anterior');
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', nextSlide);
            nextBtn.setAttribute('aria-label', 'Próximo depoimento');
        }
        
        // Suporte a teclado
        slider.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    prevSlide();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    nextSlide();
                    break;
                case 'Home':
                    e.preventDefault();
                    showSlide(0);
                    break;
                case 'End':
                    e.preventDefault();
                    showSlide(totalSlides - 1);
                    break;
            }
        });
        
        // Pausa no hover
        slider.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
        slider.addEventListener('mouseleave', setupAutoSlide);
        
        // Suporte a swipe em touch devices
        let touchStartX = 0;
        let touchEndX = 0;
        
        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            clearInterval(autoSlideInterval);
        }, { passive: true });
        
        slider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
            setupAutoSlide();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
        }
        
        // Inicialização
        setupAutoSlide();
        testimonials[0].classList.add('active');
        dots[0].classList.add('active');
        dots[0].setAttribute('aria-selected', 'true');
        
        // Limpeza
        function cleanupSlider() {
            clearInterval(autoSlideInterval);
            slider.removeEventListener('mouseenter', () => clearInterval(autoSlideInterval));
            slider.removeEventListener('mouseleave', setupAutoSlide);
        }
        
        window.addEventListener('beforeunload', cleanupSlider);
    }
    
    // ============================================
    // 6. BOTÕES DO WHATSAPP - OTIMIZADOS
    // ============================================
    function initWhatsAppButtons() {
        const whatsappBtns = document.querySelectorAll('.whatsapp-btn, .whatsapp-full-btn, .floating-btn');
        if (whatsappBtns.length === 0) return;
        
        whatsappBtns.forEach(btn => {
            // Adiciona atributos ARIA
            btn.setAttribute('aria-label', 'Conversar no WhatsApp');
            
            // Efeito de pulso periódico (apenas se não for reduced motion)
            if (!prefersReducedMotion) {
                let pulseInterval = setInterval(() => {
                    btn.style.transform = 'scale(1.05)';
                    btn.style.transition = 'transform 0.3s ease';
                    
                    setTimeout(() => {
                        btn.style.transform = 'scale(1)';
                    }, 300);
                }, 8000);
                
                // Limpa intervalo quando necessário
                btn.dataset.pulseInterval = pulseInterval;
            }
        });
        
        // Tracking de clicks (opcional para analytics)
        document.addEventListener('click', function(e) {
            const whatsappBtn = e.target.closest('.whatsapp-btn, .whatsapp-full-btn, .floating-btn');
            if (whatsappBtn) {
                console.log('📱 Click no WhatsApp:', whatsappBtn.href || whatsappBtn.dataset.href);
                // Aqui você pode adicionar Google Analytics, Facebook Pixel, etc.
            }
        });
    }
    
    // ============================================
    // 7. SCROLL SUAVE - MELHORADO
    // ============================================
    function initSmoothScroll() {
        // Seleciona apenas links internos que existem na página
        document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    
                    // Calcula posição considerando header fixo
                    const headerHeight = document.querySelector('header')?.offsetHeight || 80;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    
                    // Scroll suave
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Foca no elemento para acessibilidade
                    setTimeout(() => {
                        targetElement.setAttribute('tabindex', '-1');
                        targetElement.focus();
                        targetElement.removeAttribute('tabindex');
                    }, 1000);
                }
            });
        });
    }
    
    // ============================================
    // 8. HEADER DINÂMICO - PERFORMÁTICO
    // ============================================
    function initDynamicHeader() {
        const header = document.querySelector('header');
        if (!header) return;
        
        let lastScrollY = window.scrollY;
        let ticking = false;
        
        function updateHeader() {
            const scrollY = window.scrollY;
            
            if (scrollY > 100) {
                header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
                header.style.backdropFilter = 'blur(10px)';
                header.style.boxShadow = '0 5px 20px rgba(233, 30, 99, 0.15)';
                header.style.padding = '15px 0';
                header.classList.add('scrolled');
            } else {
                header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
                header.style.backdropFilter = 'blur(5px)';
                header.style.boxShadow = '0 2px 20px rgba(233, 30, 99, 0.1)';
                header.style.padding = '20px 0';
                header.classList.remove('scrolled');
            }
            
            lastScrollY = scrollY;
            ticking = false;
        }
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateHeader);
                ticking = true;
            }
        }, { passive: true });
        
        // Atualiza inicialmente
        updateHeader();
    }
    
    // ============================================
    // 9. BOTÃO FLUTUANTE DO WHATSAPP
    // ============================================
    function initFloatingButton() {
        const floatingBtn = document.querySelector('.floating-btn');
        if (!floatingBtn) return;
        
        // Adiciona atributos ARIA
        floatingBtn.setAttribute('aria-label', 'Conversar no WhatsApp');
        floatingBtn.setAttribute('role', 'button');
        
        // Mostra/Esconde baseado no scroll
        let lastScrollTop = 0;
        const scrollHandler = throttle(() => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Esconde quando scroll para baixo, mostra quando scroll para cima
            if (scrollTop > lastScrollTop && scrollTop > 300) {
                floatingBtn.style.transform = 'translateY(100px)';
            } else {
                floatingBtn.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        }, 200);
        
        window.addEventListener('scroll', scrollHandler, { passive: true });
        
        // Efeito de pulso (apenas se não for reduced motion)
        if (!prefersReducedMotion) {
            setInterval(() => {
                floatingBtn.classList.add('pulsing');
                setTimeout(() => floatingBtn.classList.remove('pulsing'), 600);
            }, 8000);
        }
    }
    
    // ============================================
    // 11. ERROR BOUNDARY E LOGGING
    // ============================================
    function initErrorHandling() {
        // Captura erros globais
        window.addEventListener('error', function(e) {
            console.error('❌ Erro capturado:', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                error: e.error
            });
            
            // Aqui você poderia enviar para um serviço de logging
            // Ex: Sentry, Google Analytics, etc.
            
            return true;
        });
        
        // Captura promises não tratadas
        window.addEventListener('unhandledrejection', function(e) {
            console.error('❌ Promise rejeitada não tratada:', e.reason);
            e.preventDefault();
        });
    }
    
    // ============================================
    // 12. INICIALIZAÇÃO CONTROLADA
    // ============================================
    function initAllComponents() {
        try {
            console.time('⏱️ Tempo de inicialização');
            
            // Inicializa componentes na ordem de prioridade
            initErrorHandling();
            initMobileMenu();
            initDynamicHeader();
            initScrollReveal();
            initSmoothScroll();
            initAnimatedCounters();
            initAutoCarousel();
            initTestimonialsSlider();
            initWhatsAppButtons();
            initFloatingButton();
            
            // Log de sucesso
            console.timeEnd('⏱️ Tempo de inicialização');
            console.log('✅ Mídia Kit - Todos os componentes inicializados com sucesso!');
            
            // Dispatch event para outros scripts
            document.dispatchEvent(new CustomEvent('siteInitialized'));
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            
            // Fallback: Garante que elementos básicos funcionem
            document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
        }
    }
    
    // ============================================
    // 13. PERFORMANCE MONITORING
    // ============================================
    function initPerformanceMonitoring() {
        // Monitora FPS
        let lastTime = performance.now();
        let frames = 0;
        
        function measureFPS() {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frames * 1000) / (currentTime - lastTime));
                
                if (fps < 30) {
                    console.warn(`⚠️ FPS baixo: ${fps} - Considere otimizar animações`);
                }
                
                frames = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        }
        
        // Inicia monitoramento apenas em dev ou se flag ativa
        if (window.location.hostname === 'localhost' || localStorage.getItem('debugFPS')) {
            requestAnimationFrame(measureFPS);
        }
        
        // Monitora memory (disponível apenas em Chrome)
        if (performance.memory) {
            setInterval(() => {
                const usedMB = performance.memory.usedJSHeapSize / 1048576;
                const totalMB = performance.memory.totalJSHeapSize / 1048576;
                
                if (usedMB > 100) { // Alerta se usar mais de 100MB
                    console.warn(`⚠️ Uso de memória alto: ${usedMB.toFixed(2)}MB de ${totalMB.toFixed(2)}MB`);
                }
            }, 30000);
        }
    }
    
    // ============================================
    // INICIALIZAÇÃO PRINCIPAL
    // ============================================
    
    // Aguarda load para imagens e fonts
    if (document.readyState === 'complete') {
        setTimeout(initAllComponents, 100);
    } else {
        window.addEventListener('load', () => {
            setTimeout(initAllComponents, 100);
        });
    }
    
    // Inicializa monitoramento de performance (apenas em ambiente de desenvolvimento)
    if (!prefersReducedMotion && window.location.hostname === 'localhost') {
        initPerformanceMonitoring();
    }
    
    // ============================================
    // 14. CLEANUP ON UNLOAD
    // ============================================
    window.addEventListener('beforeunload', function() {
        // Limpa todos os intervals e timeouts
        const highestTimeoutId = setTimeout(() => {}, 0);
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
        }
        
        // Limpa todos os animation frames
        const highestFrameId = requestAnimationFrame(() => {});
        for (let i = 0; i <= highestFrameId; i++) {
            cancelAnimationFrame(i);
        }
        
        console.log('🧹 Limpeza realizada antes de sair da página');
    });
});

// ============================================
// CSS ADICIONAL RECOMENDADO (adicionar ao CSS existente)
// ============================================
/*
.floating-btn {
    transition: transform 0.3s ease;
}

.floating-btn.pulsing {
    animation: pulse 0.6s ease;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

.testimonial {
    transition: opacity 0.5s ease, transform 0.5s ease;
}

.testimonial.prev {
    transform: translateX(-100%);
    opacity: 0;
}

.testimonial.next {
    transform: translateX(100%);
    opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
*/

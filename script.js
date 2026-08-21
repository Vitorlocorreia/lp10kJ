// ========================================================
// MÉTODO PQP — SCRIPT INTERATIVO (COM REPASSE AUTOMÁTICO DE UTMS)
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
  
  // ========================================================
  // 0. REPASSE AUTOMÁTICO DE PARÂMETROS UTM PARA O CHECKOUT KIRVANO
  // ========================================================
  function initUtmPassThrough() {
    const kirvanoBaseCheckoutUrl = 'https://pay.kirvano.com/047c7665-a1d3-4a59-91e5-7eea15fe704d';
    const currentParams = new URLSearchParams(window.location.search);
    
    // Lista de chaves de rastreamento comuns
    const trackingKeys = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'src',
      'sck'
    ];

    // 1. Coleta todos os parâmetros da URL atual dinamicamente
    let activeParams = {};
    currentParams.forEach((value, key) => {
      if (value && value.trim() !== '') {
        activeParams[key] = value;
      }
    });

    // 2. Se encontrou parâmetros na URL, salva no sessionStorage e localStorage
    if (Object.keys(activeParams).length > 0) {
      try {
        sessionStorage.setItem('pqp_utms', JSON.stringify(activeParams));
        localStorage.setItem('pqp_utms', JSON.stringify(activeParams));
      } catch (e) {
        console.warn('Storage indisponível para UTMs', e);
      }
    } else {
      // Caso não tenha na URL, recupera da sessão ou do armazenamento local
      try {
        const saved = sessionStorage.getItem('pqp_utms') || localStorage.getItem('pqp_utms');
        if (saved) {
          activeParams = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Erro ao ler UTMs salvas', e);
      }
    }

    // 3. Atualiza todos os links que apontam para a Kirvano
    const checkoutLinks = document.querySelectorAll('a[href*="pay.kirvano.com"], .kirvano-checkout-link');

    checkoutLinks.forEach(link => {
      let targetUrl = link.getAttribute('href');
      
      // Se o link for apenas âncora ou vazio, usa a URL base da Kirvano
      if (!targetUrl || targetUrl === '#' || !targetUrl.includes('pay.kirvano.com')) {
        targetUrl = kirvanoBaseCheckoutUrl;
      }

      try {
        const urlObj = new URL(targetUrl, window.location.origin);
        
        // Injeta todos os parâmetros de rastreamento ativos
        Object.keys(activeParams).forEach(key => {
          if (activeParams[key]) {
            urlObj.searchParams.set(key, activeParams[key]);
          }
        });

        link.setAttribute('href', urlObj.toString());
      } catch (err) {
        console.error('Erro ao repassar UTM para o link:', link, err);
      }
    });
  }

  // Executa o repasse de UTM imediatamente
  initUtmPassThrough();


  // ========================================================
  // 1. CARROSSEL DE PROVAS REAIS
  // ========================================================
  const carouselTrack = document.getElementById('carouselTrack');
  const carouselWindow = document.getElementById('carouselWindow');
  const prevBtn = document.getElementById('prevProofBtn');
  const nextBtn = document.getElementById('nextProofBtn');
  const dots = document.querySelectorAll('.carousel-dot');
  const slides = document.querySelectorAll('.proof-slide');
  
  let currentIndex = 0;
  const totalSlides = slides.length;
  let autoPlayTimer = null;

  function updateCarousel(index) {
    if (index < 0) {
      currentIndex = totalSlides - 1;
    } else if (index >= totalSlides) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }

    // Slide track
    if (carouselTrack) {
      carouselTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    // Update active slide class
    slides.forEach((slide, i) => {
      if (i === currentIndex) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    // Update dots
    dots.forEach((dot, i) => {
      if (i === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // Next / Prev button events
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      updateCarousel(currentIndex - 1);
      resetAutoPlay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      updateCarousel(currentIndex + 1);
      resetAutoPlay();
    });
  }

  // Dot click events
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-index'), 10);
      updateCarousel(idx);
      resetAutoPlay();
    });
  });

  // Touch Swipe Gesture for Mobile
  let startX = 0;
  let currentX = 0;
  let isDragging = false;

  if (carouselWindow) {
    carouselWindow.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      stopAutoPlay();
    }, { passive: true });

    carouselWindow.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
    }, { passive: true });

    carouselWindow.addEventListener('touchend', () => {
      if (!isDragging) return;
      const diffX = startX - currentX;
      const threshold = 40; // minimum swipe distance

      if (Math.abs(diffX) > threshold && currentX !== 0) {
        if (diffX > 0) {
          // Swiped left -> Next slide
          updateCarousel(currentIndex + 1);
        } else {
          // Swiped right -> Previous slide
          updateCarousel(currentIndex - 1);
        }
      }
      isDragging = false;
      startX = 0;
      currentX = 0;
      resetAutoPlay();
    });

    // Mouse drag support for desktop
    carouselWindow.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      isDragging = true;
      stopAutoPlay();
    });

    carouselWindow.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      currentX = e.clientX;
    });

    carouselWindow.addEventListener('mouseup', () => {
      if (!isDragging) return;
      const diffX = startX - currentX;
      const threshold = 40;

      if (Math.abs(diffX) > threshold && currentX !== 0) {
        if (diffX > 0) {
          updateCarousel(currentIndex + 1);
        } else {
          updateCarousel(currentIndex - 1);
        }
      }
      isDragging = false;
      startX = 0;
      currentX = 0;
      resetAutoPlay();
    });

    carouselWindow.addEventListener('mouseleave', () => {
      if (isDragging) {
        isDragging = false;
        resetAutoPlay();
      }
    });
  }

  // Auto-play timer
  function startAutoPlay() {
    autoPlayTimer = setInterval(() => {
      updateCarousel(currentIndex + 1);
    }, 5500);
  }

  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  }

  function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }

  startAutoPlay();


  // ========================================================
  // 2. FAQ ACCORDION
  // ========================================================
  const faqCards = document.querySelectorAll('.faq-accordion-card');

  faqCards.forEach((card) => {
    const head = card.querySelector('.faq-accordion-head');
    head.addEventListener('click', () => {
      const isOpen = card.classList.contains('active');
      
      faqCards.forEach((other) => {
        if (other !== card) {
          other.classList.remove('active');
        }
      });

      if (isOpen) {
        card.classList.remove('active');
      } else {
        card.classList.add('active');
      }
    });
  });


  // ========================================================
  // 3. SMOOTH SCROLLING FOR ANCHOR LINKS (EXCETO LINKS EXTERNOS)
  // ========================================================
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          const navOffset = 60;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });


  // ========================================================
  // 5. SUBTLE REVEAL ON SCROLL
  // ========================================================
  const revealElements = document.querySelectorAll(
    '.belief-item-card, .method-step-box, .proofs-carousel-container, .creator-container-box, .feature-card, .bonus-single-card, .offer-grand-card, .guarantee-detailed-card'
  );
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -20px 0px'
    });

    revealElements.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      observer.observe(el);
    });
  }

  // ========================================================
  // 6. FLOATING MOBILE CTA BAR VISIBILITY
  // ========================================================
  const floatingCta = document.getElementById('floatingCta');
  if (floatingCta) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 420) {
        floatingCta.classList.add('visible');
      } else {
        floatingCta.classList.remove('visible');
      }
    }, { passive: true });
  }

});



function initMagicBento() {
  const section = document.querySelector('.bento-section');
  if (!section) return;

  const cards = document.querySelectorAll('.magic-bento-card');
  const isMobile = window.innerWidth <= 768;
  const disableAnimations = isMobile;
  const spotlightRadius = 400;
  
  // Spotlight
  let spotlight = null;
  if (!disableAnimations) {
    spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    document.body.appendChild(spotlight);
  }

  const updateSpotlight = (e) => {
    if (disableAnimations || !spotlight) return;
    
    const rect = section.getBoundingClientRect();
    const mouseInside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

    if (!mouseInside) {
      gsap.to(spotlight, { opacity: 0, duration: 0.3, ease: 'power2.out' });
      cards.forEach(card => card.style.setProperty('--glow-intensity', '0'));
      return;
    }

    gsap.to(spotlight, {
      left: e.clientX,
      top: e.clientY,
      duration: 0.1,
      ease: 'power2.out'
    });

    let minDistance = Infinity;
    const proximity = spotlightRadius * 0.5;
    const fadeDistance = spotlightRadius * 0.75;

    cards.forEach(card => {
      const cardRect = card.getBoundingClientRect();
      const centerX = cardRect.left + cardRect.width / 2;
      const centerY = cardRect.top + cardRect.height / 2;
      const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
      const effectiveDistance = Math.max(0, distance);
      
      minDistance = Math.min(minDistance, effectiveDistance);

      let glowIntensity = 0;
      if (effectiveDistance <= proximity) {
        glowIntensity = 1;
      } else if (effectiveDistance <= fadeDistance) {
        glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
      }

      // Update card glow
      const relativeX = ((e.clientX - cardRect.left) / cardRect.width) * 100;
      const relativeY = ((e.clientY - cardRect.top) / cardRect.height) * 100;
      card.style.setProperty('--glow-x', `${relativeX}%`);
      card.style.setProperty('--glow-y', `${relativeY}%`);
      card.style.setProperty('--glow-intensity', glowIntensity.toString());
      card.style.setProperty('--glow-radius', `${spotlightRadius}px`);
    });

    const targetOpacity = minDistance <= proximity ? 0.8 : minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8 : 0;
    gsap.to(spotlight, { opacity: targetOpacity, duration: targetOpacity > 0 ? 0.2 : 0.5, ease: 'power2.out' });
  };

  if (!disableAnimations) {
    document.addEventListener('mousemove', updateSpotlight);
    document.addEventListener('mouseleave', () => {
      if(spotlight) gsap.to(spotlight, { opacity: 0, duration: 0.3 });
      cards.forEach(c => c.style.setProperty('--glow-intensity', '0'));
    });
  }

  // Card interactions
  cards.forEach(card => {
    let particleInterval = null;
    let particles = [];
    const container = card.querySelector('.particle-container') || card;

    const createParticle = () => {
      const el = document.createElement('div');
      el.className = 'particle';
      const w = card.clientWidth;
      const h = card.clientHeight;
      el.style.left = `${Math.random() * w}px`;
      el.style.top = `${Math.random() * h}px`;
      container.appendChild(el);
      particles.push(el);

      gsap.fromTo(el, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
      gsap.to(el, {
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
        rotation: Math.random() * 360,
        duration: 2 + Math.random() * 2,
        ease: 'none',
        repeat: -1,
        yoyo: true
      });
      gsap.to(el, { opacity: 0.3, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true });
    };

    const clearParticles = () => {
      clearInterval(particleInterval);
      particles.forEach(p => {
        gsap.to(p, { scale: 0, opacity: 0, duration: 0.3, onComplete: () => p.remove() });
      });
      particles = [];
    };

    card.addEventListener('mouseenter', () => {
      if (disableAnimations) return;
      gsap.to(card, { rotateX: 5, rotateY: 5, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 });
      for(let i=0; i<8; i++) setTimeout(createParticle, i*100);
    });

    card.addEventListener('mouseleave', () => {
      if (disableAnimations) return;
      gsap.to(card, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
      clearParticles();
    });

    card.addEventListener('mousemove', (e) => {
      if (disableAnimations) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      const rotateX = ((y - cy) / cy) * -8;
      const rotateY = ((x - cx) / cx) * 8;
      gsap.to(card, { rotateX, rotateY, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 });
      
      const mx = (x - cx) * 0.05;
      const my = (y - cy) * 0.05;
      gsap.to(card, { x: mx, y: my, duration: 0.3, ease: 'power2.out' });
    });

    card.addEventListener('click', (e) => {
      if (disableAnimations) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const maxDist = Math.max(Math.hypot(x,y), Math.hypot(x-rect.width,y), Math.hypot(x,y-rect.height), Math.hypot(x-rect.width,y-rect.height));

      const ripple = document.createElement('div');
      ripple.style.cssText = `position: absolute; width: ${maxDist*2}px; height: ${maxDist*2}px; border-radius: 50%; background: radial-gradient(circle, rgba(132,0,255,0.4) 0%, rgba(132,0,255,0.2) 30%, transparent 70%); left: ${x-maxDist}px; top: ${y-maxDist}px; pointer-events: none; z-index: 1000;`;
      card.appendChild(ripple);
      
      gsap.fromTo(ripple, {scale: 0, opacity: 1}, {scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove()});
    });
  });
}

document.addEventListener("DOMContentLoaded", initMagicBento);

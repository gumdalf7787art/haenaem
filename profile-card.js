// profile-card.js
function initProfileCard(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const props = Object.assign({
    avatarUrl: 'about.png',
    iconUrl: '',
    grainUrl: '',
    innerGradient: 'linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)',
    behindGlowEnabled: true,
    behindGlowColor: 'rgba(125, 190, 255, 0.67)',
    behindGlowSize: '50%',
    enableTilt: true,
    enableMobileTilt: false,
    mobileTiltSensitivity: 5,
    miniAvatarUrl: 'about.png',
    name: '해냄 대표',
    title: '해냄 기공소 대표 치기공사',
    handle: 'haenaem',
    status: '대표 치기공사',
    contactText: '의뢰하기',
    showUserInfo: true,
  }, options);

  // Generate HTML structure
  let html = `
    <div class="pc-card-wrapper" style="
      --icon: ${props.iconUrl ? `url('${props.iconUrl}')` : 'none'};
      --grain: ${props.grainUrl ? `url('${props.grainUrl}')` : 'none'};
      --inner-gradient: ${props.innerGradient};
      --behind-glow-color: ${props.behindGlowColor};
      --behind-glow-size: ${props.behindGlowSize};
    ">`;

  if (props.behindGlowEnabled) {
    html += `<div class="pc-behind"></div>`;
  }

  html += `
      <div class="pc-card-shell">
        <section class="pc-card">
          <div class="pc-inside">
            <div class="pc-shine"></div>
            <div class="pc-glare"></div>
            <div class="pc-content pc-avatar-content">
              <img class="avatar" src="${props.avatarUrl}" alt="${props.name} avatar" loading="lazy">
  `;

  if (props.showUserInfo) {
    html += `
              <div class="pc-user-info">
                <div class="pc-user-details">
                  <div class="pc-mini-avatar">
                    <img src="${props.miniAvatarUrl}" alt="${props.name} mini avatar" loading="lazy">
                  </div>
                  <div class="pc-user-text">
                    <div class="pc-handle">@${props.handle}</div>
                    <div class="pc-status">${props.status}</div>
                  </div>
                </div>
                <button class="pc-contact-btn" style="pointer-events: auto;">${props.contactText}</button>
              </div>
    `;
  }

  html += `
            </div>
            <div class="pc-content">
            </div>
          </div>
        </section>
      </div>
    </div>
  `;

  container.innerHTML = html;

  const wrap = container.querySelector('.pc-card-wrapper');
  const shell = container.querySelector('.pc-card-shell');
  
  if (!wrap || !shell) return;

  const ANIMATION_CONFIG = {
    INITIAL_DURATION: 1200,
    INITIAL_X_OFFSET: 70,
    INITIAL_Y_OFFSET: 60,
    DEVICE_BETA_OFFSET: 20,
    ENTER_TRANSITION_MS: 180
  };

  const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
  const round = (v, precision = 3) => parseFloat(v.toFixed(precision));
  const adjust = (v, fMin, fMax, tMin, tMax) => round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

  let rafId = null;
  let running = false;
  let lastTs = 0;
  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  const DEFAULT_TAU = 0.14;
  const INITIAL_TAU = 0.6;
  let initialUntil = 0;
  let enterTimer = null;
  let leaveRaf = null;

  const setVarsFromXY = (x, y) => {
    const width = shell.clientWidth || 1;
    const height = shell.clientHeight || 1;

    const percentX = clamp((100 / width) * x);
    const percentY = clamp((100 / height) * y);

    const centerX = percentX - 50;
    const centerY = percentY - 50;

    wrap.style.setProperty('--pointer-x', `${percentX}%`);
    wrap.style.setProperty('--pointer-y', `${percentY}%`);
    wrap.style.setProperty('--background-x', `${adjust(percentX, 0, 100, 35, 65)}%`);
    wrap.style.setProperty('--background-y', `${adjust(percentY, 0, 100, 35, 65)}%`);
    wrap.style.setProperty('--pointer-from-center', `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`);
    wrap.style.setProperty('--pointer-from-top', `${percentY / 100}`);
    wrap.style.setProperty('--pointer-from-left', `${percentX / 100}`);
    wrap.style.setProperty('--rotate-x', `${round(-(centerX / 15))}deg`);
    wrap.style.setProperty('--rotate-y', `${round(centerY / 15)}deg`);
  };

  const step = (ts) => {
    if (!running) return;
    if (lastTs === 0) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
    const k = 1 - Math.exp(-dt / tau);

    currentX += (targetX - currentX) * k;
    currentY += (targetY - currentY) * k;

    setVarsFromXY(currentX, currentY);

    const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;

    if (stillFar || document.hasFocus()) {
      rafId = requestAnimationFrame(step);
    } else {
      running = false;
      lastTs = 0;
      rafId = null;
    }
  };

  const start = () => {
    if (running) return;
    running = true;
    lastTs = 0;
    rafId = requestAnimationFrame(step);
  };

  const setTarget = (x, y) => {
    targetX = x;
    targetY = y;
    start();
  };

  const getOffsets = (evt) => {
    const rect = shell.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  };

  shell.addEventListener('pointermove', (e) => {
    if (!props.enableTilt) return;
    const { x, y } = getOffsets(e);
    setTarget(x, y);
  });

  shell.addEventListener('pointerenter', (e) => {
    if (!props.enableTilt) return;
    shell.classList.add('active', 'entering');
    if (enterTimer) clearTimeout(enterTimer);
    enterTimer = setTimeout(() => shell.classList.remove('entering'), ANIMATION_CONFIG.ENTER_TRANSITION_MS);
    const { x, y } = getOffsets(e);
    setTarget(x, y);
  });

  shell.addEventListener('pointerleave', () => {
    if (!props.enableTilt) return;
    setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
    
    const checkSettle = () => {
      const settled = Math.hypot(targetX - currentX, targetY - currentY) < 0.6;
      if (settled) {
        shell.classList.remove('active');
        leaveRaf = null;
      } else {
        leaveRaf = requestAnimationFrame(checkSettle);
      }
    };
    if (leaveRaf) cancelAnimationFrame(leaveRaf);
    leaveRaf = requestAnimationFrame(checkSettle);
  });
  
  // Set initial state
  if (props.enableTilt) {
    currentX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    currentY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    setVarsFromXY(currentX, currentY);
    setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
    initialUntil = performance.now() + ANIMATION_CONFIG.INITIAL_DURATION;
    start();
  }
}

/**
 * Aagan Sewa — index.js
 * Handles: navbar scroll behaviour, service card interactions,
 * stat counter animation, scroll-reveal, and emergency strip.
 */

/* ─────────────────────────────────────────
   1. NAVBAR — shrink + shadow on scroll
   ───────────────────────────────────────── */
(function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  function onScroll() {
    if (window.scrollY > 40) {
      navbar.style.height = '58px';
      navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,0.45)';
    } else {
      navbar.style.height = '70px';
      navbar.style.boxShadow = '0 2px 30px rgba(0,0,0,0.3)';
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* ─────────────────────────────────────────
   2. SMOOTH SCROLL — anchor links
   ───────────────────────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 70;
      const top = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 16;

      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
})();


/* ─────────────────────────────────────────
   3. SERVICE CARDS — click → services page
      or "Coming Soon" popup for unavailable services
   ───────────────────────────────────────── */
(function initServiceCards() {

  // Services that are NOT yet available
  const UNAVAILABLE_SERVICES = [
    'security-guard',
    'fire-extinguiser',
    'construction',
    'cleaning',
  ];

  // Friendly display names + icons for the popup
  const SERVICE_META = {
    'security-guard':  { label: 'Security Guard',   icon: '🛡️' },
    'fire-extinguiser':{ label: 'Fire Emergency',    icon: '🔥' },
    'construction':    { label: 'Construction',      icon: '🏗️' },
    'cleaning':        { label: 'Cleaning',          icon: '🧹' },
  };

  /* ── Inject modal CSS once ── */
  const style = document.createElement('style');
  style.textContent = `
    /* Overlay */
    #as-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(10, 30, 18, 0.72);
      backdrop-filter: blur(4px);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.28s ease;
      pointer-events: none;
    }
    #as-modal-overlay.as-modal-open {
      opacity: 1;
      pointer-events: all;
    }

    /* Modal box */
    #as-modal-box {
      background: #fff;
      border-radius: 20px;
      padding: 2.8rem 2.4rem 2.2rem;
      max-width: 380px;
      width: 90%;
      text-align: center;
      box-shadow: 0 24px 60px rgba(0,0,0,0.25);
      transform: translateY(24px) scale(0.96);
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease;
      opacity: 0;
      position: relative;
    }
    #as-modal-overlay.as-modal-open #as-modal-box {
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    /* Close button */
    #as-modal-close {
      position: absolute;
      top: 1rem; right: 1.1rem;
      background: none;
      border: none;
      font-size: 1.3rem;
      cursor: pointer;
      color: #aaa;
      line-height: 1;
      transition: color 0.15s;
    }
    #as-modal-close:hover { color: #333; }

    /* Badge strip at top */
    #as-modal-badge {
      display: inline-block;
      background: #fff4e0;
      color: #b45309;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      padding: 0.28rem 0.8rem;
      border-radius: 20px;
      margin-bottom: 1.1rem;
      border: 1px solid #fcd34d;
    }

    #as-modal-icon {
      font-size: 3.2rem;
      display: block;
      margin-bottom: 0.6rem;
      animation: as-bounce 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes as-bounce {
      from { transform: scale(0.5); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }

    #as-modal-title {
      font-family: 'Sora', sans-serif;
      font-size: 1.25rem;
      font-weight: 800;
      color: #1a4d2e;
      margin-bottom: 0.45rem;
    }

    #as-modal-service-name {
      font-family: 'Sora', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      color: #2d7a47;
      margin-bottom: 0.9rem;
    }

    #as-modal-body {
      font-family: 'Sora', sans-serif;
      font-size: 0.85rem;
      color: #666;
      font-weight: 300;
      line-height: 1.75;
      margin-bottom: 1.6rem;
    }

    /* Notify button */
    #as-modal-notify {
      display: inline-block;
      background: #1a4d2e;
      color: #fff;
      font-family: 'Sora', sans-serif;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 0.75rem 1.8rem;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: background 0.2s, transform 0.15s;
      margin-bottom: 0.7rem;
      letter-spacing: 0.02em;
    }
    #as-modal-notify:hover {
      background: #3daa64;
      transform: translateY(-2px);
    }
    #as-modal-notify.as-notified {
      background: #3daa64;
      cursor: default;
      transform: none;
    }

    #as-modal-dismiss {
      display: block;
      font-family: 'Sora', sans-serif;
      font-size: 0.78rem;
      color: #aaa;
      background: none;
      border: none;
      cursor: pointer;
      margin: 0 auto;
      transition: color 0.15s;
    }
    #as-modal-dismiss:hover { color: #555; }

    /* Dim unavailable cards slightly */
    .service-card[data-unavailable="true"] {
      position: relative;
    }
    .service-card[data-unavailable="true"] .service-icon::after {
      content: 'Coming Soon';
      display: block;
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #b45309;
      background: #fff4e0;
      border: 1px solid #fcd34d;
      border-radius: 10px;
      padding: 0.15rem 0.5rem;
      margin-top: 0.3rem;
    }
  `;
  document.head.appendChild(style);

  /* ── Build modal DOM ── */
  const overlay = document.createElement('div');
  overlay.id = 'as-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'as-modal-title');
  overlay.innerHTML = `
    <div id="as-modal-box">
      <button id="as-modal-close" aria-label="Close">✕</button>
      <span id="as-modal-badge">⚠️ Coming Soon</span>
      <span id="as-modal-icon">🔧</span>
      <div id="as-modal-service-name"></div>
      <div id="as-modal-title">Service Not Yet Available</div>
      <p id="as-modal-body">
        We're working hard to bring this service to you.<br>
        Click below and we'll notify you the moment it launches!
      </p>
      <button id="as-modal-notify">🔔 Notify Me When Available</button>
      <button id="as-modal-dismiss">Maybe later</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const modalNotify  = overlay.querySelector('#as-modal-notify');
  const modalDismiss = overlay.querySelector('#as-modal-dismiss');
  const modalClose   = overlay.querySelector('#as-modal-close');
  const modalIcon    = overlay.querySelector('#as-modal-icon');
  const modalService = overlay.querySelector('#as-modal-service-name');

  /* ── Open / close helpers ── */
  function openModal(serviceKey) {
    const meta = SERVICE_META[serviceKey] || { label: serviceKey, icon: '🔧' };
    modalIcon.textContent    = meta.icon;
    modalService.textContent = meta.label;

    // Reset notify button state
    modalNotify.textContent = '🔔 Notify Me When Available';
    modalNotify.classList.remove('as-notified');
    modalNotify.disabled = false;

    overlay.classList.add('as-modal-open');
    // Trap focus on close button
    setTimeout(function () { modalClose.focus(); }, 300);
  }

  function closeModal() {
    overlay.classList.remove('as-modal-open');
  }

  // Close on overlay background click
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('as-modal-open')) {
      closeModal();
    }
  });

  modalClose.addEventListener('click', closeModal);
  modalDismiss.addEventListener('click', closeModal);

  // "Notify Me" button
  modalNotify.addEventListener('click', function () {
    if (this.classList.contains('as-notified')) return;
    this.textContent = '✅ You\'re on the list!';
    this.classList.add('as-notified');
    this.disabled = true;
    // Auto-close after 1.8s
    setTimeout(closeModal, 1800);
  });

  /* ── Wire up each service card ── */
  document.querySelectorAll('.service-card').forEach(function (card) {
    card.style.cursor = 'pointer';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');

    const service = card.getAttribute('data-service');
    const isUnavailable = UNAVAILABLE_SERVICES.includes(service);

    if (isUnavailable) {
      card.setAttribute('data-unavailable', 'true');
      card.setAttribute('aria-label',
        (SERVICE_META[service]?.label || service) + ' — Coming Soon');
    }

    card.addEventListener('click', function () {
      const svc = this.getAttribute('data-service');

      if (UNAVAILABLE_SERVICES.includes(svc)) {
        openModal(svc);
      } else {
        const url = svc
          ? 'services.html?service=' + encodeURIComponent(svc)
          : 'services.html';
        window.location.href = url;
      }
    });

    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });

})();


/* ─────────────────────────────────────────
   4. STAT COUNTER ANIMATION
      Counts up when the stats bar enters view
   ───────────────────────────────────────── */
(function initStatCounters() {
  /**
   * Parses a display string like "12,000+" or "8 min" or "4.8 ★"
   * Returns { prefix, number, suffix, isFloat }
   */
  function parseStatText(text) {
    const cleaned = text.trim();
    // Match optional non-digit prefix, then number (int or float), then suffix
    const match = cleaned.match(/^([^0-9]*)(\d[\d,.]*)(.*)$/);
    if (!match) return null;

    const prefix = match[1];
    const rawNum = match[2].replace(/,/g, '');
    const suffix = match[3];
    const isFloat = rawNum.includes('.');
    const number = parseFloat(rawNum);

    return { prefix, number, suffix, isFloat };
  }

  function formatNumber(n, isFloat) {
    if (isFloat) return n.toFixed(1);
    // Add thousand separators
    return Math.round(n).toLocaleString();
  }

  function animateCounter(el, parsed, duration) {
    const start = performance.now();
    const from = 0;
    const to = parsed.number;

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;

      el.textContent =
        parsed.prefix + formatNumber(current, parsed.isFloat) + parsed.suffix;

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  const statsBar = document.querySelector('.stats-bar');
  if (!statsBar) return;

  const statNums = statsBar.querySelectorAll('.stat-num');
  let animated = false;

  // Store original text and parsed data
  const statData = Array.from(statNums).map(function (el) {
    const original = el.textContent;
    return { el, original, parsed: parseStatText(original) };
  });

  const observer = new IntersectionObserver(
    function (entries) {
      if (entries[0].isIntersecting && !animated) {
        animated = true;
        statData.forEach(function (item) {
          if (item.parsed) {
            animateCounter(item.el, item.parsed, 1800);
          }
        });
        observer.disconnect();
      }
    },
    { threshold: 0.4 }
  );

  observer.observe(statsBar);
})();


/* ─────────────────────────────────────────
   5. SCROLL REVEAL — fade-in on scroll
      Targets: section-title, section-sub,
      service-card, step-card, testimonial-card
   ───────────────────────────────────────── */
(function initScrollReveal() {
  const selectors = [
    '.section-label',
    '.section-title',
    '.section-sub',
    '.service-card',
    '.step-card',
    '.testimonial-card',
    '.cta-title',
    '.cta-sub',
  ];

  // Inject base styles once
  const style = document.createElement('style');
  style.textContent = `
    .sr-hidden {
      opacity: 0;
      transform: translateY(28px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .sr-visible {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  const elements = document.querySelectorAll(selectors.join(','));

  elements.forEach(function (el, i) {
    el.classList.add('sr-hidden');
    // Stagger cards in the same row
    const delay = (i % 4) * 80;
    el.style.transitionDelay = delay + 'ms';
  });

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('sr-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  elements.forEach(function (el) {
    observer.observe(el);
  });
})();


/* ─────────────────────────────────────────
   6. EMERGENCY STRIP — cycling tip text
   ───────────────────────────────────────── */
(function initEmergencyStrip() {
  const strip = document.querySelector('.emergency-strip');
  if (!strip) return;

  const tips = [
    '🚨 Stay calm — help is on the way. Keep your phone line open.',
    '💡 Save our number: +977-1-XXXXXXX for future emergencies.',
    '🩺 For cardiac emergencies, begin CPR while waiting for the ambulance.',
    '🔥 In case of fire, evacuate first — then call 101.',
  ];

  // Find the static parts and append a tip element
  const tipEl = document.createElement('span');
  tipEl.style.cssText =
    'font-size:0.78rem;opacity:0.85;font-weight:400;display:inline-block;' +
    'max-width:340px;overflow:hidden;white-space:nowrap;transition:opacity 0.4s ease;';
  strip.appendChild(tipEl);

  let current = 0;

  function showTip() {
    tipEl.style.opacity = '0';
    setTimeout(function () {
      tipEl.textContent = tips[current];
      tipEl.style.opacity = '1';
      current = (current + 1) % tips.length;
    }, 400);
  }

  showTip();
  setInterval(showTip, 5000);
})();


/* ─────────────────────────────────────────
   7. ACTIVE NAV LINK highlight
   ───────────────────────────────────────── */
(function initActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    const linkPath = link.getAttribute('href');
    if (linkPath === currentPath) {
      link.style.background = 'rgba(255,255,255,0.12)';
      link.style.color = '#fff';
    }
  });
})();


/* ─────────────────────────────────────────
   8. SERVICE CARD — keyboard focus ring fix
      (ensures visible focus for accessibility)
   ───────────────────────────────────────── */
(function initFocusStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .service-card:focus-visible {
      outline: 3px solid var(--green-bright);
      outline-offset: 3px;
    }
  `;
  document.head.appendChild(style);
})();
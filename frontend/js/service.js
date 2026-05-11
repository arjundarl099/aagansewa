// ── Config ────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8000';

// ── Auth check — swap Login button to Dashboard if logged in ──────────────
const updateNavForAuth = () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  // Try to decode token to check it's valid (not expired)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp && Date.now() / 1000 > payload.exp;
    if (isExpired) {
      localStorage.removeItem('token');
      return;
    }

    // Replace Login button with Dashboard link
    const loginBtn = document.querySelector('.btn-login');
    if (loginBtn) {
      loginBtn.textContent = 'Dashboard';
      loginBtn.href = 'dashboard.html';
    }
  } catch {
    localStorage.removeItem('token');
  }
};

// ── Highlight active nav link ─────────────────────────────────────────────
const highlightActiveNav = () => {
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-links a').forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage) {
      link.style.background = 'rgba(255,255,255,0.15)';
      link.style.color = '#fff';
    }
  });
};

// ── Animate service cards on scroll ──────────────────────────────────────
const animateCards = () => {
  const cards = document.querySelectorAll('.grid a');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.animation = `fadeUp 0.4s ease both`;
        entry.target.style.animationDelay = `${i * 0.08}s`;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => {
    card.style.opacity = '0';
    observer.observe(card);
  });
};

// ── Inject fadeUp keyframe if not already in page ─────────────────────────
const injectStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
};

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  updateNavForAuth();
  highlightActiveNav();
  animateCards();
});
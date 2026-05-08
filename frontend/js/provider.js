// ── Config ────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8000';

const serviceIcons = {
  electrician: { icon: '⚡', label: 'Electricians' },
  plumber:     { icon: '🚿', label: 'Plumbers' },
  ambulance:   { icon: '🚑', label: 'Ambulance Services' },
  doctor:      { icon: '🩺', label: 'Doctors' },
};
2
// ── State ─────────────────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const serviceKey = (params.get('service') || 'electrician').toLowerCase();
const serviceInfo = serviceIcons[serviceKey] || serviceIcons.electrician;

let allProviders = [];
let currentFilter = 'all';
let bookingTarget = null;

// ── Init ──────────────────────────────────────────────────────────────────
document.getElementById('hero-icon').textContent = serviceInfo.icon;
document.getElementById('hero-service-label').textContent = serviceInfo.label;
document.getElementById('hero-title').textContent = serviceInfo.label;
document.title = `${serviceInfo.label} – Aagan Sewa`;
fetchProviders();

// ── Fetch from API ───────────────────────────────────────────────────────
async function fetchProviders() {
  const grid = document.getElementById('providersGrid');
  grid.innerHTML = `<div class="empty"><i class="fa-solid fa-spinner fa-spin"></i> Loading providers...</div>`;

  try {
    const res = await fetch(`${API_BASE}/api/v1/providers?service=${serviceKey}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    allProviders = data;
    renderCards(allProviders);
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<div class="empty"><i class="fa-solid fa-circle-exclamation"></i> Failed to load providers. Please try again.</div>`;
  }
}

// ── Render ────────────────────────────────────────────────────────────────
function renderCards(list) {
  const grid = document.getElementById('providersGrid');
  if (!list.length) {
    grid.innerHTML = `<div class="empty"><i class="fa-solid fa-circle-exclamation"></i>No providers found. Try a different search.</div>`;
    return;
  }
  grid.innerHTML = list.map((p, i) => `
    <div class="card" style="animation-delay:${i * 0.06}s">
      <div class="card-top">
        <div class="avatar">${p.initials || p.name.slice(0,2).toUpperCase()}</div>
        <div class="card-name">
          <h3>${p.name}</h3>
          <span class="tag">${serviceInfo.icon} ${serviceInfo.label.replace(/s$/, '')}</span>
        </div>
        <div class="available-dot ${p.available ? '' : 'unavailable-dot'}" title="${p.available ? 'Available now' : 'Unavailable'}"></div>
      </div>
      <div class="card-body">
        <div>
          ${starsHTML(p.rating)}
          <span class="rating-text">${p.rating} (${p.reviews} reviews)</span>
        </div>
        <div class="info-row"><i class="fa-solid fa-location-dot"></i> ${p.location}</div>
        <div class="info-row"><i class="fa-solid fa-briefcase"></i> ${p.experience} experience</div>
        <div class="info-row"><i class="fa-solid fa-tag"></i> <span class="price">Rs. ${p.price}/hr</span></div>
        <div class="info-row" style="font-size:.82rem;color:${p.available ? '#16a34a' : '#9ca3af'};font-weight:600;">
          <i class="fa-solid fa-circle" style="font-size:.5rem"></i>
          ${p.available ? 'Available Now' : 'Currently Unavailable'}
        </div>
      </div>
      <div class="card-footer">
        <button class="btn-book" onclick="openModal('${p._id}', '${p.name}', ${p.available})">
          <i class="fa-solid fa-calendar-check"></i> Book Now
        </button>
        <button class="btn-contact" title="Call ${p.name}" onclick="window.location.href='tel:${p.phone}'">
          <i class="fa-solid fa-phone"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function starsHTML(rating) {
  let html = '<span class="stars">';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) html += '<i class="fa-solid fa-star"></i>';
    else if (rating >= i - 0.5) html += '<i class="fa-solid fa-star-half-stroke"></i>';
    else html += '<i class="fa-regular fa-star"></i>';
  }
  return html + '</span>';
}

// ── Filter / Sort ─────────────────────────────────────────────────────────
function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterProviders();
}

function filterProviders() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const sort = document.getElementById('sortSelect').value;
  let list = [...allProviders];

  if (currentFilter === 'available') list = list.filter(p => p.available);
  if (currentFilter === 'top') list = list.filter(p => p.rating >= 4.7);
  if (q) list = list.filter(p =>
    p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)
  );

  if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  else if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);

  renderCards(list);
}

// ── Modal ─────────────────────────────────────────────────────────────────
function openModal(id, name, available) {
  if (!available) {
    showToast('⚠️ This provider is currently unavailable.');
    return;
  }
  bookingTarget = id;
  document.getElementById('modal-provider-name').textContent = 'Provider: ' + name;
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('f-date').min = today;
  document.getElementById('bookingModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('bookingModal').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('bookingModal').addEventListener('click', e => {
  if (e.target === document.getElementById('bookingModal')) closeModal();
});

async function submitBooking() {
  const name    = document.getElementById('f-name').value.trim();
  const phone   = document.getElementById('f-phone').value.trim();
  const date    = document.getElementById('f-date').value;
  const time    = document.getElementById('f-time').value;
  const address = document.getElementById('f-address').value.trim();
  const desc    = document.getElementById('f-desc').value.trim();
  const token   = localStorage.getItem('token');

  if (!name || !phone || !date || !address) {
    alert('Please fill in all required fields.');
    return;
  }

  const bookingData = {
    providerId: bookingTarget,
    customerName: name,
    customerPhone: phone,
    date,
    timeSlot: time,
    address,
    description: desc,
    service: serviceKey,
  };

  try {
    const res = await fetch(`${API_BASE}/api/v1/booker`, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json' ,
         'Authorization': `Bearer ${token}`
        },
      body: JSON.stringify(bookingData),
    });

    if (!res.ok) throw new Error('Booking failed');

    closeModal();
    showToast('✅ Booking confirmed! We\'ll contact you shortly.');
    ['f-name','f-phone','f-date','f-address','f-desc'].forEach(id => document.getElementById(id).value = '');
  } catch (err) {
    console.error(err);
    showToast('❌ Booking failed. Please try again.');
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Config ────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8000';

const serviceIcons = {
  electrician: { icon: '⚡', label: 'Electricians' },
  plumber:     { icon: '🚿', label: 'Plumbers' },
  ambulance:   { icon: '🚑', label: 'Ambulance Services' },
  doctor:      { icon: '🩺', label: 'Doctors' },
};

// ── State ─────────────────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const serviceKey = (params.get('service') || 'electrician').toLowerCase();
const serviceInfo = serviceIcons[serviceKey] || serviceIcons.electrician;

let allProviders = [];
let currentFilter = 'all';
let bookingTarget = null;

// ── Provider modal state ──────────────────────────────────────────────────
let providerEditId = null;   // null = create mode, string = edit mode
let deleteTarget   = null;   // id of provider pending deletion

// ── Admin check (decode JWT role without a library) ───────────────────────
function getTokenRole() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    // JWT = header.payload.signature — decode the payload (middle part)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role ? payload.role.toLowerCase() : null;
  } catch {
    return null;
  }
}

const isAdmin = getTokenRole() === 'admin';

// ── Init ──────────────────────────────────────────────────────────────────
document.getElementById('hero-icon').textContent = serviceInfo.icon;
document.getElementById('hero-service-label').textContent = serviceInfo.label;
document.getElementById('hero-title').textContent = serviceInfo.label;
document.title = `${serviceInfo.label} – Aagan Sewa`;

// Show "Add Provider" button only for admin
if (isAdmin) {
  document.getElementById('btn-add-provider').style.display = 'flex';
}

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
        <div class="avatar">${p.initials || (p.name ? p.name.slice(0,2).toUpperCase() : '??')}</div>
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
        ${isAdmin ? `
        <button class="btn-edit" title="Edit ${p.name}" onclick="openEditModal('${p._id}')">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn-delete" title="Delete ${p.name}" onclick="openDeleteModal('${p._id}', '${p.name}')">
          <i class="fa-solid fa-trash"></i>
        </button>
        ` : ''}
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

// ── Booking Modal ─────────────────────────────────────────────────────────
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
  const date  = document.getElementById('f-date').value;
  const time  = document.getElementById('f-time').value;
  const desc  = document.getElementById('f-desc').value.trim();
  const token = localStorage.getItem('token');

  if (!date) {
    alert('Please select a date.');
    return;
  }

  const bookingData = {
    providerId: bookingTarget,
    date,
    timeSlot: time,
    description: desc,
    service: serviceKey,
  };

  try {
    const res = await fetch(`${API_BASE}/api/v1/booker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bookingData),
    });

    if (!res.ok) throw new Error('Booking failed');

    closeModal();
    showToast('✅ Booking confirmed! We\'ll contact you shortly.');
    ['f-date', 'f-desc'].forEach(id => document.getElementById(id).value = '');
    window.location.href = 'dashboard.html';
  } catch (err) {
    console.error(err);
    showToast('❌ Booking failed. Please try again.');
  }
}

// ── ADD / EDIT Provider Modal ─────────────────────────────────────────────
function openProviderModal() {
  if (!isAdmin) { showToast('⛔ Admin access required.'); return; }

  providerEditId = null;
  document.getElementById('provider-modal-title').innerHTML =
    '<i class="fa-solid fa-user-plus" style="color:var(--green);margin-right:.5rem"></i> Add Provider';
  document.getElementById('provider-submit-btn').textContent = 'Add Provider';

  ['p-name', 'p-phone', 'p-location', 'p-experience', 'p-price', 'p-rating', 'p-reviews'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('p-available').value = 'true';

  document.getElementById('providerModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function openEditModal(id) {
  if (!isAdmin) { showToast('⛔ Admin access required.'); return; }

  const provider = allProviders.find(p => p._id === id);
  if (!provider) return;

  providerEditId = id;
  document.getElementById('provider-modal-title').innerHTML =
    '<i class="fa-solid fa-pen" style="color:var(--green);margin-right:.5rem"></i> Edit Provider';
  document.getElementById('provider-submit-btn').textContent = 'Save Changes';

  document.getElementById('p-name').value       = provider.name       || '';
  document.getElementById('p-phone').value      = provider.phone      || '';
  document.getElementById('p-location').value   = provider.location   || '';
  document.getElementById('p-experience').value = provider.experience || '';
  document.getElementById('p-price').value      = provider.price      || '';
  document.getElementById('p-rating').value     = provider.rating     || '';
  document.getElementById('p-reviews').value    = provider.reviews    || '';
  document.getElementById('p-available').value  = provider.available ? 'true' : 'false';

  document.getElementById('providerModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProviderModal() {
  document.getElementById('providerModal').classList.remove('open');
  document.body.style.overflow = '';
  providerEditId = null;
}

document.getElementById('providerModal').addEventListener('click', e => {
  if (e.target === document.getElementById('providerModal')) closeProviderModal();
});

async function submitProvider() {
  if (!isAdmin) { showToast('⛔ Admin access required.'); return; }

  const token      = localStorage.getItem('token');
  const name       = document.getElementById('p-name').value.trim();
  const phone      = document.getElementById('p-phone').value.trim();
  const location   = document.getElementById('p-location').value.trim();
  const experience = document.getElementById('p-experience').value.trim();
  const price      = parseFloat(document.getElementById('p-price').value);
  const rating     = parseFloat(document.getElementById('p-rating').value);
  const reviews    = parseInt(document.getElementById('p-reviews').value);
  const available  = document.getElementById('p-available').value === 'true';

  if (!name || !phone || !location || !experience || isNaN(price)) {
    showToast('⚠️ Please fill in all required fields.');
    return;
  }

  const payload = { name, phone, location, experience, price, rating, reviews, available, service: serviceKey };

  const isEdit = providerEditId !== null;
  const url    = isEdit
    ? `${API_BASE}/api/v1/providers/${providerEditId}`
    : `${API_BASE}/api/v1/providers`;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Request failed');

    const saved = await res.json();

    if (isEdit) {
      const idx = allProviders.findIndex(p => p._id === providerEditId);
      if (idx !== -1) allProviders[idx] = saved;
      showToast('✅ Provider updated successfully.');
    } else {
      allProviders.unshift(saved);
      showToast('✅ Provider added successfully.');
    }

    closeProviderModal();
    filterProviders();
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to save provider. Please try again.');
  }
}

// ── Delete Provider Modal ─────────────────────────────────────────────────
function openDeleteModal(id, name) {
  if (!isAdmin) { showToast('⛔ Admin access required.'); return; }

  deleteTarget = id;
  document.getElementById('delete-provider-name').textContent = `Provider: ${name}`;
  document.getElementById('deleteModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('open');
  document.body.style.overflow = '';
  deleteTarget = null;
}

document.getElementById('deleteModal').addEventListener('click', e => {
  if (e.target === document.getElementById('deleteModal')) closeDeleteModal();
});

async function confirmDelete() {
  if (!isAdmin) { showToast('⛔ Admin access required.'); return; }

  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/api/v1/providers/${deleteTarget}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Delete failed');

    allProviders = allProviders.filter(p => p._id !== deleteTarget);
    closeDeleteModal();
    filterProviders();
    showToast('🗑️ Provider deleted successfully.');
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to delete provider. Please try again.');
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}
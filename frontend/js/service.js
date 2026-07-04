// ── Config ────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8000'; // confirm this matches your server
// Confirm your bookingRoutes mount path in app.js/server.js — using /api/bookings
// to match router.route('/').post(createBooking) → POST {API_BASE}/api/bookings
const BOOKING_API = `${API_BASE}/api/v1/booker`;

const params = new URLSearchParams(window.location.search);
const providerId = params.get('provider');

let currentProvider = null;   // set after fetch, used for provider name in modal
let bookingTarget = null;     // { serviceId, category, available }

function starsHTML(rating) {
  const r = Number(rating) || 0;
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (r >= i) html += '<i class="fa-solid fa-star"></i>';
    else if (r >= i - 0.5) html += '<i class="fa-solid fa-star-half-stroke"></i>';
    else html += '<i class="fa-regular fa-star"></i>';
  }
  return html;
}

// ── Render provider header ──────────────────────────────────────────────
// Fields come directly from your Provider schema.
function renderProviderHeader(provider) {
  const header = document.getElementById('provider-header');
  header.innerHTML = `
    <div class="max-w-3xl mx-auto text-center relative z-10">
      ${provider.verified ? `<span class="inline-block font-mono text-[0.7rem] tracking-[0.25em] uppercase text-marigold border border-marigold/40 rounded-full px-4 py-1 mb-5"><i class="fa-solid fa-check mr-1"></i> Verified provider</span>` : ''}
      <h1 class="font-display font-semibold text-4xl md:text-5xl leading-[1.05] mb-4">${provider.name}</h1>
      <p class="text-white/70 text-base md:text-lg max-w-xl mx-auto mb-4">${provider.description || ''}</p>
      <div class="flex flex-wrap items-center justify-center gap-4 text-sm text-white/80">
        <span class="flex items-center gap-2"><i class="fa-solid fa-location-dot"></i> ${provider.location}</span>
        <span class="flex items-center gap-2"><i class="fa-solid fa-phone"></i> ${provider.phone}</span>
        <span class="flex items-center gap-1 text-marigold">${starsHTML(provider.rating)} <span class="text-white/60 font-mono text-xs ml-1">${provider.rating ?? 0} (${provider.reviews ?? 0})</span></span>
      </div>
    </div>
  `;
  document.title = `${provider.name} – Aagan Sewa`;
}

// ── Render one service card ─────────────────────────────────────────────
// Fields come directly from your Service schema.
function serviceCard(service) {
  return `
    <div class="card-lift bg-white rounded-2xl border border-pine/10 shadow-sm overflow-hidden">
      <div class="p-6 pb-4">
        <div class="w-14 h-14 rounded-xl bg-pine-pale border border-pine/10 flex items-center justify-center text-2xl mb-4">${service.icon || '🛠️'}</div>
        <h3 class="font-display font-semibold text-xl text-pine mb-1">${service.name}</h3>
        <p class="text-sm text-[#12261d]/60 mb-3">${service.description || ''}</p>
        <div class="flex items-center gap-1 text-marigold-dark text-sm mb-3">
          ${starsHTML(service.rating)}
          <span class="text-[#12261d]/50 text-xs font-mono ml-1">${service.rating ?? 0} (${service.reviews ?? 0})</span>
        </div>
        <div class="space-y-1.5 text-sm text-[#12261d]/70">
          <div class="flex items-center gap-2"><i class="fa-solid fa-tag w-4 text-pine/50"></i> Rs. ${service.price}</div>
          ${service.experience ? `<div class="flex items-center gap-2"><i class="fa-solid fa-briefcase w-4 text-pine/50"></i> ${service.experience} experience</div>` : ''}
          ${service.duration ? `<div class="flex items-center gap-2"><i class="fa-solid fa-clock w-4 text-pine/50"></i> ${service.duration}</div>` : ''}
          ${service.capacity ? `<div class="flex items-center gap-2"><i class="fa-solid fa-users w-4 text-pine/50"></i> Capacity: ${service.capacity}</div>` : ''}
        </div>
      </div>
      <div class="px-6 py-4 border-t border-pine/10 flex items-center justify-between gap-3">
        <span class="text-xs font-mono ${service.available ? 'text-green-600' : 'text-pine/40'}">
          <i class="fa-solid fa-circle text-[0.5rem] mr-1"></i>${service.available ? 'Available Now' : 'Unavailable'}
        </span>
        <button
          onclick='openBookingModal(${JSON.stringify(service._id)}, ${JSON.stringify(service.category)}, ${service.available})'
          class="text-sm font-semibold text-white bg-crimson hover:bg-crimson-dark transition px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          ${service.available ? '' : 'disabled'}>
          <i class="fa-solid fa-calendar-check"></i> Book Now
        </button>
      </div>
    </div>
  `;
}

// ── Booking modal ────────────────────────────────────────────────────────
function openBookingModal(serviceId, category, available) {
  if (!available) {
    showToast('⚠️ This service is currently unavailable.');
    return;
  }
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('⚠️ Please log in to book a service.');
    return;
  }

  bookingTarget = { serviceId, category, available };
  document.getElementById('modal-provider-name').textContent =
    'Provider: ' + (currentProvider ? currentProvider.name : '');

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('f-date').min = today;
  document.getElementById('f-date').value = '';
  document.getElementById('f-time').value = '';
  document.getElementById('f-desc').value = '';

  document.getElementById('bookingModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('open');
  document.body.style.overflow = '';
  bookingTarget = null;
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('bookingModal');
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeBookingModal();
    });
  }
});

async function submitBooking() {
  const date = document.getElementById('f-date').value;
  const timeSlot = document.getElementById('f-time').value;
  const description = document.getElementById('f-desc').value.trim();
  const token = localStorage.getItem('token');

  if (!date) {
    showToast('⚠️ Please select a date.');
    return;
  }
  if (!timeSlot) {
    showToast('⚠️ Please select a time.');
    return;
  }

  // Matches createBooking's destructure exactly:
  // providerId, serviceId, date, timeSlot, description, service (optional category label)
  const payload = {
    providerId,                       // from the page's ?provider= query param
    serviceId: bookingTarget.serviceId, // required — this is what capacity gets decremented on
    date,
    timeSlot,
    description,
    service: bookingTarget.category,  // stored as serviceCategory, just a label
  };

  try {
    const res = await fetch(BOOKING_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      // errorResponse likely sends { success: false, error/message: '...' }
      showToast(`❌ ${data.error || data.message || 'Booking failed.'}`);
      return;
    }

    closeBookingModal();
    showToast('✅ Booking confirmed! We\'ll contact you shortly.');
    // Confirm this filename matches your actual dashboard page.
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1200); // short delay so the toast is visible before navigating
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

// ── Load & render ────────────────────────────────────────────────────────
async function loadProviderServices() {
  const grid = document.getElementById('services-grid');
  const header = document.getElementById('provider-header');

  if (!providerId) {
    header.innerHTML = `<div class="max-w-3xl mx-auto text-center relative z-10"><p class="text-white/70">No provider specified.</p></div>`;
    grid.innerHTML = '';
    return;
  }

  try {
    // getProviderById → GET /api/providers/:id
    const providerRes = await fetch(`${API_BASE}/api/v1/providers/${providerId}`);
    if (!providerRes.ok) throw new Error('Provider not found');
    const provider = await providerRes.json();
    currentProvider = provider;
    renderProviderHeader(provider);

    // getServicesByProvider → GET /api/services/provider/:providerId
    const servicesRes = await fetch(`${API_BASE}/api/v1/services/provider/${providerId}`);
    if (!servicesRes.ok) throw new Error('Failed to fetch services');
    const services = await servicesRes.json();

    if (!services.length) {
      grid.innerHTML = `<p class="col-span-full text-center text-pine/50 font-mono text-sm py-10">This provider hasn't listed any services yet.</p>`;
      return;
    }

    grid.innerHTML = services.map(serviceCard).join('');

  } catch (err) {
    console.error(err);
    header.innerHTML = `<div class="max-w-3xl mx-auto text-center relative z-10"><p class="text-white/70">Couldn't load this provider.</p></div>`;
    grid.innerHTML = `<p class="col-span-full text-center text-crimson font-mono text-sm py-10">Couldn't load services. Please try again later.</p>`;
  }
}

loadProviderServices();
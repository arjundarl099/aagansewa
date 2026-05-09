const API_BASE = 'http://localhost:8000';

const container  = document.getElementById('card-container');
const logOutBtn  = document.getElementById('logoutBtn');

// ── Navigate to providers page ────────────────────────────────────────────
const gotoProvider = (e) => {
  const card = e.target.closest('.service-card');
  if (!card) return;
  const service = card.dataset.service;
  window.location.href = `providers.html?service=${service}`;
};

// ── Logout ────────────────────────────────────────────────────────────────
const logOuting = () => {
  if (confirm('Are you sure you want to log out?')) {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  }
};

container.addEventListener('click', gotoProvider);
logOutBtn.addEventListener('click', logOuting);

// ── Load logged-in user info ──────────────────────────────────────────────
const loadUser = async () => {
  const greetUser = document.getElementById('greeting');
  try {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'index.html'; return; }

    const res = await fetch(`${API_BASE}/api/v1/auth/Me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Failed to load user');

    greetUser.textContent = `Hi, ${data.data.name} 👋`;

  } catch (err) {
    console.error(err);
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  }
};

// ── Cancel a booking ──────────────────────────────────────────────────────
const cancelBooking = async (bookingId, btn) => {
  if (!confirm('Are you sure you want to cancel this booking?')) return;

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Cancelling…';

  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_BASE}/api/v1/booker/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'cancelled' })
    });

    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Cancellation failed');

    loadBookings();

  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-xmark mr-1"></i>Cancel';
    alert('Failed to cancel booking. Please try again.');
  }
};

// ── Load bookings ─────────────────────────────────────────────────────────
const loadBookings = async () => {
  const bookingsContainer = document.getElementById('bookings-container');
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch(`${API_BASE}/api/v1/booker`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Failed to fetch bookings');
    const data = await res.json();
    const bookings = data.data;

    if (!bookings || bookings.length === 0) {
      bookingsContainer.innerHTML = `
        <div class="text-center py-12 text-gray-400">
          <i class="fa-solid fa-calendar-xmark text-4xl mb-3 block"></i>
          <p class="font-semibold">No bookings yet</p>
          <p class="text-sm mt-1">Book a service above to get started.</p>
        </div>`;
      return;
    }

    bookingsContainer.innerHTML = bookings.map((b, i) => `
      <div class="bg-white rounded-2xl border border-gray-100 shadow p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-4"
           style="animation:fadeUp .4s ease both;animation-delay:${i * 0.07}s">

        <!-- Service Icon -->
        <div class="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
             style="background:#dcfce7;">
          ${serviceEmoji(b.service)}
        </div>

        <!-- Details -->
        <div class="flex-1">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <h3 class="font-bold text-base" style="color:#14532d;">
              ${capitalize(b.service || 'Service')}
            </h3>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${statusClass(b.status)}">
              ${capitalize(b.status || 'pending')}
            </span>
          </div>
          <div class="text-sm text-gray-500 flex flex-wrap gap-3 mt-1">
            <span><i class="fa-solid fa-calendar mr-1" style="color:#16a34a;"></i>${formatDate(b.date)}</span>
            <span><i class="fa-solid fa-clock mr-1" style="color:#16a34a;"></i>${b.time || b.timeSlot || '—'}</span>
            ${b.address ? `<span><i class="fa-solid fa-location-dot mr-1" style="color:#16a34a;"></i>${b.address}</span>` : ''}
          </div>
          ${b.description ? `<p class="text-sm text-gray-400 mt-1 italic">"${b.description}"</p>` : ''}
        </div>

        <!-- Provider -->
        ${b.provider ? `
        <div class="text-right text-sm text-gray-500 flex-shrink-0">
          <div class="font-semibold text-gray-700">${b.provider.name || 'Provider'}</div>
          ${b.provider.phone ? `<div><i class="fa-solid fa-phone mr-1"></i>${b.provider.phone}</div>` : ''}
        </div>` : ''}

        <!-- Cancel Button -->
        ${b.status !== 'cancelled' && b.status !== 'completed' ? `
        <div class="flex-shrink-0">
          <button
            class="cancel-btn text-sm font-semibold px-4 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition"
            data-id="${b._id || b.id}">
            <i class="fa-solid fa-xmark mr-1"></i>Cancel
          </button>
        </div>` : ''}

      </div>
    `).join('');

    // Attach cancel button listeners after rendering
    bookingsContainer.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => cancelBooking(btn.dataset.id, btn));
    });

  } catch (err) {
    console.error(err);
    bookingsContainer.innerHTML = `
      <div class="text-center py-10 text-red-400">
        <i class="fa-solid fa-circle-exclamation text-3xl mb-2 block"></i>
        Failed to load bookings. Please try again.
      </div>`;
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────
function serviceEmoji(service) {
  const map = { electrician: '⚡', plumber: '🚿', ambulance: '🚑', doctor: '🩺' };
  return map[(service || '').toLowerCase()] || '🛠️';
}

function statusClass(status) {
  const map = {
    pending:   'status-pending',
    confirmed: 'status-confirmed',
    cancelled: 'status-cancelled',
    completed: 'status-completed',
  };
  return map[(status || '').toLowerCase()] || 'status-pending';
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Init ──────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadUser();
  loadBookings();
});
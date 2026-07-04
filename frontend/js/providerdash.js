const API_BASE = 'http://localhost:8000'; // confirm this matches your server

// ── Guard: only providers may view this page ────────────────────────────
function getTokenRole() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role ? payload.role.toLowerCase() : null;
  } catch {
    return null;
  }
}

const token = localStorage.getItem('token');
if (!token || getTokenRole() !== 'provider') {
  window.location.href = 'login.html';
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

let myProvider = null;   // fetched from /api/providers/me
let editServiceId = null; // null = create mode

function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── My Listing ───────────────────────────────────────────────────────────
async function loadMyProvider() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/providers/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load your listing');
    myProvider = await res.json();

    document.getElementById('l-name').value = myProvider.name || '';
    document.getElementById('l-phone').value = myProvider.phone || '';
    document.getElementById('l-location').value = myProvider.location || '';
    document.getElementById('l-email').value = myProvider.email || '';
    document.getElementById('l-description').value = myProvider.description || '';

    const badges = document.getElementById('listing-badges');
    badges.innerHTML = `
      <span class="text-xs font-semibold px-2 py-1 rounded-full ${myProvider.verified ? 'bg-green-100 text-green-700' : 'bg-pine/10 text-pine/50'}">${myProvider.verified ? 'Verified' : 'Unverified'}</span>
      <span class="text-xs font-semibold px-2 py-1 rounded-full ${myProvider.active ? 'bg-green-100 text-green-700' : 'bg-pine/10 text-pine/50'}">${myProvider.active ? 'Active' : 'Inactive'}</span>
    `;

    document.getElementById('review-banner').classList.toggle('hidden', myProvider.verified);

    // Now that we know our own provider ID, load services + bookings
    loadMyServices();
    loadBookingRequests();

  } catch (err) {
    console.error(err);
    showToast('❌ Could not load your provider listing.');
  }
}

document.getElementById('listing-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById('l-name').value.trim(),
    phone: document.getElementById('l-phone').value.trim(),
    location: document.getElementById('l-location').value.trim(),
    email: document.getElementById('l-email').value.trim(),
    description: document.getElementById('l-description').value.trim(),
  };

  try {
    const res = await fetch(`${API_BASE}/api/v1/providers/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed');
    myProvider = await res.json();
    showToast('✅ Listing updated.');
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to update listing.');
  }
});

// ── My Services ──────────────────────────────────────────────────────────
async function loadMyServices() {
  const list = document.getElementById('services-list');
  try {
    const res = await fetch(`${API_BASE}/api/v1/services/provider/${myProvider._id}`);
    const services = await res.json();

    if (!services.length) {
      list.innerHTML = `<p class="text-pine/40 text-sm col-span-full">You haven't added any services yet.</p>`;
      return;
    }

    list.innerHTML = services.map(s => `
      <div class="border border-pine/10 rounded-xl p-4">
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-xl">${s.icon || '🛠️'}</span>
            <div>
              <h4 class="font-semibold text-pine">${s.name}</h4>
              <p class="text-xs text-pine/50 font-mono uppercase">${s.category}</p>
            </div>
          </div>
          <span class="text-xs font-semibold px-2 py-1 rounded-full ${s.available ? 'bg-green-100 text-green-700' : 'bg-pine/10 text-pine/50'}">${s.available ? 'Available' : 'Unavailable'}</span>
        </div>
        <p class="text-sm text-pine/60 mb-2">${s.description || ''}</p>
        <div class="text-sm text-pine/70 flex flex-wrap gap-x-4 gap-y-1 mb-3">
          <span>Rs. ${s.price}</span>
          <span>Capacity: ${s.capacity ?? '—'}</span>
        </div>
        <div class="flex gap-2">
          <button onclick='openServiceModal(${JSON.stringify(s)})' class="text-xs font-semibold px-3 py-1.5 rounded-md border border-pine/15 hover:bg-pine-pale transition">Edit</button>
          <button onclick="toggleServiceAvailability('${s._id}')" class="text-xs font-semibold px-3 py-1.5 rounded-md border border-pine/15 hover:bg-pine-pale transition">Toggle</button>
          <button onclick="deleteService('${s._id}', '${s.name.replace(/'/g, "\\'")}')" class="text-xs font-semibold px-3 py-1.5 rounded-md border border-crimson/20 text-crimson hover:bg-crimson/5 transition">Delete</button>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error(err);
    list.innerHTML = `<p class="text-crimson text-sm col-span-full">Failed to load your services.</p>`;
  }
}

function openServiceModal(service) {
  editServiceId = service ? service._id : null;
  document.getElementById('service-modal-title').textContent = service ? 'Edit Service' : 'Add Service';
  document.getElementById('service-submit-btn').textContent = service ? 'Save Changes' : 'Add Service';

  document.getElementById('s-category').value = service?.category || '';
  document.getElementById('s-name').value = service?.name || '';
  document.getElementById('s-description').value = service?.description || '';
  document.getElementById('s-price').value = service?.price ?? '';
  document.getElementById('s-capacity').value = service?.capacity ?? '';
  document.getElementById('s-experience').value = service?.experience || '';
  document.getElementById('s-duration').value = service?.duration || '';
  document.getElementById('s-icon').value = service?.icon || '';

  document.getElementById('serviceModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeServiceModal() {
  document.getElementById('serviceModal').classList.remove('open');
  document.body.style.overflow = '';
  editServiceId = null;
}

document.getElementById('serviceModal').addEventListener('click', e => {
  if (e.target === document.getElementById('serviceModal')) closeServiceModal();
});

async function submitService() {
  const payload = {
    category: document.getElementById('s-category').value.trim().toLowerCase(),
    name: document.getElementById('s-name').value.trim(),
    description: document.getElementById('s-description').value.trim(),
    price: parseFloat(document.getElementById('s-price').value),
    capacity: parseInt(document.getElementById('s-capacity').value) || 0,
    experience: document.getElementById('s-experience').value.trim(),
    duration: document.getElementById('s-duration').value.trim(),
    icon: document.getElementById('s-icon').value.trim(),
  };

  if (!payload.category || !payload.name || isNaN(payload.price)) {
    showToast('⚠️ Please fill in category, name, and price.');
    return;
  }

  const isEdit = editServiceId !== null;
  const url = isEdit
    ? `${API_BASE}/api/v1/services/${editServiceId}`
    : `${API_BASE}/api/v1/services`;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed');

    closeServiceModal();
    showToast(isEdit ? '✅ Service updated.' : '✅ Service added.');
    loadMyServices();
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to save service.');
  }
}

async function toggleServiceAvailability(id) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/services/${id}/availability`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed');
    showToast('✅ Availability updated.');
    loadMyServices();
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to update availability.');
  }
}

async function deleteService(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    const res = await fetch(`${API_BASE}/api/v1/services/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed');
    showToast('🗑️ Service deleted.');
    loadMyServices();
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to delete service.');
  }
}

// ── Booking Requests ─────────────────────────────────────────────────────
async function loadBookingRequests() {
  const tbody = document.getElementById('bookings-tbody');
  try {
    const res = await fetch(`${API_BASE}/api/v1/booker/provider`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const json = await res.json();
    const bookings = json.data || [];

    if (!bookings.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-pine/40">No booking requests yet.</td></tr>`;
      return;
    }

    const statusColor = {
      pending: 'bg-marigold/20 text-marigold-dark',
      confirmed: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-pine/10 text-pine/50',
    };

    tbody.innerHTML = bookings.map(b => `
      <tr class="border-b border-pine/5">
        <td class="px-6 py-3">
          <div class="font-medium">${b.user ? b.user.name : '—'}</div>
          <div class="text-xs text-pine/50">${b.user ? (b.user.phone || b.user.email) : ''}</div>
        </td>
        <td class="px-6 py-3">${b.service ? b.service.name : '—'}</td>
        <td class="px-6 py-3 font-mono text-xs">${new Date(b.date).toLocaleDateString()}</td>
        <td class="px-6 py-3 font-mono text-xs">${b.time}</td>
        <td class="px-6 py-3 text-pine/60 max-w-[200px] truncate" title="${b.description || ''}">${b.description || '—'}</td>
        <td class="px-6 py-3"><span class="text-xs font-semibold px-2 py-1 rounded-full ${statusColor[b.status] || ''}">${b.status}</span></td>
        <td class="px-6 py-3">
          ${b.status === 'pending' ? `
            <div class="flex gap-2">
              <button onclick="updateBookingStatus('${b._id}', 'confirmed')" class="text-xs font-semibold px-3 py-1.5 rounded-md bg-pine text-white hover:bg-pine-light transition">Confirm</button>
              <button onclick="cancelBookingRequest('${b._id}')" class="text-xs font-semibold px-3 py-1.5 rounded-md border border-crimson/20 text-crimson hover:bg-crimson/5 transition">Decline</button>
            </div>
          ` : b.status === 'confirmed' ? `
            <button onclick="updateBookingStatus('${b._id}', 'completed')" class="text-xs font-semibold px-3 py-1.5 rounded-md bg-pine text-white hover:bg-pine-light transition">Mark Complete</button>
          ` : ''}
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-crimson">Failed to load booking requests.</td></tr>`;
  }
}

async function updateBookingStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/booker/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed');
    showToast(`✅ Booking marked ${status}.`);
    loadBookingRequests();
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to update booking.');
  }
}

async function cancelBookingRequest(id) {
  if (!confirm('Decline this booking request?')) return;
  try {
    const res = await fetch(`${API_BASE}/api/v1/booker/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed');
    showToast('✅ Booking declined.');
    loadBookingRequests();
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to decline booking.');
  }
}

loadMyProvider();
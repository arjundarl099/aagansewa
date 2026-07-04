const API_BASE = 'http://localhost:8000'; // confirm this matches your server

// ── Guard: only admins may view this page ──────────────────────────────────
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
if (!token || getTokenRole() !== 'admin') {
  window.location.href = 'login.html';
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

// ── Tabs ─────────────────────────────────────────────────────────────────
function switchTab(tab) {
  ['providers', 'services', 'bookings'].forEach(t => {
    document.getElementById(`panel-${t}`).classList.toggle('hidden', t !== tab);
    const btn = document.getElementById(`tab-${t}`);
    btn.classList.toggle('bg-pine', t === tab);
    btn.classList.toggle('text-white', t === tab);
    btn.classList.toggle('text-pine/60', t !== tab);
  });
}
switchTab('providers');

function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function badge(ok, onText, offText) {
  return ok
    ? `<span class="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">${onText}</span>`
    : `<span class="text-xs font-semibold px-2 py-1 rounded-full bg-pine/10 text-pine/50">${offText}</span>`;
}

// ── PROVIDERS ────────────────────────────────────────────────────────────
async function loadProviders() {
  const tbody = document.getElementById('providers-tbody');
  try {
    const res = await fetch(`${API_BASE}/api/v1/providers`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const providers = await res.json();

    if (!providers.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-8 text-center text-pine/40">No providers yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = providers.map(p => `
      <tr class="border-b border-pine/5">
        <td class="px-5 py-3 font-medium">${p.name}</td>
        <td class="px-5 py-3 text-pine/60 font-mono text-xs uppercase">${p.providerType}</td>
        <td class="px-5 py-3 text-pine/60">${p.location}</td>
        <td class="px-5 py-3">${badge(p.verified, 'Verified', 'Unverified')}</td>
        <td class="px-5 py-3">${badge(p.active, 'Active', 'Inactive')}</td>
        <td class="px-5 py-3">
          <div class="flex gap-2">
            <button onclick="toggleProviderVerified('${p._id}')" class="text-xs font-semibold px-3 py-1.5 rounded-md border border-pine/15 hover:bg-pine-pale transition">
              ${p.verified ? 'Unverify' : 'Verify'}
            </button>
            <button onclick="toggleProviderActive('${p._id}')" class="text-xs font-semibold px-3 py-1.5 rounded-md border border-pine/15 hover:bg-pine-pale transition">
              ${p.active ? 'Deactivate' : 'Activate'}
            </button>
            <button onclick="deleteProvider('${p._id}', '${p.name.replace(/'/g, "\\'")}')" class="text-xs font-semibold px-3 py-1.5 rounded-md border border-crimson/20 text-crimson hover:bg-crimson/5 transition">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-8 text-center text-crimson">Failed to load providers.</td></tr>`;
  }
}

async function toggleProviderVerified(id) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/providers/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed');
    showToast('✅ Verification status updated.');
    loadProviders();
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to update verification.');
  }
}

async function toggleProviderActive(id) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/providers/${id}/availability`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed');
    showToast('✅ Active status updated.');
    loadProviders();
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to update status.');
  }
}

async function deleteProvider(id, name) {
  if (!confirm(`Delete provider "${name}"? This cannot be undone.`)) return;
  try {
    const res = await fetch(`${API_BASE}/api/v1/providers/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed');
    showToast('🗑️ Provider deleted.');
    loadProviders();
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to delete provider.');
  }
}

// ── SERVICES ─────────────────────────────────────────────────────────────
async function loadServices() {
  const tbody = document.getElementById('services-tbody');
  try {
    const res = await fetch(`${API_BASE}/api/v1/services`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const services = await res.json();

    if (!services.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-pine/40">No services yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = services.map(s => `
      <tr class="border-b border-pine/5">
        <td class="px-5 py-3 font-medium">${s.name}</td>
        <td class="px-5 py-3 text-pine/60 font-mono text-xs uppercase">${s.category}</td>
        <td class="px-5 py-3 text-pine/60">${s.provider ? s.provider.name : '—'}</td>
        <td class="px-5 py-3">Rs. ${s.price}</td>
        <td class="px-5 py-3">${s.capacity ?? '—'}</td>
        <td class="px-5 py-3">${badge(s.available, 'Available', 'Unavailable')}</td>
        <td class="px-5 py-3">
          <div class="flex gap-2">
            <button onclick="toggleServiceAvailability('${s._id}')" class="text-xs font-semibold px-3 py-1.5 rounded-md border border-pine/15 hover:bg-pine-pale transition">
              Toggle
            </button>
            <button onclick="deleteService('${s._id}', '${s.name.replace(/'/g, "\\'")}')" class="text-xs font-semibold px-3 py-1.5 rounded-md border border-crimson/20 text-crimson hover:bg-crimson/5 transition">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-crimson">Failed to load services.</td></tr>`;
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
    loadServices();
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to update availability.');
  }
}

async function deleteService(id, name) {
  if (!confirm(`Delete service "${name}"? This cannot be undone.`)) return;
  try {
    const res = await fetch(`${API_BASE}/api/v1/services/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed');
    showToast('🗑️ Service deleted.');
    loadServices();
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to delete service.');
  }
}

// ── BOOKINGS (read-only overview for admin) ─────────────────────────────
async function loadBookings() {
  const tbody = document.getElementById('bookings-tbody');
  try {
    const res = await fetch(`${API_BASE}/api/v1/booker/all`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const json = await res.json();
    const bookings = json.data || [];

    if (!bookings.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-8 text-center text-pine/40">No bookings yet.</td></tr>`;
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
        <td class="px-5 py-3">${b.user ? b.user.name : '—'}</td>
        <td class="px-5 py-3">${b.provider ? b.provider.name : '—'}</td>
        <td class="px-5 py-3">${b.service ? b.service.name : '—'}</td>
        <td class="px-5 py-3 font-mono text-xs">${new Date(b.date).toLocaleDateString()}</td>
        <td class="px-5 py-3 font-mono text-xs">${b.time}</td>
        <td class="px-5 py-3"><span class="text-xs font-semibold px-2 py-1 rounded-full ${statusColor[b.status] || ''}">${b.status}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-8 text-center text-crimson">Failed to load bookings.</td></tr>`;
  }
}

loadProviders();
loadServices();
loadBookings();
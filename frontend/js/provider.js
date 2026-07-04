// ── Config ────────────────────────────────────────────────────────────────
// Confirm this matches wherever your Express server actually runs / is mounted.
const API_BASE = 'http://localhost:8000';

// ── Visual mapping (display-only, doesn't affect data) ─────────────────────
// Provider.providerType enum: hospital, clinic, electrician, plumber, ambulance, other
const PROVIDER_THEME = {
  hospital:    { icon: '🏥', bar: 'bg-gradient-to-r from-crimson to-teal-600', seal: 'border-crimson/70 text-crimson' },
  clinic:      { icon: '🩺', bar: 'bg-teal-600',   seal: 'border-teal-700/70 text-teal-700' },
  electrician: { icon: '⚡', bar: 'bg-marigold',   seal: 'border-marigold-dark/70 text-marigold-dark' },
  plumber:     { icon: '🔧', bar: 'bg-blue-700',   seal: 'border-blue-700/70 text-blue-700' },
  ambulance:   { icon: '🚑', bar: 'bg-crimson',    seal: 'border-crimson/70 text-crimson' },
  other:       { icon: '🛠️', bar: 'bg-pine',       seal: 'border-pine/70 text-pine' },
};

function themeFor(providerType) {
  return PROVIDER_THEME[providerType] || PROVIDER_THEME.other;
}

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

// ── Build one provider card ─────────────────────────────────────────────
// `provider` fields come directly from your Provider schema.
// `serviceCount` comes from counting Service docs whose `.provider` === provider._id.
function providerCard(provider, serviceCount) {
  const theme = themeFor(provider.providerType);

  const sealBlock = provider.verified ? `
    <div class="absolute top-4 right-4 seal w-14 h-14 rounded-full border-2 ${theme.seal} flex flex-col items-center justify-center font-mono text-[0.5rem] leading-tight tracking-wider bg-white/90">
      <span>VERIFIED</span><i class="fa-solid fa-check text-[0.7rem] mt-0.5"></i>
    </div>` : '';

  return `
    <div class="card-lift relative bg-white rounded-2xl border border-pine/10 shadow-sm overflow-hidden cursor-pointer"
         onclick="window.location.href='services.html?provider=${provider._id}'">
      ${sealBlock}
      <div class="h-1.5 ${theme.bar}"></div>
      <div class="p-6 pb-4">
        <div class="w-14 h-14 rounded-xl bg-pine-pale border border-pine/10 flex items-center justify-center text-2xl mb-4">${theme.icon}</div>
        <h3 class="font-display font-semibold text-xl text-pine mb-1">${provider.name}</h3>
        <p class="font-mono text-xs text-pine/50 mb-3">${provider.providerType.toUpperCase()}</p>
        <div class="flex items-center gap-1 text-marigold-dark text-sm mb-3">
          ${starsHTML(provider.rating)}
          <span class="text-[#12261d]/50 text-xs font-mono ml-1">${(provider.rating ?? 0)} (${provider.reviews ?? 0})</span>
        </div>
        <div class="space-y-1.5 text-sm text-[#12261d]/70">
          <div class="flex items-center gap-2"><i class="fa-solid fa-location-dot w-4 text-pine/50"></i> ${provider.location}</div>
          <div class="flex items-center gap-2 font-mono text-xs"><i class="fa-solid fa-phone w-4 text-pine/50"></i> ${provider.phone}</div>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-pine/10 flex justify-between items-center">
        <span class="text-xs text-pine/50 font-mono">${serviceCount} service${serviceCount === 1 ? '' : 's'}</span>
        <span class="text-sm font-semibold text-pine flex items-center gap-1.5">View services <i class="fa-solid fa-arrow-right text-xs"></i></span>
      </div>
    </div>
  `;
}

// ── Load & render ─────────────────────────────────────────────────────────
async function loadProviders() {
  const grid = document.getElementById('providers-grid');

  try {
    // getProviders (GET /api/providers) — no query params, so it returns everyone.
    const providersRes = await fetch(`${API_BASE}/api/v1/providers`);
    if (!providersRes.ok) throw new Error('Failed to fetch providers');
    const providers = await providersRes.json();

    // getServices (GET /api/services) — used only to count services per provider.
    const servicesRes = await fetch(`${API_BASE}/api/v1/services`);
    if (!servicesRes.ok) throw new Error('Failed to fetch services');
    const services = await servicesRes.json();

    if (!providers.length) {
      grid.innerHTML = `<p class="col-span-full text-center text-pine/50 font-mono text-sm py-10">No providers found.</p>`;
      return;
    }

    // Count services per provider ID. getServices populates `provider` as an
    // object ({ _id, name, ... }), so we read `.provider._id`.
    const countByProvider = {};
    services.forEach(s => {
      const pid = s.provider && s.provider._id ? s.provider._id : s.provider;
      countByProvider[pid] = (countByProvider[pid] || 0) + 1;
    });

    grid.innerHTML = providers
      .map(p => providerCard(p, countByProvider[p._id] || 0))
      .join('');

  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="col-span-full text-center text-crimson font-mono text-sm py-10">Couldn't load providers. Please try again later.</p>`;
  }
}

loadProviders();
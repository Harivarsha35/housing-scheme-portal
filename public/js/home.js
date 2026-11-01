/* home.js */
const schemeIcons = {
  'pmay-urban': { bg: '#E3F2FD', color: '#1565C0', icon: 'fas fa-city' },
  'pmay-gramin': { bg: '#E8F5E9', color: '#2E7D32', icon: 'fas fa-home' },
  'sc-st':  { bg: '#FFF3E0', color: '#FF6F00', icon: 'fas fa-shield-alt' },
  'senior': { bg: '#FCE4EC', color: '#C2185B', icon: 'fas fa-user-friends' }
};

async function loadSchemesPreview() {
  const grid = document.getElementById('schemesPreview');
  if (!grid) return;
  try {
    const res = await fetch('/api/schemes');
    const data = await res.json();
    grid.innerHTML = data.schemes.map((s, i) => {
      const si = schemeIcons[s.id] || { bg: '#E3F2FD', color: '#1565C0', icon: 'fas fa-home' };
      return `
      <div class="col-sm-6 col-lg-3">
        <div class="scheme-card-item h-100 ${i === 1 ? 'featured' : ''}">
          ${i === 1 ? '<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-3">Most Popular</span>' : ''}
          <div class="scheme-card-icon" style="background:${si.bg};color:${si.color}">
            <i class="${si.icon}"></i>
          </div>
          <h5 class="fw-bold mb-1">${s.name}</h5>
          <p class="text-muted small flex-grow-1">${s.description}</p>
          <div class="d-flex flex-wrap gap-1 mb-3">
            ${s.category.map(c => `<span class="badge bg-light text-secondary fw-normal">${c}</span>`).join('')}
            <span class="badge bg-light text-secondary fw-normal">${s.area}</span>
          </div>
          <div class="d-flex gap-2">
            <a href="/schemes#${s.id}" class="btn btn-sm btn-outline-primary rounded-pill">Learn More</a>
            <a href="/apply?scheme=${s.id}" class="btn btn-sm btn-primary rounded-pill">Apply</a>
          </div>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    grid.innerHTML = '<div class="col-12 text-center text-muted">Unable to load schemes.</div>';
  }
}

loadSchemesPreview();

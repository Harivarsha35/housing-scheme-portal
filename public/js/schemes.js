/* schemes.js */
const schemeIcons = {
  'pmay-urban':  { bg: '#E3F2FD', color: '#1565C0', icon: 'fas fa-city' },
  'pmay-gramin': { bg: '#E8F5E9', color: '#2E7D32', icon: 'fas fa-home' },
  'sc-st':       { bg: '#FFF3E0', color: '#FF6F00', icon: 'fas fa-shield-alt' },
  'senior':      { bg: '#FCE4EC', color: '#C2185B', icon: 'fas fa-user-friends' }
};

let allSchemes = [];

async function loadSchemes() {
  const container = document.getElementById('schemesContainer');
  try {
    const res = await fetch('/api/schemes');
    const data = await res.json();
    allSchemes = data.schemes;
    renderSchemes(allSchemes);

    // Scroll to hash
    if (window.location.hash) {
      setTimeout(() => {
        const el = document.getElementById(window.location.hash.slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  } catch {
    container.innerHTML = '<div class="col-12"><div class="alert alert-danger">Unable to load schemes. Please try again.</div></div>';
  }
}

function renderSchemes(schemes) {
  const container = document.getElementById('schemesContainer');
  container.innerHTML = schemes.map(s => {
    const si = schemeIcons[s.id] || { bg: '#E3F2FD', color: '#1565C0', icon: 'fas fa-home' };
    return `
    <div class="col-md-6 col-lg-6" id="${s.id}">
      <div class="card border-0 shadow-sm rounded-4 h-100 scheme-detail-card" style="transition: all 0.25s ease;">
        <div class="card-body p-3 p-md-3.5 d-flex flex-column justify-content-between">
          <div>
            <!-- Header Row -->
            <div class="d-flex align-items-center gap-2.5 mb-2.5">
              <div class="scheme-card-icon flex-shrink-0 d-flex align-items-center justify-content-center" 
                   style="width:44px; height:44px; border-radius:12px; background:${si.bg}; color:${si.color}">
                <i class="${si.icon} fs-5"></i>
              </div>
              <div class="flex-grow-1">
                <div class="d-flex align-items-center justify-content-between gap-2">
                  <h5 class="fw-bold mb-0 text-dark" style="font-size: 1.05rem; letter-spacing: -0.2px;">${s.name}</h5>
                  <span class="badge px-2 py-1 rounded-pill" style="background:${si.bg}; color:${si.color}; font-size: 0.72rem; font-weight: 600;">
                    ${s.area}
                  </span>
                </div>
              </div>
            </div>

            <!-- Quick Key Metrics Grid -->
            <div class="row g-2 mb-3 text-center">
              <div class="col-4">
                <div class="bg-light rounded-3 py-1.5 px-1 border border-light-subtle h-100 d-flex flex-column justify-content-center">
                  <div class="text-muted text-uppercase fw-semibold mb-0.5" style="font-size:0.65rem; letter-spacing:0.5px;">Subsidy</div>
                  <div class="fw-bold text-dark" style="font-size: 0.85rem;">${s.subsidy}</div>
                </div>
              </div>
              <div class="col-4">
                <div class="bg-light rounded-3 py-1.5 px-1 border border-light-subtle h-100 d-flex flex-column justify-content-center">
                  <div class="text-muted text-uppercase fw-semibold mb-0.5" style="font-size:0.65rem; letter-spacing:0.5px;">Area</div>
                  <div class="fw-bold text-dark" style="font-size: 0.85rem;">${s.area}</div>
                </div>
              </div>
              <div class="col-4">
                <div class="bg-light rounded-3 py-1.5 px-1 border border-light-subtle h-100 d-flex flex-column justify-content-center">
                  <div class="text-muted text-uppercase fw-semibold mb-0.5" style="font-size:0.65rem; letter-spacing:0.5px;">Income Limit</div>
                  <div class="fw-bold text-dark" style="font-size: 0.85rem;">${s.minIncome ? 'Above ₹' + (s.minIncome/100000).toFixed(0) + 'L' : (s.maxIncome ? 'Up to ₹' + (s.maxIncome/100000) + 'L' : 'No Limit')}</div>
                </div>
              </div>
            </div>

            <!-- Eligible Groups with badges -->
            <div class="mb-2.5">
              <span class="fw-bold text-dark d-block mb-1" style="font-size: 0.78rem; letter-spacing: 0.2px;">
                <i class="fas fa-user-check text-success me-1.5"></i>Eligible Groups:
              </span>
              <div class="d-flex flex-wrap gap-1.5 mb-1">
                ${s.category.map(c => `
                  <span class="badge bg-success-subtle text-success border border-success-subtle fw-semibold px-2 py-1 rounded-pill" style="font-size: 0.72rem;">
                    ${c}
                  </span>
                `).join('')}
              </div>
            </div>

            <!-- Key Rules -->
            <div class="mb-3">
              <span class="fw-bold text-dark d-block mb-1" style="font-size: 0.78rem; letter-spacing: 0.2px;">
                <i class="fas fa-clipboard-list text-primary me-1.5"></i>Key Requirements:
              </span>
              <ul class="list-unstyled mb-0 ps-0">
                ${s.eligibility.slice(0, 2).map(e => `
                  <li class="small text-muted mb-1 d-flex align-items-start gap-1.5" style="font-size: 0.78rem; line-height: 1.4;">
                    <i class="fas fa-check-circle text-success mt-1" style="font-size: 0.72rem;"></i>
                    <span>${e}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>

          <!-- Bottom Trust Badge -->
          <div class="d-flex align-items-center justify-content-between pt-2.5 border-top mt-1">
            <span class="text-muted small" style="font-size: 0.74rem;">
              <i class="fas fa-shield-alt text-success me-1"></i>Govt. Verified Scheme
            </span>
            <span class="badge bg-success-subtle text-success px-2 py-1 rounded-pill" style="font-size: 0.72rem;">
              <i class="fas fa-check me-1"></i>Active
            </span>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    const filter = this.dataset.filter;
    const filtered = filter === 'all' ? allSchemes : allSchemes.filter(s => s.area.includes(filter));
    renderSchemes(filtered);
  });
});

loadSchemes();

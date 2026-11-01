/* admin.js */
let allApplications = [];
let filteredApps = [];
let currentAppPage = 1;
const appsPerPage = 10;
let appDetailModalInstance = null;
let statusModalInstance = null;

// ── Toggle Password Visibility ────────────────────────────────────
function togglePass(id) {
  const input = document.getElementById(id);
  if (!input) return;
  const icon = input.parentElement.querySelector('button i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
  } else {
    input.type = 'password';
    if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
  }
}

// ── Officer Tabs ──────────────────────────────────────────────────
function switchOfficerTab(tab) {
  const alertEl = document.getElementById('adminLoginAlert');
  alertEl.classList.add('d-none');

  const btnLogin = document.getElementById('btnTabOfficerLogin');
  const btnReg = document.getElementById('btnTabOfficerReg');
  const loginForm = document.getElementById('officerLoginForm');
  const regForm = document.getElementById('officerRegisterForm');

  if (tab === 'login') {
    btnLogin.style.background = '#1565C0';
    btnLogin.style.color = '#fff';
    btnLogin.classList.remove('text-muted');

    btnReg.style.background = 'transparent';
    btnReg.style.color = '';
    btnReg.classList.add('text-muted');

    loginForm.classList.remove('d-none');
    regForm.classList.add('d-none');
  } else {
    btnReg.style.background = '#2E7D32';
    btnReg.style.color = '#fff';
    btnReg.classList.remove('text-muted');

    btnLogin.style.background = 'transparent';
    btnLogin.style.color = '';
    btnLogin.classList.add('text-muted');

    regForm.classList.remove('d-none');
    loginForm.classList.add('d-none');
  }
}

// ── Officer Register ─────────────────────────────────────────────
async function adminRegister() {
  const name        = document.getElementById('officerName').value.trim();
  const email       = document.getElementById('officerEmail').value.trim();
  const phone       = document.getElementById('officerPhone')?.value.trim() || '';
  const designation = document.getElementById('officerDesignation')?.value.trim() || '';
  const department  = document.getElementById('officerDepartment')?.value.trim() || 'Housing Scheme Cell';
  const password    = document.getElementById('officerPassword').value;
  const alertEl     = document.getElementById('adminLoginAlert');

  if (!name || !email || !password) {
    alertEl.className = 'alert alert-warning';
    alertEl.textContent = 'Please fill in Name, Email, and Password.';
    alertEl.classList.remove('d-none');
    return;
  }

  const btn = document.getElementById('btnOfficerRegister');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registering...';

  try {
    const res = await fetch('/api/admin/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, designation, department, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('officer_logged_in', 'true');
      updateOfficerBadge(name, designation);
      document.documentElement.classList.add('officer-authenticated');
      alertEl.className = 'alert alert-success';
      alertEl.textContent = 'Officer account created! Entering portal...';
      alertEl.classList.remove('d-none');
      setTimeout(() => {
        document.getElementById('adminLoginOverlay').style.display = 'none';
        document.getElementById('adminDashboard').classList.remove('d-none');
        checkOfficerSession();
      }, 1000);
    } else {
      alertEl.className = 'alert alert-danger';
      alertEl.textContent = data.message || 'Registration failed.';
      alertEl.classList.remove('d-none');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-shield me-2"></i>Register Officer Account';
    }
  } catch {
    alertEl.className = 'alert alert-danger';
    alertEl.textContent = 'Could not connect to server.';
    alertEl.classList.remove('d-none');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-shield me-2"></i>Register Officer Account';
  }
}

// ── Admin Login ──────────────────────────────────────────────────
async function adminLogin() {
  const email = document.getElementById('adminEmail').value.trim();
  const pass  = document.getElementById('adminPass').value;
  const alertEl = document.getElementById('adminLoginAlert');

  if (!email || !pass) {
    alertEl.className = 'alert alert-warning';
    alertEl.textContent = 'Please enter your email and password.';
    alertEl.classList.remove('d-none');
    return;
  }

  const btn = document.getElementById('btnOfficerLogin');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';

  try {
    const res  = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('officer_logged_in', 'true');
      if (data.officer?.name) {
        updateOfficerBadge(data.officer.name, data.officer.role);
      }
      document.documentElement.classList.add('officer-authenticated');
      document.getElementById('adminLoginOverlay').style.display = 'none';
      document.getElementById('adminDashboard').classList.remove('d-none');
      checkOfficerSession();
    } else {
      alertEl.className = 'alert alert-danger';
      alertEl.textContent = data.message || 'Invalid email or password.';
      alertEl.classList.remove('d-none');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Login to Officer Panel';
    }
  } catch {
    alertEl.className = 'alert alert-danger';
    alertEl.textContent = 'Connection error. Make sure the server is running.';
    alertEl.classList.remove('d-none');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Login to Officer Panel';
  }
}

// ── Logout ────────────────────────────────────────────────────────
function adminLogout() {
  localStorage.removeItem('officer_logged_in');
  sessionStorage.removeItem('admin_active_section');
  document.documentElement.classList.remove('officer-authenticated');
  fetch('/api/admin/logout', { method: 'POST' }).finally(() => { 
    window.location.href = '/'; 
  });
}

function toggleSidebar() {
  document.getElementById('adminSidebar').classList.toggle('d-none');
}

// ── Officer Badge Display ─────────────────────────────────────────
function updateOfficerBadge(name) {
  if (!name) return;
  const cleanName = name.trim();
  const nameEl = document.getElementById('officerNameDisplay');
  const avatarEl = document.getElementById('officerAvatar');

  if (nameEl) nameEl.textContent = cleanName;
  if (avatarEl) {
    const parts = cleanName.replace(/^(Officer|Mr|Mrs|Ms|Dr)\.?\s+/i, '').split(' ').filter(Boolean);
    const initials = parts.length >= 2 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : (cleanName.slice(0, 2) || 'OF').toUpperCase();
    avatarEl.textContent = initials;
  }
  localStorage.setItem('officer_name', cleanName);
}

// ── Check Session on Load ─────────────────────────────────────────
async function checkOfficerSession() {
  const overlay = document.getElementById('adminLoginOverlay');
  const dashboard = document.getElementById('adminDashboard');
  const isLoggedIn = localStorage.getItem('officer_logged_in') === 'true';

  const savedName = localStorage.getItem('officer_name') || 'Rahul';
  updateOfficerBadge(savedName);

  if (isLoggedIn) {
    overlay.style.display = 'none';
    dashboard.classList.remove('d-none');
    const savedSection = sessionStorage.getItem('admin_active_section') || 'overview';
    showSection(savedSection);
    await initDashboard();
  } else {
    overlay.style.display = 'flex';
    dashboard.classList.add('d-none');
  }

  try {
    const res = await fetch('/api/admin/me');
    const data = await res.json();
    if (data.success && data.officer) {
      localStorage.setItem('officer_logged_in', 'true');
      overlay.style.display = 'none';
      dashboard.classList.remove('d-none');
      if (data.officer?.name) {
        updateOfficerBadge(data.officer.name);
      }
      if (!isLoggedIn) {
        const savedSection = sessionStorage.getItem('admin_active_section') || 'overview';
        showSection(savedSection);
        await initDashboard();
      }
    } else {
      localStorage.removeItem('officer_logged_in');
      overlay.style.display = 'flex';
      dashboard.classList.add('d-none');
    }
  } catch (err) {
    if (!isLoggedIn) {
      overlay.style.display = 'flex';
      dashboard.classList.add('d-none');
    }
  }
}

// ── Init Dashboard ───────────────────────────────────────────────
async function initDashboard() {
  await loadStats();
  await loadApplications();
  await loadBeneficiaries();
  await loadAdminSchemes();
}

// ── Stats ────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const res  = await fetch('/api/admin/stats');
    const data = await res.json();
    const s = data.stats;
    if (document.getElementById('stat_total'))    document.getElementById('stat_total').textContent    = s.total.toLocaleString('en-IN');
    if (document.getElementById('stat_submitted'))document.getElementById('stat_submitted').textContent = s.submitted.toLocaleString('en-IN');
    if (document.getElementById('stat_review'))   document.getElementById('stat_review').textContent   = s.under_review.toLocaleString('en-IN');
    if (document.getElementById('stat_approved')) document.getElementById('stat_approved').textContent = s.approved.toLocaleString('en-IN');
    if (document.getElementById('stat_rejected')) document.getElementById('stat_rejected').textContent = s.rejected.toLocaleString('en-IN');
    buildStatusChart(s);
  } catch (e) { console.error('Stats error:', e); }
}

// ── Status Bar Chart ─────────────────────────────────────────────
function buildStatusChart(s) {
  const bars = [
    { label: 'Submitted',    val: s.submitted,    color: '#FF6F00', cls: 'bar-submitted' },
    { label: 'Under Review', val: s.under_review,  color: '#0277BD', cls: 'bar-review' },
    { label: 'Approved',     val: s.approved,     color: '#2E7D32', cls: 'bar-approved' },
    { label: 'Rejected',     val: s.rejected,     color: '#C62828', cls: 'bar-rejected' },
    { label: 'Disbursed',    val: s.disbursed,    color: '#006064', cls: 'bar-disbursed' }
  ];
  const max = Math.max(...bars.map(b => b.val), 1);
  document.getElementById('statusBarChart').innerHTML = bars.map(b => `
    <div class="bar-item" title="${b.label}: ${b.val}">
      <div class="bar-val">${b.val.toLocaleString('en-IN')}</div>
      <div class="bar" style="background:${b.color};height:${Math.max(8, Math.round((b.val/max)*120))}px"></div>
      <div class="bar-label">${b.label}</div>
    </div>`).join('');

  // Scheme donut (static demo)
  document.getElementById('schemeDonutChart').innerHTML = `
    <div class="d-flex flex-column gap-2">
      ${[
        ['PMAY-Urban', '#1565C0', 40],
        ['PMAY-Gramin', '#2E7D32', 35],
        ['SC/ST Housing', '#FF6F00', 15],
        ['Senior Citizen', '#C2185B', 10]
      ].map(([name,color,pct]) => `
        <div>
          <div class="d-flex justify-content-between small mb-1">
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}" class="me-2"></span>${name}</span>
            <strong>${pct}%</strong>
          </div>
          <div class="progress" style="height:8px">
            <div class="progress-bar" style="width:${pct}%;background:${color}"></div>
          </div>
        </div>`).join('')}
    </div>`;
}

// ── Applications ─────────────────────────────────────────────────
async function loadApplications() {
  try {
    const res  = await fetch('/api/applications');
    const data = await res.json();
    allApplications = data.applications;
    filteredApps = [...allApplications];
    renderRecentTable(allApplications.slice(0, 5));
    renderAllAppsTable();
  } catch (e) { console.error(e); }
}

function renderRecentTable(apps) {
  const tbody = document.getElementById('recentTableBody');
  if (!apps.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No applications yet.</td></tr>'; return; }
  tbody.innerHTML = apps.map(a => `
    <tr>
      <td class="ps-4 fw-semibold text-primary small">${a.applicationId}</td>
      <td class="small">${a.applicantName}</td>
      <td class="small">${a.schemeName}</td>
      <td>${statusBadge(a.status)}</td>
      <td class="small text-muted">${fmtDate(a.submittedAt)}</td>
    </tr>`).join('');
}

function filterApplications() {
  const search = document.getElementById('appSearchInput')?.value.toLowerCase() || '';
  const status = document.getElementById('statusFilterSelect')?.value || '';
  const scheme = document.getElementById('schemeFilterSelect')?.value || '';

  filteredApps = allApplications.filter(a => {
    const matchSearch = !search || a.applicantName?.toLowerCase().includes(search) || a.applicationId?.toLowerCase().includes(search) || a.email?.toLowerCase().includes(search);
    const matchStatus = !status || a.status === status;
    const matchScheme = !scheme || a.schemeName === scheme;
    return matchSearch && matchStatus && matchScheme;
  });
  currentAppPage = 1;
  renderAllAppsTable();
}

function renderAllAppsTable() {
  const tbody = document.getElementById('allAppsTableBody');
  if (!tbody) return;
  const start = (currentAppPage - 1) * appsPerPage;
  const pageApps = filteredApps.slice(start, start + appsPerPage);

  if (!filteredApps.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No applications found.</td></tr>';
    document.getElementById('appsPagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = pageApps.map((a, idx) => `
    <tr>
      <td class="ps-4 text-muted small">${start + idx + 1}</td>
      <td class="fw-semibold text-primary small">${a.applicationId}</td>
      <td class="small">${a.applicantName}<div class="text-muted" style="font-size:0.75rem">${a.email}</div></td>
      <td class="small">${a.schemeName}</td>
      <td class="small">₹${a.annualIncome ? parseInt(a.annualIncome).toLocaleString('en-IN') : '—'}</td>
      <td class="small">${a.address?.state || '—'}</td>
      <td>${statusBadge(a.status)}</td>
      <td class="small text-muted">${fmtDate(a.submittedAt)}</td>
      <td>
        <div class="d-flex gap-1 flex-wrap">
          <button class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size:0.75rem" onclick="viewApplication('${a._id}')"><i class="fas fa-eye"></i></button>
          ${a.status !== 'approved' && a.status !== 'disbursed' ? `<button class="btn btn-sm btn-outline-success py-0 px-2" style="font-size:0.75rem" onclick="openStatusModal('${a._id}','${a.status}')"><i class="fas fa-edit"></i></button>` : ''}
        </div>
      </td>
    </tr>`).join('');

  // Pagination
  const totalPages = Math.ceil(filteredApps.length / appsPerPage);
  document.getElementById('appsPagination').innerHTML = totalPages <= 1 ? '' : `
    <div class="d-flex justify-content-between align-items-center">
      <small class="text-muted">Showing ${start + 1}–${Math.min(start + appsPerPage, filteredApps.length)} of ${filteredApps.length}</small>
      <div class="d-flex gap-1">
        <button class="btn btn-sm btn-outline-secondary ${currentAppPage <= 1 ? 'disabled' : ''}" onclick="changePage(${currentAppPage-1})"><i class="fas fa-chevron-left"></i></button>
        ${Array.from({length:totalPages},(_,i) => `<button class="btn btn-sm ${currentAppPage===i+1?'btn-primary':'btn-outline-secondary'}" onclick="changePage(${i+1})">${i+1}</button>`).join('')}
        <button class="btn btn-sm btn-outline-secondary ${currentAppPage >= totalPages ? 'disabled' : ''}" onclick="changePage(${currentAppPage+1})"><i class="fas fa-chevron-right"></i></button>
      </div>
    </div>`;
}

function changePage(p) { currentAppPage = p; renderAllAppsTable(); }

// ── View Application Modal ────────────────────────────────────────
function viewApplication(id) {
  const app = allApplications.find(a => a._id === id || a._id.toString() === id);
  if (!app) return;
  document.getElementById('modalAppId').textContent = app.applicationId;
  document.getElementById('modalBody').innerHTML = `
    <div class="row g-3 mb-3">
      <div class="col-sm-6"><small class="text-muted">Applicant Name</small><div class="fw-semibold">${app.applicantName}</div></div>
      <div class="col-sm-6"><small class="text-muted">Aadhaar</small><div class="fw-semibold">${app.aadhaar || '—'}</div></div>
      <div class="col-sm-6"><small class="text-muted">Email</small><div class="fw-semibold">${app.email}</div></div>
      <div class="col-sm-6"><small class="text-muted">Phone</small><div class="fw-semibold">${app.phone}</div></div>
      <div class="col-sm-6"><small class="text-muted">Scheme</small><div class="fw-semibold">${app.schemeName}</div></div>
      <div class="col-sm-6"><small class="text-muted">Status</small><div>${statusBadge(app.status)}</div></div>
      <div class="col-sm-6"><small class="text-muted">Annual Income</small><div class="fw-semibold">₹${app.annualIncome ? parseInt(app.annualIncome).toLocaleString('en-IN') : '—'}</div></div>
      <div class="col-sm-6"><small class="text-muted">Category</small><div class="fw-semibold">${app.category || '—'}</div></div>
      <div class="col-12"><small class="text-muted">Address</small><div class="fw-semibold">${[app.address?.street,app.address?.city,app.address?.district,app.address?.state,app.address?.pincode].filter(Boolean).join(', ') || '—'}</div></div>
      <div class="col-sm-6"><small class="text-muted">Submitted On</small><div class="fw-semibold">${fmtDate(app.submittedAt)}</div></div>
      <div class="col-sm-6"><small class="text-muted">Bank Account</small><div class="fw-semibold">${app.bankAccount || '—'}</div></div>
    </div>
    <h6 class="fw-bold mb-2"><i class="fas fa-file-alt me-1 text-primary"></i>Uploaded Documents</h6>
    ${app.documents && app.documents.length > 0 ? `
      <div class="row g-2 mb-3">
        ${app.documents.map(doc => {
          const ext = (doc.originalName || doc.fileName || '').split('.').pop().toLowerCase();
          const isImage = ['jpg','jpeg','png','gif','webp','bmp'].includes(ext);
          const isPdf = ext === 'pdf';
          const icon = isImage ? 'fa-image text-success' : isPdf ? 'fa-file-pdf text-danger' : 'fa-file text-secondary';
          const fileUrl = '/uploads/' + doc.fileName;
          return `
            <div class="col-sm-6">
              <div class="card border rounded-3 p-2">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <i class="fas ${icon} fs-5"></i>
                  <div class="flex-grow-1 overflow-hidden">
                    <div class="fw-semibold small text-truncate" title="${doc.originalName || doc.fieldName}">${doc.originalName || doc.fieldName}</div>
                    <div class="text-muted" style="font-size:0.7rem">${doc.fieldName ? doc.fieldName.replace(/([A-Z])/g,' $1').replace(/_/g,' ').trim() : 'Document'}</div>
                  </div>
                </div>
                ${isImage ? `<img src="${fileUrl}" class="img-fluid rounded-2 mb-2" style="max-height:200px;object-fit:cover;width:100%;cursor:pointer" onclick="window.open('${fileUrl}','_blank')" alt="${doc.originalName}">` : ''}
                <div class="d-flex gap-2">
                  <a href="${fileUrl}" target="_blank" class="btn btn-sm btn-outline-primary flex-grow-1"><i class="fas fa-eye me-1"></i>View</a>
                  <a href="${fileUrl}" download="${doc.originalName || doc.fileName}" class="btn btn-sm btn-outline-secondary flex-grow-1"><i class="fas fa-download me-1"></i>Download</a>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>
    ` : '<div class="alert alert-light small py-2 mb-3"><i class="fas fa-info-circle me-1 text-muted"></i>No documents uploaded by applicant.</div>'}`;

  document.getElementById('modalActions').innerHTML = `
    <button class="btn btn-outline-primary btn-sm" onclick="openStatusModal('${app._id}','${app.status}')">
      <i class="fas fa-edit me-1"></i>Update Status
    </button>`;

  if (!appDetailModalInstance) {
    appDetailModalInstance = new bootstrap.Modal(document.getElementById('appDetailModal'));
  }
  appDetailModalInstance.show();
}

// ── Status Modal ─────────────────────────────────────────────────
function openStatusModal(id, currentStatus) {
  // Close the app detail modal first to prevent stacking issues
  if (appDetailModalInstance) {
    appDetailModalInstance.hide();
  }
  document.getElementById('statusModalAppId').value = id;
  document.getElementById('newStatusSelect').value = currentStatus === 'submitted' ? 'under_review' : currentStatus;
  document.getElementById('statusRemarks').value = '';
  // Small delay to let the first modal fully close before opening the second
  setTimeout(() => {
    if (!statusModalInstance) {
      statusModalInstance = new bootstrap.Modal(document.getElementById('statusModal'));
    }
    statusModalInstance.show();
  }, 300);
}

async function updateStatus() {
  const id      = document.getElementById('statusModalAppId').value;
  const status  = document.getElementById('newStatusSelect').value;
  const remarks = document.getElementById('statusRemarks').value;
  try {
    const res  = await fetch(`/api/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, remarks })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Status updated successfully!', 'success');
      statusModalInstance?.hide();
      await loadApplications();
      await loadStats();
      await loadBeneficiaries();
    } else showToast(data.message, 'danger');
  } catch { showToast('Error updating status.', 'danger'); }
}

// ── Beneficiaries (Sanction & Subsidy Register) ──────────────────
const schemeSubsidyMap = {
  'PM Housing Scheme – Urban': 267280,
  'PM Housing Scheme – Rural': 125000,
  'SC / ST Special Housing Grant': 150000,
  'Senior Citizen Affordable Housing': 200000
};

let constructionModalInstance = null;
let activeConstAppId = null;

async function loadBeneficiaries() {
  const tbody = document.getElementById('beneficiariesBody');
  if (!tbody) return;
  const approved = allApplications.filter(a => a.status === 'approved' || a.status === 'disbursed');

  if (!approved.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No approved beneficiaries yet.</td></tr>';
    return;
  }

  tbody.innerHTML = approved.map((a, idx) => {
    const amount = schemeSubsidyMap[a.schemeName] || 150000;
    const maskedAadhaar = a.aadhaar && a.aadhaar.length >= 4 
      ? `XXXX-XXXX-${a.aadhaar.slice(-4)}` 
      : 'XXXX-XXXX-••••';
    const isCompleted = a.status === 'disbursed';
    const isOverdue = a.constructionOverdue === true;

    return `
      <tr>
        <td class="ps-4 text-muted small">${idx + 1}</td>
        <td class="fw-semibold text-primary small">${a.applicationId}</td>
        <td class="small">
          <div class="fw-bold">${a.applicantName}</div>
          <div class="text-muted" style="font-size:0.75rem"><i class="fas fa-id-card me-1"></i>${maskedAadhaar}</div>
          ${isOverdue ? `<span class="badge bg-danger text-white mt-1" style="font-size:0.68rem"><i class="fas fa-exclamation-triangle me-1"></i>Delayed / Notice Issued</span>` : ''}
        </td>
        <td class="small">
          <span class="badge bg-light text-dark border">${a.schemeName}</span>
        </td>
        <td class="small">
          <span class="fw-bold text-success">₹${amount.toLocaleString('en-IN')}</span>
          <div class="text-muted" style="font-size:0.72rem">Sanctioned Grant</div>
        </td>
        <td class="small">
          <div><i class="fas fa-university text-muted me-1"></i>${a.bankAccount || 'N/A'}</div>
          <div class="text-muted" style="font-size:0.72rem">IFSC: ${a.ifscCode || 'N/A'}</div>
        </td>
        <td>
          <div class="small">
            ${isCompleted ? `
              <span class="badge bg-success text-white px-2 py-1"><i class="fas fa-home me-1"></i>100% Completed</span>
              <div class="text-muted" style="font-size:0.72rem">All 4 Installments Paid</div>
            ` : `
              <div class="d-flex align-items-center gap-1 mb-1">
                <span class="badge bg-warning-subtle text-dark border" style="font-size:0.72rem">Phased Payouts Active</span>
              </div>
              <div class="progress" style="height:6px;width:120px">
                <div class="progress-bar bg-success" style="width:25%" title="Stage 1: Foundation (Paid)"></div>
                <div class="progress-bar bg-warning" style="width:40%" title="Stage 2: Lintel (Pending)"></div>
              </div>
              <div class="text-muted mt-1" style="font-size:0.7rem">Linked to Field Inspections</div>
            `}
          </div>
        </td>
        <td class="text-end pe-4">
          <div class="d-flex justify-content-end gap-1">
            <button class="btn btn-sm btn-primary py-1 px-2.5 fw-semibold shadow-sm" style="font-size:0.78rem" onclick="openConstructionModal('${a._id}')">
              <i class="fas fa-hard-hat me-1"></i>Inspect & Release
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ── Construction Modal Logic ──────────────────────────────────────
async function openConstructionModal(id) {
  activeConstAppId = id;
  const modalEl = document.getElementById('constructionModal');
  if (!constructionModalInstance) {
    constructionModalInstance = new bootstrap.Modal(modalEl);
  }
  document.getElementById('constModalBody').innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary"></div>
      <p class="text-muted small mt-2">Loading field inspection milestones...</p>
    </div>`;
  constructionModalInstance.show();

  try {
    const res = await fetch(`/api/applications/${id}/construction`);
    const data = await res.json();
    if (!data.success) {
      document.getElementById('constModalBody').innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
      return;
    }
    renderConstructionModal(data.application, data.stages, data.overdue);
  } catch (err) {
    document.getElementById('constModalBody').innerHTML = `<div class="alert alert-danger">Error loading construction details.</div>`;
  }
}

function renderConstructionModal(app, stages, isOverdue) {
  const totalSanctioned = schemeSubsidyMap[app.schemeName] || 250000;
  const disbursedTotal = stages.filter(s => s.status === 'disbursed').reduce((sum, s) => sum + (s.amount || 0), 0);
  const pendingTotal = totalSanctioned - disbursedTotal;

  document.getElementById('constModalTitle').innerHTML = `
    <i class="fas fa-hard-hat text-warning me-2"></i>Construction Verification · ${app.applicationId}`;
  document.getElementById('constModalSubtitle').textContent = `Beneficiary: ${app.applicantName} | Scheme: ${app.schemeName}`;

  const flagContainer = document.getElementById('flagOverdueBtnContainer');
  if (flagContainer) {
    if (isOverdue) {
      flagContainer.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-danger text-white py-1.5 px-2.5" style="font-size:0.78rem">
            <i class="fas fa-exclamation-triangle me-1"></i>Delayed Notice Active
          </span>
          <button type="button" class="btn btn-outline-success btn-sm fw-semibold shadow-sm" onclick="clearConstructionDelay()">
            <i class="fas fa-check-circle me-1"></i>Clear Delay / Revoke Notice
          </button>
        </div>
      `;
    } else {
      flagContainer.innerHTML = `
        <button type="button" class="btn btn-outline-danger btn-sm fw-semibold shadow-sm" id="btnFlagOverdue" onclick="openDelayNoticeModal()">
          <i class="fas fa-exclamation-triangle me-1"></i>Flag Overdue / Issue Warning
        </button>
      `;
    }
  }

  document.getElementById('constModalBody').innerHTML = `
    ${isOverdue ? `
      <div class="alert alert-danger d-flex align-items-center gap-3 mb-4 rounded-3 shadow-sm border-danger">
        <i class="fas fa-exclamation-triangle fs-3 text-danger flex-shrink-0"></i>
        <div>
          <h6 class="fw-bold mb-1 text-danger">⚠️ Construction Overdue Notice Issued</h6>
          <p class="small mb-0 text-dark">This beneficiary received initial groundwork funds, but physical construction has stalled. Next installment releases are temporarily locked until field inspection confirms active progress.</p>
        </div>
      </div>
    ` : ''}

    <!-- Financial summary banner -->
    <div class="card border bg-light rounded-3 p-3 mb-4">
      <div class="row g-2 text-center">
        <div class="col-sm-4 border-end">
          <small class="text-muted d-block">Total Sanctioned</small>
          <strong class="text-dark fs-5">₹${totalSanctioned.toLocaleString('en-IN')}</strong>
        </div>
        <div class="col-sm-4 border-end">
          <small class="text-muted d-block">Released so far</small>
          <strong class="text-success fs-5">₹${disbursedTotal.toLocaleString('en-IN')}</strong>
        </div>
        <div class="col-sm-4">
          <small class="text-muted d-block">Pending Milestones</small>
          <strong class="text-primary fs-5">₹${pendingTotal.toLocaleString('en-IN')}</strong>
        </div>
      </div>
    </div>

    <h6 class="fw-bold mb-3"><i class="fas fa-list-check me-2 text-primary"></i>Phased Construction Milestones & Field Verification</h6>

    <div class="d-flex flex-column gap-3">
      ${stages.map((stage, idx) => {
        const isDisbursed = stage.status === 'disbursed';
        const isPendingVerify = stage.status === 'pending_verification';
        const isLocked = stage.status === 'locked';
        const photoUrl = stage.photo ? `/uploads/${stage.photo}` : null;
        const dueDateObj = stage.dueDate ? new Date(stage.dueDate) : null;
        const now = new Date();
        const diffDays = dueDateObj ? Math.round((dueDateObj - now) / 86400000) : null;
        const isPastDue = diffDays !== null && diffDays < 0 && !isDisbursed;

        return `
          <div class="card border rounded-3 p-3 shadow-sm ${isDisbursed ? 'border-success-subtle bg-white' : isPastDue ? 'border-danger bg-danger-subtle bg-opacity-10' : isPendingVerify ? 'border-warning bg-light' : 'opacity-75'}">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-2 pb-2 border-bottom">
              <div>
                <span class="badge ${isDisbursed ? 'bg-success' : isPendingVerify ? 'bg-warning text-dark' : 'bg-secondary'} me-2">
                  Stage ${idx + 1}
                </span>
                <strong class="text-dark">${stage.stageName}</strong>
                <span class="text-muted ms-1 small">(${stage.installmentPct}%)</span>
                <div class="d-flex align-items-center gap-2 flex-wrap mt-1">
                  ${stage.targetDays ? `<span class="badge bg-light text-secondary border" style="font-size:0.7rem"><i class="fas fa-stopwatch me-1 text-primary"></i>Limit: ${stage.targetDays} Days</span>` : ''}
                  ${isDisbursed ? `
                    <span class="badge bg-success-subtle text-success border border-success-subtle" style="font-size:0.7rem">
                      <i class="fas fa-calendar-check me-1"></i>Completed: ${fmtDate(stage.disbursedAt)}
                    </span>
                  ` : dueDateObj ? `
                    <span class="badge ${isPastDue ? 'bg-danger text-white' : 'bg-warning-subtle text-dark border border-warning'}" style="font-size:0.7rem">
                      <i class="fas ${isPastDue ? 'fa-exclamation-triangle' : 'fa-calendar-alt'} me-1"></i>
                      Target Deadline: <strong>${fmtDate(dueDateObj)}</strong>${isPastDue ? ` (${Math.abs(diffDays)}d overdue)` : ''}
                    </span>
                  ` : ''}
                </div>
              </div>
              <div class="text-md-end">
                <span class="fs-6 fw-bold text-success me-2">₹${stage.amount?.toLocaleString('en-IN')}</span>
                ${isDisbursed 
                  ? `<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="fas fa-check-circle me-1"></i>Grant Disbursed</span>`
                  : isPendingVerify 
                  ? `<span class="badge bg-warning text-dark"><i class="fas fa-camera me-1"></i>Ready for Field Verification</span>`
                  : `<span class="badge bg-secondary-subtle text-secondary"><i class="fas fa-lock me-1"></i>Locked</span>`}
              </div>
            </div>

            <div class="row g-3 align-items-center">
              <div class="col-md-7">
                <p class="small text-muted mb-2">
                  <i class="fas fa-info-circle me-1 text-primary"></i>${stage.officerRemarks || 'Inspection verification required before release.'}
                </p>
                ${isDisbursed && stage.disbursedAt ? `
                  <div class="small text-success">
                    <i class="fas fa-receipt me-1"></i>Direct Benefit Transfer (DBT) transferred on <strong>${fmtDate(stage.disbursedAt)}</strong> to A/C: <strong>${app.bankAccount || 'Linked Bank'}</strong>.
                  </div>
                ` : ''}
                ${stage.geoTag?.latitude ? `
                  <div class="small text-muted mt-1" style="font-size:0.75rem">
                    <i class="fas fa-map-marker-alt text-danger me-1"></i><strong>Geo-Tag Stamp:</strong> Lat: ${stage.geoTag.latitude}, Long: ${stage.geoTag.longitude} · ${fmtDate(stage.uploadedAt || stage.geoTag.timestamp)}
                  </div>
                ` : ''}
              </div>

              <div class="col-md-5 text-md-end">
                ${photoUrl ? `
                  <div class="mb-2 d-inline-block text-center border p-1 rounded bg-white shadow-sm">
                    <img src="${photoUrl}" class="rounded" style="height:85px;width:125px;object-fit:cover;cursor:pointer" onclick="window.open('${photoUrl}','_blank')" title="Click to view full photo"/>
                    <div class="text-muted mt-1" style="font-size:0.68rem"><i class="fas fa-search-plus me-1 text-primary"></i>Site Photo (Click to Zoom)</div>
                  </div>
                ` : isPendingVerify ? `
                  <div class="p-2 border rounded bg-white text-muted small text-center mb-2" style="font-size:0.75rem">
                    <i class="fas fa-exclamation-circle text-warning me-1"></i>No site photo uploaded yet by citizen.
                  </div>
                ` : ''}

                <div class="d-flex flex-wrap justify-content-md-end align-items-center mt-2" style="gap: 10px;">
                  ${isPendingVerify ? `
                    <button class="btn btn-sm btn-success fw-bold px-3 py-1.5 shadow-sm" onclick="verifyMilestone('${app._id}','${stage.stageKey}',${stage.amount}, ${!!photoUrl})" title="Verify and release installment">
                      <i class="fas fa-check-double me-1"></i>Approve & Disburse ₹${stage.amount?.toLocaleString('en-IN')}
                    </button>
                    ${photoUrl ? `
                      <button class="btn btn-sm btn-outline-danger fw-semibold py-1.5 px-2.5" onclick="rejectMilestonePhoto('${app._id}','${stage.stageKey}')" title="Reject photo and request re-upload">
                        <i class="fas fa-times me-1"></i>Reject Photo
                      </button>
                    ` : ''}
                    <label class="btn btn-sm btn-outline-primary py-1.5 px-2.5" style="cursor:pointer" title="Take or upload field photo directly">
                      <i class="fas fa-camera me-1"></i>Upload Field Photo
                      <input type="file" accept="image/*" class="d-none" onchange="handleOfficerPhotoUpload(this, '${app._id}', '${stage.stageKey}')">
                    </label>
                  ` : isLocked ? `
                    <small class="text-muted fst-italic me-2"><i class="fas fa-lock me-1"></i>Awaiting previous stage completion</small>
                  ` : `
                    <span class="text-success small fw-semibold me-2"><i class="fas fa-shield-alt me-1"></i>Verified & Settled</span>
                  `}
                  <button class="btn btn-sm btn-outline-secondary fw-semibold py-1.5 px-2.5 shadow-sm" onclick="openStageStatusModal('${app._id}','${stage.stageKey}','${stage.status}',${idx+1},'${(stage.stageName||'').replace(/'/g, "\\'")}', '${(stage.officerRemarks||'').replace(/'/g, "\\'")}', '${stage.dueDate || ''}')" title="Update status and date limit for Stage ${idx+1}">
                    <i class="fas fa-edit me-1 text-primary"></i>Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

async function verifyMilestone(id, stageKey, amount, hasPhoto = true) {
  if (!hasPhoto) {
    const proceed = confirm(`⚠️ Warning: No live site photo has been uploaded for this stage yet.\n\nAre you sure you want to verify and release ₹${amount.toLocaleString('en-IN')} without seeing a site photo?`);
    if (!proceed) return;
  }

  const remarks = prompt(`Enter verification inspection notes for releasing ₹${amount.toLocaleString('en-IN')}:`, 'Physical site inspection verified. Construction milestone complete.');
  if (remarks === null) return;

  try {
    showToast('Processing verification & disbursement...', 'info');
    const res = await fetch(`/api/applications/${id}/verify-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageKey, remarks })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      await loadApplications();
      await loadStats();
      await loadBeneficiaries();
      openConstructionModal(id);
    } else {
      showToast(data.message || 'Verification failed.', 'danger');
    }
  } catch (err) {
    showToast('Network error during verification.', 'danger');
  }
}

async function rejectMilestonePhoto(id, stageKey) {
  const reason = prompt('Enter rejection remark (the citizen will see this and be requested to re-upload):', 'Physical construction does not meet stage completion standards. Please re-upload a clear geo-tagged photo.');
  if (reason === null) return;

  try {
    showToast('Submitting stage rejection...', 'info');
    const res = await fetch(`/api/applications/${id}/reject-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageKey, reason })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'warning');
      await loadApplications();
      await loadStats();
      await loadBeneficiaries();
      openConstructionModal(id);
    } else {
      showToast(data.message || 'Rejection failed.', 'danger');
    }
  } catch (err) {
    showToast('Network error during rejection.', 'danger');
  }
}

async function handleOfficerPhotoUpload(inputEl, id, stageKey) {
  if (!inputEl.files || !inputEl.files[0]) return;
  const file = inputEl.files[0];
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('stageKey', stageKey);
  formData.append('latitude', '11.0168° N');
  formData.append('longitude', '76.9558° E');
  formData.append('remarks', 'Field inspection photo taken on-site by verification officer.');

  try {
    showToast('Uploading & geo-tagging field inspection photo...', 'info');
    const res = await fetch(`/api/applications/${id}/upload-stage-photo`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      showToast('Field inspection photo uploaded successfully!', 'success');
      openConstructionModal(id);
    } else {
      showToast(data.message || 'Photo upload failed.', 'danger');
    }
  } catch (err) {
    showToast('Error uploading field inspection photo.', 'danger');
  }
}

let delayNoticeModalInstance = null;

function openDelayNoticeModal() {
  if (!activeConstAppId) return;
  const modalEl = document.getElementById('delayNoticeModal');
  if (!delayNoticeModalInstance) {
    delayNoticeModalInstance = new bootstrap.Modal(modalEl);
  }
  delayNoticeModalInstance.show();
}

async function submitDelayNotice() {
  if (!activeConstAppId) return;
  const remarks = document.getElementById('delayNoticeRemarks').value.trim();
  const btn = document.getElementById('btnSubmitDelayNotice');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Issuing...';
  }

  try {
    const res = await fetch(`/api/applications/${activeConstAppId}/flag-delay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks })
    });
    const data = await res.json();
    if (data.success) {
      showToast('⚠️ Beneficiary flagged for Construction Delay / Non-Compliance.', 'warning');
      delayNoticeModalInstance?.hide();
      await openConstructionModal(activeConstAppId);
      await loadApplications();
      await loadBeneficiaries();
    } else {
      showToast(data.message || 'Failed to flag delay.', 'danger');
    }
  } catch (err) {
    showToast('Network error while issuing notice.', 'danger');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Issue Warning Notice';
    }
  }
}

async function clearConstructionDelay() {
  if (!activeConstAppId) return;
  const proceed = confirm('Are you sure you want to revoke the construction delay notice for this beneficiary?');
  if (!proceed) return;

  try {
    const res = await fetch(`/api/applications/${activeConstAppId}/clear-delay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks: 'Field verification approved. Delay warning notice officially revoked.' })
    });
    const data = await res.json();
    if (data.success) {
      showToast('✅ Overdue notice cleared. Project marked as compliant.', 'success');
      await openConstructionModal(activeConstAppId);
      await loadApplications();
      await loadBeneficiaries();
    } else {
      showToast(data.message || 'Failed to clear delay.', 'danger');
    }
  } catch (err) {
    showToast('Network error while clearing delay.', 'danger');
  }
}

// Backward compatibility
function flagConstructionDelay() {
  openDelayNoticeModal();
}

async function disburseBeneficiary(id) {
  openConstructionModal(id);
}

// ── Stage Status Update Modal ─────────────────────────────────────
let stageStatusModalInstance = null;

function openStageStatusModal(appId, stageKey, currentStatus, stageNum, stageName, remarks, dueDateStr) {
  document.getElementById('stageStatusAppId').value = appId;
  document.getElementById('stageStatusKey').value = stageKey;
  document.getElementById('stageStatusModalTitle').innerHTML = `<i class="fas fa-edit text-primary me-2"></i>Update Stage ${stageNum} Status`;
  document.getElementById('stageStatusModalSubtitle').textContent = stageName || '';
  document.getElementById('stageStatusSelect').value = currentStatus || 'pending_verification';
  document.getElementById('stageStatusRemarks').value = (remarks && remarks !== 'null') ? remarks : '';

  const dateInput = document.getElementById('stageStatusDueDate');
  if (dateInput) {
    if (dueDateStr && dueDateStr !== 'null') {
      const d = new Date(dueDateStr);
      if (!isNaN(d.getTime())) {
        dateInput.value = d.toISOString().split('T')[0];
      } else {
        dateInput.value = '';
      }
    } else {
      dateInput.value = '';
    }
  }

  const modalEl = document.getElementById('stageStatusModal');
  if (!stageStatusModalInstance) {
    stageStatusModalInstance = new bootstrap.Modal(modalEl);
  }
  stageStatusModalInstance.show();
}

async function submitStageStatusUpdate() {
  const appId = document.getElementById('stageStatusAppId').value;
  const stageKey = document.getElementById('stageStatusKey').value;
  const status = document.getElementById('stageStatusSelect').value;
  const remarks = document.getElementById('stageStatusRemarks').value.trim();
  const dueDate = document.getElementById('stageStatusDueDate')?.value || null;

  const btn = document.getElementById('btnSaveStageStatus');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';
  }

  try {
    const res = await fetch(`/api/applications/${appId}/stage-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageKey, status, remarks, dueDate })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Stage status updated successfully!', 'success');
      stageStatusModalInstance?.hide();
      await openConstructionModal(appId);
      await loadApplications();
      await loadStats();
      await loadBeneficiaries();
    } else {
      showToast(data.message || 'Failed to update stage status.', 'danger');
    }
  } catch (err) {
    showToast('Network error while updating stage status.', 'danger');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save me-1"></i>Save Status';
    }
  }
}

// ── Admin Schemes ────────────────────────────────────────────────
async function loadAdminSchemes() {
  const grid = document.getElementById('adminSchemesGrid');
  if (!grid) return;
  try {
    const res  = await fetch('/api/schemes');
    const data = await res.json();
    grid.innerHTML = data.schemes.map(s => `
      <div class="col-md-6">
        <div class="card border-0 shadow-sm rounded-4">
          <div class="card-body p-4">
            <h5 class="fw-bold mb-1">${s.name}</h5>
            <p class="text-muted small mb-2">${s.description}</p>
            <div class="d-flex gap-2 flex-wrap mb-3">
              ${s.category.map(c => `<span class="badge bg-primary-subtle text-primary">${c}</span>`).join('')}
              <span class="badge bg-secondary-subtle text-secondary">${s.area}</span>
            </div>
            <div class="d-flex justify-content-between small text-muted">
              <span><i class="fas fa-tag me-1"></i>Subsidy: <strong>${s.subsidy}</strong></span>
              <span class="badge bg-success-subtle text-success">Active</span>
            </div>
          </div>
        </div>
      </div>`).join('');
  } catch { }
}

// ── Section Navigation ────────────────────────────────────────────
function showSection(name) {
  sessionStorage.setItem('admin_active_section', name);
  document.querySelectorAll('.admin-section').forEach(s => s.classList.add('d-none'));
  document.getElementById('section_' + name)?.classList.remove('d-none');
  document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.admin-nav-link[onclick*="'${name}'"]`);
  if (activeLink) activeLink.classList.add('active');
  const titles = { overview:'Dashboard Overview', applications:'All Applications', beneficiaries:'Beneficiaries', schemes:'Housing Schemes' };
  document.getElementById('sectionTitle').textContent = titles[name] || name;
  if (name === 'applications') renderAllAppsTable();
  if (name === 'beneficiaries') loadBeneficiaries();
}

// Check session immediately on script load
document.addEventListener('DOMContentLoaded', checkOfficerSession);

/* main.js – Shared utilities */

// Apply citizen-authenticated class instantly to hide officer portal without flash
if (localStorage.getItem('citizen_logged_in') === 'true') {
  document.documentElement.classList.add('citizen-authenticated');
}

// Animate counter numbers
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = Math.floor(current).toLocaleString('en-IN');
  }, 16);
}

// Intersection Observer for counters
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); counterObserver.unobserve(e.target); } });
}, { threshold: 0.5 });
document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

// Check auth state
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
  } catch { }
  return null;
}

// Update nav based on auth
async function updateNav() {
  const navArea = document.getElementById('navAuthArea');
  
  // Instant visual check from localStorage to prevent flash
  const isCitizenLoggedIn = localStorage.getItem('citizen_logged_in') === 'true';
  if (isCitizenLoggedIn) {
    document.querySelectorAll('#navOfficerPortal, a[href="/admin"]').forEach(el => {
      const li = el.closest('li');
      if (li) li.classList.add('d-none');
      else el.classList.add('d-none');
    });
  }

  const user = await checkAuth();
  if (user && user.role !== 'admin') {
    localStorage.setItem('citizen_logged_in', 'true');
    document.documentElement.classList.add('citizen-authenticated');
    // Once citizen is logged in, hide Officer Portal
    document.querySelectorAll('#navOfficerPortal, a[href="/admin"]').forEach(el => {
      const li = el.closest('li');
      if (li) li.classList.add('d-none');
      else el.classList.add('d-none');
    });

    if (navArea) {
      const initial = (user.name && user.name[0]) ? user.name[0].toUpperCase() : 'U';
      navArea.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <a href="/dashboard" class="btn btn-outline-success btn-sm rounded-pill px-3 py-1.5 fw-semibold text-decoration-none shadow-sm" style="border: 1.5px solid #2E7D32; color: #2E7D32;">
            <i class="fas fa-folder me-1 text-success"></i>My Applications
          </a>
          <div style="width:34px;height:34px;border-radius:50%;background:#237827;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:0.95rem" title="${user.email}">${initial}</div>
          <span class="fw-bold small text-dark">${user.name}</span>
          <button class="btn btn-outline-danger btn-sm rounded-pill px-3 py-1.5 fw-semibold" onclick="logout()">
            <i class="fas fa-sign-out-alt me-1"></i>Logout
          </button>
        </div>`;
    }
  } else if (!user) {
    localStorage.removeItem('citizen_logged_in');
    document.documentElement.classList.remove('citizen-authenticated');
    document.querySelectorAll('#navOfficerPortal, a[href="/admin"]').forEach(el => {
      const li = el.closest('li');
      if (li) li.classList.remove('d-none');
      else el.classList.remove('d-none');
    });
  }
}

async function logout() {
  localStorage.removeItem('citizen_logged_in');
  document.documentElement.classList.remove('citizen-authenticated');
  const citizenNav = document.getElementById('citizenNavLinks');
  if (citizenNav) citizenNav.style.display = 'none';
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/';
}

// Toast notification
function showToast(message, type = 'success') {
  const toastId = 'toast_' + Date.now();
  const colors = { success: 'bg-success', danger: 'bg-danger', warning: 'bg-warning text-dark', info: 'bg-info text-dark' };
  const html = `<div id="${toastId}" class="toast align-items-center ${colors[type]} border-0 text-white" role="alert">
    <div class="d-flex"><div class="toast-body fw-semibold">${message}</div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`;
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = 9999;
    document.body.appendChild(container);
  }
  container.insertAdjacentHTML('beforeend', html);
  const toastEl = new bootstrap.Toast(document.getElementById(toastId), { delay: 3500 });
  toastEl.show();
}

// Format date
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Status badge HTML
function statusBadge(status) {
  const map = {
    submitted:    ['pill-submitted',    'Submitted'],
    under_review: ['pill-under_review', 'Under Review'],
    approved:     ['pill-approved',     'Approved'],
    rejected:     ['pill-rejected',     'Rejected'],
    disbursed:    ['pill-disbursed',    'Disbursed']
  };
  const [cls, label] = map[status] || ['bg-secondary text-white', status];
  return `<span class="status-pill ${cls}">${label}</span>`;
}

updateNav();

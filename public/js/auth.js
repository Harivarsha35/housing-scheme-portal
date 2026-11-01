/* auth.js – Login & Register logic */

// ── Tab Switcher ──────────────────────────────────────────────────
function switchTab(tab) {
  // Update tab buttons
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');

  // Show / hide forms
  document.getElementById('loginForm').classList.toggle('active', tab === 'login');
  document.getElementById('registerForm').classList.toggle('active', tab === 'register');

  // Clear alert
  hideAlert();
}

// ── Show / Hide Alert ─────────────────────────────────────────────
function showAlert(msg, type = 'danger') {
  const el = document.getElementById('authAlert');
  const icon = type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle';
  el.className = `alert alert-${type} d-flex align-items-start gap-2 mb-3`;
  el.innerHTML = `<i class="fas fa-${icon} mt-1 flex-shrink-0"></i><span>${msg}</span>`;
  el.classList.remove('d-none');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert() {
  const el = document.getElementById('authAlert');
  el.classList.add('d-none');
  el.innerHTML = '';
}

// ── Toggle Password Visibility ────────────────────────────────────
function togglePass(id) {
  const input = document.getElementById(id);
  const icon  = input.nextElementSibling?.querySelector('i') || input.parentElement.querySelector('.fa-eye, .fa-eye-slash');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
  } else {
    input.type = 'password';
    if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
  }
}

// ── Login ─────────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  hideAlert();

  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  // Basic validation
  if (!email) { showAlert('Please enter your email address.', 'warning'); return; }
  if (!password) { showAlert('Please enter your password.', 'warning'); return; }

  const btn     = document.getElementById('loginBtn');
  const btnText = document.getElementById('loginBtnText');
  const spinner = document.getElementById('loginSpinner');

  // Loading state
  btn.disabled = true;
  btnText.classList.add('d-none');
  spinner.classList.remove('d-none');

  try {
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
      if (data.user?.role !== 'admin') {
        localStorage.setItem('citizen_logged_in', 'true');
      }
      showAlert('✅ Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = data.user?.role === 'admin' ? '/admin' : '/';
      }, 1000);
    } else {
      showAlert(data.message || 'Invalid email or password. Please try again.');
      btn.disabled = false;
      btnText.classList.remove('d-none');
      spinner.classList.add('d-none');
    }
  } catch (err) {
    showAlert('⚠️ Could not connect to server. Please check your connection and try again.');
    btn.disabled = false;
    btnText.classList.remove('d-none');
    spinner.classList.add('d-none');
  }
}

// ── Register ──────────────────────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  hideAlert();

  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  // Validations
  if (!name)  { showAlert('Please enter your full name.', 'warning'); return; }
  if (!email) { showAlert('Please enter a valid email address.', 'warning'); return; }
  if (password.length < 6) { showAlert('Password must be at least 6 characters long.', 'warning'); return; }

  const btn     = document.getElementById('regBtn');
  const btnText = document.getElementById('regBtnText');
  const spinner = document.getElementById('regSpinner');

  // Loading state
  btn.disabled = true;
  btnText.classList.add('d-none');
  spinner.classList.remove('d-none');

  try {
    const res  = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem('citizen_logged_in', 'true');
      showAlert('✅ Account created successfully! Redirecting to home...', 'success');
      setTimeout(() => { window.location.href = '/'; }, 1200);
    } else {
      showAlert(data.message || 'Registration failed. Please try again.');
      btn.disabled = false;
      btnText.classList.remove('d-none');
      spinner.classList.add('d-none');
    }
  } catch (err) {
    showAlert('⚠️ Could not connect to server. Please check your connection and try again.');
    btn.disabled = false;
    btnText.classList.remove('d-none');
    spinner.classList.add('d-none');
  }
}

// ── Init ──────────────────────────────────────────────────────────
// Show login tab by default
switchTab('login');

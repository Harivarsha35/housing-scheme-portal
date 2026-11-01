/* apply.js */
let currentFormStep = 1;
const totalFormSteps = 6;
let selectedScheme = null;
const formData = {};

// Load scheme cards
async function loadSchemeCards() {
  const grid = document.getElementById('schemeSelectGrid');
  try {
    const res = await fetch('/api/schemes');
    const data = await res.json();
    const schemeIcons = {
      'pmay-urban': { bg: '#E3F2FD', color: '#1565C0', icon: 'fas fa-city' },
      'pmay-gramin': { bg: '#E8F5E9', color: '#2E7D32', icon: 'fas fa-home' },
      'sc-st': { bg: '#FFF3E0', color: '#FF6F00', icon: 'fas fa-shield-alt' },
      'senior': { bg: '#FCE4EC', color: '#C2185B', icon: 'fas fa-user-friends' }
    };

    // Pre-select from URL
    const urlScheme = new URLSearchParams(window.location.search).get('scheme');

    grid.innerHTML = data.schemes.map(s => {
      const si = schemeIcons[s.id] || { bg: '#E3F2FD', color: '#1565C0', icon: 'fas fa-home' };
      const preSelected = urlScheme === s.id;
      if (preSelected) { selectedScheme = s; }
      return `
      <div class="col-md-6">
        <div class="scheme-select-card h-100 ${preSelected ? 'selected' : ''}" onclick="selectScheme('${s.id}', this)" data-scheme-id="${s.id}">
          <div class="d-flex align-items-center gap-3">
            <div style="width:50px;height:50px;border-radius:12px;background:${si.bg};color:${si.color};display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0">
              <i class="${si.icon}"></i>
            </div>
            <div>
              <strong class="d-block">${s.name}</strong>
              <small class="text-muted">${s.subsidy} subsidy · ${s.area}</small>
            </div>
            <div class="ms-auto">
              <i class="fas fa-check-circle text-primary fs-4 ${preSelected ? '' : 'd-none'}" id="chk_${s.id}"></i>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
  } catch {
    grid.innerHTML = '<div class="col-12"><div class="alert alert-danger">Unable to load schemes.</div></div>';
  }
}

let allSchemes = [];
async function fetchAllSchemes() {
  const res = await fetch('/api/schemes');
  const data = await res.json();
  allSchemes = data.schemes;
}

function selectScheme(id, el) {
  document.querySelectorAll('.scheme-select-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('[id^="chk_"]').forEach(i => i.classList.add('d-none'));
  el.classList.add('selected');
  document.getElementById('chk_' + id).classList.remove('d-none');
  selectedScheme = allSchemes.find(s => s.id === id);
  document.getElementById('formNextBtn').disabled = false;
}

function nextFormStep() {
  if (currentFormStep === 1 && !selectedScheme) {
    showToast('Please select a housing scheme to continue.', 'warning');
    return;
  }
  if (currentFormStep >= 2 && currentFormStep <= 5) {
    if (!validateCurrentStep()) return;
  }
  if (currentFormStep === totalFormSteps) {
    submitApplication();
    return;
  }
  if (currentFormStep === 5) {
    buildReview();
  }
  currentFormStep++;
  showFormStep(currentFormStep);
}

function prevFormStep() {
  if (currentFormStep > 1) {
    currentFormStep--;
    showFormStep(currentFormStep);
  }
}

function showFormStep(step) {
  document.querySelectorAll('.form-step').forEach(el => el.classList.add('d-none'));
  document.querySelector(`.form-step[data-step="${step}"]`)?.classList.remove('d-none');

  // Sidebar
  document.querySelectorAll('.apply-nav-item').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active','done');
    if (s === step) el.classList.add('active');
    else if (s < step) el.classList.add('done');
    const num = el.querySelector('.nav-step-num');
    if (s < step) num.innerHTML = '<i class="fas fa-check text-white" style="font-size:0.7rem"></i>';
    else num.textContent = s;
  });

  const nextBtn = document.getElementById('formNextBtn');
  const prevBtn = document.getElementById('formPrevBtn');
  prevBtn.style.setProperty('display', step > 1 ? 'inline-flex' : 'none', 'important');

  if (step === totalFormSteps) {
    nextBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Submit Application';
    nextBtn.classList.replace('btn-primary','btn-success');
  } else {
    nextBtn.innerHTML = 'Next Step <i class="fas fa-arrow-right ms-2"></i>';
    nextBtn.classList.replace('btn-success','btn-primary');
  }
}

// Allow jumping back to any previously visited step by clicking the sidebar step item
function goToStep(step) {
  // If moving forward past current step, validate steps in between
  if (step > currentFormStep) {
    if (currentFormStep === 1 && !selectedScheme) {
      showToast('Please select a housing scheme first.', 'warning');
      return;
    }
    if (!validateCurrentStep()) return;
  }
  if (step === totalFormSteps) {
    buildReview();
  }
  currentFormStep = step;
  showFormStep(currentFormStep);
  window.scrollTo({ top: 120, behavior: 'smooth' });
}

function validateCurrentStep() {
  const step = document.querySelector(`.form-step[data-step="${currentFormStep}"]`);
  if (!step) return true;
  const requiredFields = step.querySelectorAll('[required]');
  let valid = true;
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      field.classList.add('is-invalid');
      valid = false;
    } else {
      field.classList.remove('is-invalid');
    }
  });
  if (!valid) showToast('Please fill in all required fields.', 'warning');
  return valid;
}

function buildReview() {
  const form = document.getElementById('applicationForm');
  const fd = new FormData(form);
  const review = document.getElementById('reviewContent');
  const sections = [
    {
      title: 'Scheme Selection',
      step: 1,
      rows: [
        ['Selected Scheme', selectedScheme?.name || '—']
      ]
    },
    {
      title: 'Personal Information',
      step: 2,
      rows: [
        ['Full Name', fd.get('fullName')],
        ['Aadhaar Number', fd.get('aadhaar')],
        ['Email', fd.get('email')],
        ['Phone', fd.get('phone')],
        ['Date of Birth', fd.get('dob')],
        ['Gender', fd.get('gender')],
        ['Category', fd.get('category')]
      ]
    },
    {
      title: 'Address Details',
      step: 3,
      rows: [
        ['Address', [fd.get('street'), fd.get('city'), fd.get('district'), fd.get('state'), fd.get('pincode')].filter(Boolean).join(', ')]
      ]
    },
    {
      title: 'Financial Information',
      step: 4,
      rows: [
        ['Annual Income', fd.get('annualIncome') ? '₹' + parseInt(fd.get('annualIncome')).toLocaleString('en-IN') : '—'],
        ['Bank Account', fd.get('bankAccount')],
        ['IFSC Code', fd.get('ifscCode')]
      ]
    },
    {
      title: 'Uploaded Documents',
      step: 5,
      rows: [
        ['Aadhaar Document', document.getElementById('aadhaarDoc')?.files[0]?.name || 'Uploaded'],
        ['Income Certificate', document.getElementById('incomeDoc')?.files[0]?.name || 'Uploaded'],
        ['Passport Photo', document.getElementById('photoDoc')?.files[0]?.name || 'Uploaded']
      ]
    }
  ];

  review.innerHTML = sections.map(sec => `
    <div class="card border rounded-3 mb-3">
      <div class="card-header bg-light d-flex justify-content-between align-items-center py-2 px-3 border-bottom">
        <strong class="small text-dark mb-0">${sec.title}</strong>
        <button type="button" class="btn btn-sm btn-link text-decoration-none p-0 fw-semibold" onclick="goToStep(${sec.step})">
          <i class="fas fa-edit me-1"></i>Edit
        </button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive mb-0">
          <table class="table table-sm table-borderless mb-0">
            <tbody>
              ${sec.rows.map(r => `
                <tr class="border-bottom">
                  <td class="fw-semibold small text-muted px-3 py-2" style="width:38%">${r[0]}</td>
                  <td class="small px-3 py-2 text-dark">${r[1] || '—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`).join('');
}

async function submitApplication() {
  const decl = document.getElementById('declaration');
  if (!decl.checked) {
    showToast('Please accept the declaration to submit.', 'warning');
    return;
  }
  const submitBtn = document.getElementById('formNextBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';

  const form = document.getElementById('applicationForm');
  const fd = new FormData(form);
  fd.append('schemeId', selectedScheme.id);
  fd.append('schemeName', selectedScheme.name);

  try {
    const res = await fetch('/api/applications', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) {
      document.querySelectorAll('.form-step').forEach(el => el.classList.add('d-none'));
      document.getElementById('formNavBtns').style.display = 'none';
      const successScreen = document.getElementById('successScreen');
      successScreen.classList.remove('d-none');
      document.getElementById('submittedAppId').textContent = data.applicationId;
      document.querySelectorAll('.apply-nav-item').forEach(el => {
        el.classList.remove('active'); el.classList.add('done');
        el.querySelector('.nav-step-num').innerHTML = '<i class="fas fa-check text-white" style="font-size:0.7rem"></i>';
      });
    } else {
      showToast(data.message || 'Submission failed. Please try again.', 'danger');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Submit Application';
    }
  } catch {
    showToast('Network error. Please try again.', 'danger');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Submit Application';
  }
}

function triggerUpload(inputId) {
  document.getElementById(inputId).click();
}

function showFileName(input) {
  const prev = document.getElementById('prev_' + input.id);
  if (input.files.length > 0) {
    prev.classList.remove('d-none');
    prev.innerHTML = `<i class="fas fa-file-check text-success"></i><span>${input.files[0].name}</span>
      <button class="btn btn-sm text-danger ms-auto py-0" onclick="clearFile('${input.id}')"><i class="fas fa-times"></i></button>`;
  }
}

function clearFile(inputId) {
  document.getElementById(inputId).value = '';
  const prev = document.getElementById('prev_' + inputId);
  prev.classList.add('d-none');
  prev.innerHTML = '';
}

// Auto-fill details answered in Check Eligibility
function prefillFromEligibility() {
  const raw = sessionStorage.getItem('housing_eligibility_answers');
  if (!raw) return;
  try {
    const answers = JSON.parse(raw);
    const form = document.getElementById('applicationForm');
    if (!form) return;

    // 1. Social Category
    if (answers.category) {
      const catSelect = form.querySelector('[name="category"]');
      if (catSelect && answers.category) {
        catSelect.value = answers.category;
      }
    }

    // 2. Area Type
    if (answers.area) {
      const areaSelect = form.querySelector('[name="areaType"]');
      if (areaSelect) {
        areaSelect.value = answers.area;
      }
    }

    // 3. Annual Income
    if (answers.income) {
      const incomeInput = form.querySelector('[name="annualIncome"]');
      if (incomeInput && !incomeInput.value) {
        const incomeDefaults = {
          below3: 200000,
          '3to6': 450000,
          '6to12': 800000,
          above12: 1400000
        };
        if (incomeDefaults[answers.income]) {
          incomeInput.value = incomeDefaults[answers.income];
        }
      }
    }
  } catch (e) {
    console.error('Failed to prefill eligibility answers:', e);
  }
}

// Auto-fill logged in citizen account details
async function prefillUserData() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return;
    const data = await res.json();
    const user = data.user;
    if (!user) return;

    const form = document.getElementById('applicationForm');
    if (!form) return;

    if (user.name) {
      const nameInp = form.querySelector('[name="fullName"]');
      if (nameInp && !nameInp.value) nameInp.value = user.name;
    }
    if (user.email) {
      const emailInp = form.querySelector('[name="email"]');
      if (emailInp) {
        emailInp.value = user.email;
        emailInp.readOnly = true;
        emailInp.classList.add('bg-light');
      }
    }
    if (user.phone) {
      const phoneInp = form.querySelector('[name="phone"]');
      if (phoneInp && !phoneInp.value) phoneInp.value = user.phone;
    }
    if (user.aadhaar) {
      const aadhaarInp = form.querySelector('[name="aadhaar"]');
      if (aadhaarInp && !aadhaarInp.value) aadhaarInp.value = user.aadhaar;
    }
    if (user.gender) {
      const genderInp = form.querySelector('[name="gender"]');
      if (genderInp && !genderInp.value) genderInp.value = user.gender;
    }
    if (user.category) {
      const catInp = form.querySelector('[name="category"]');
      if (catInp && !catInp.value) catInp.value = user.category;
    }
    if (user.address) {
      ['street','city','district','state','pincode'].forEach(field => {
        const inp = form.querySelector(`[name="${field}"]`);
        if (inp && !inp.value && user.address[field]) inp.value = user.address[field];
      });
    }
  } catch (e) {
    console.error('Failed to prefill user data:', e);
  }
}

// Eligibility Enforcement Guard
function checkEligibilityRequirement() {
  const isVerified = sessionStorage.getItem('housing_eligibility_verified');
  const gate = document.getElementById('eligibilityGate');
  const mainArea = document.getElementById('mainApplyArea');
  
  if (!isVerified || isVerified !== 'true') {
    if (gate && mainArea) {
      gate.classList.remove('d-none');
      mainArea.classList.add('d-none');
    }
    return false;
  } else {
    if (gate && mainArea) {
      gate.classList.add('d-none');
      mainArea.classList.remove('d-none');
    }
    return true;
  }
}

// Init
(async () => {
  const allowed = checkEligibilityRequirement();
  if (allowed) {
    await fetchAllSchemes();
    await loadSchemeCards();
    prefillFromEligibility();
    await prefillUserData();
    showFormStep(1);
  }
})();

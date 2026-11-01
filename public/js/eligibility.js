/* eligibility.js */
let currentStep = 1;
const totalSteps = 5;
const answers = {};

function updateProgress() {
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    const pct = Math.round((currentStep / totalSteps) * 100);
    progressBar.style.width = pct + '%';
  }
}

function showStep(step) {
  document.querySelectorAll('.question-slide').forEach(el => el.classList.add('d-none'));
  const slide = document.querySelector(`.question-slide[data-step="${step}"]`);
  if (slide) slide.classList.remove('d-none');
  document.getElementById('prevBtn').disabled = step <= 1;
  document.getElementById('nextBtn').disabled = !answers['step' + step];
  document.getElementById('stepCount').textContent = answers['step' + step] ? 'Click Next to continue' : 'Click an option to continue';
  updateProgress();
}

// Option selection
document.querySelectorAll('.option-card').forEach(btn => {
  btn.addEventListener('click', function () {
    const key = this.dataset.key;
    const val = this.dataset.val;
    // Deselect others in same step
    const parentSlide = this.closest('.question-slide');
    parentSlide.querySelectorAll('.option-card').forEach(b => b.classList.remove('selected'));
    this.classList.add('selected');
    answers['step' + currentStep] = { key, val };
    document.getElementById('nextBtn').disabled = false;
    document.getElementById('stepCount').textContent = 'Click Next to continue';
  });
});

function nextStep() {
  if (currentStep < totalSteps) {
    currentStep++;
    showStep(currentStep);
  } else {
    showResult();
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
}

function showResult() {
  document.getElementById('questionArea')?.classList.add('d-none');
  document.getElementById('navBtns')?.classList.add('d-none');
  const progressArea = document.getElementById('progressArea');
  if (progressArea) progressArea.classList.add('d-none');
  const resultArea = document.getElementById('resultArea');
  resultArea.classList.remove('d-none');

  const area     = answers['step1']?.val;
  const income   = answers['step2']?.val;
  const category = answers['step3']?.val;
  const house    = answers['step4']?.val;
  const age      = answers['step5']?.val;

  const eligible = [];
  const partial  = [];

  // PMAY Urban
  if ((area === 'urban' || area === 'semi-urban') && house === 'no') {
    if (['6to12','above12'].includes(income)) eligible.push({ id: 'pmay-urban', name: 'PM Housing Scheme – Urban', note: 'Eligible — Income above ₹6 Lakh (MIG Category)' });
    else partial.push({ id: 'pmay-urban', name: 'PM Housing Scheme – Urban', note: 'Partial — Targeted for incomes above ₹6 Lakh' });
  }

  // PMAY Gramin
  if (area === 'rural' && house === 'no' && ['below3','3to6'].includes(income)) {
    eligible.push({ id: 'pmay-gramin', name: 'PM Housing Scheme – Rural', note: 'Eligible — Assistance up to ₹1.30 Lakh' });
  }

  // SC/ST
  if (['sc','st'].includes(category) && house === 'no') {
    if (['below3','3to6','6to12'].includes(income)) eligible.push({ id: 'sc-st', name: 'SC / ST Special Housing Grant', note: 'Eligible — Grant up to ₹1.5 Lakh' });
    else partial.push({ id: 'sc-st', name: 'SC / ST Special Housing Grant', note: 'Partial — Income limit verification' });
  }

  // Senior
  if (age === 'above60' && ['below3','3to6'].includes(income)) {
    eligible.push({ id: 'senior', name: 'Senior Citizen Affordable Housing', note: 'Eligible — Subsidized housing facility' });
  }

  const resultIcon = document.getElementById('resultIcon');
  const resultTitle = document.getElementById('resultTitle');
  const resultDesc = document.getElementById('resultDesc');
  const resultSchemes = document.getElementById('resultSchemes');

  if (eligible.length > 0 || partial.length > 0) {
    // Record eligibility verification in session
    sessionStorage.setItem('housing_eligibility_verified', 'true');
    sessionStorage.setItem('housing_eligible_schemes', JSON.stringify([...eligible, ...partial].map(s => s.id)));
    // Save answers so they auto-populate into the application form
    sessionStorage.setItem('housing_eligibility_answers', JSON.stringify({
      area: area,
      income: income,
      category: category,
      house: house,
      age: age
    }));
  } else {
    sessionStorage.removeItem('housing_eligibility_verified');
    sessionStorage.removeItem('housing_eligible_schemes');
    sessionStorage.removeItem('housing_eligibility_answers');
  }

  if (eligible.length > 0) {
    resultIcon.innerHTML = '<i class="fas fa-check-circle text-success" style="font-size:3.5rem"></i>';
    resultIcon.className = 'result-icon mx-auto mb-3 bg-success-subtle rounded-circle d-flex align-items-center justify-content-center';
    resultTitle.textContent = `You qualify for ${eligible.length} scheme${eligible.length > 1 ? 's' : ''}!`;
    resultDesc.textContent = 'Great news! You have passed the eligibility check. You can now apply for the following schemes:';
  } else if (partial.length > 0) {
    resultIcon.innerHTML = '<i class="fas fa-exclamation-circle text-warning" style="font-size:3.5rem"></i>';
    resultIcon.className = 'result-icon mx-auto mb-3 bg-warning-subtle rounded-circle d-flex align-items-center justify-content-center';
    resultTitle.textContent = 'Partial Eligibility Verified';
    resultDesc.textContent = 'You qualify with basic verification. You may proceed to apply:';
  } else {
    resultIcon.innerHTML = '<i class="fas fa-times-circle text-danger" style="font-size:3.5rem"></i>';
    resultIcon.className = 'result-icon mx-auto mb-3 bg-danger-subtle rounded-circle d-flex align-items-center justify-content-center';
    resultTitle.textContent = 'Not Currently Eligible';
    resultDesc.textContent = 'Based on your responses, you do not meet the minimum scheme criteria at this time.';
    resultSchemes.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>Eligibility verification is required before submitting an application. Please contact our helpdesk at 1800-11-6163 for assistance.</div>';
    return;
  }

  const allResults = [...eligible.map(e => ({ ...e, type: 'eligible' })), ...partial.map(p => ({ ...p, type: 'partial' }))];
  resultSchemes.innerHTML = allResults.map(r => `
    <div class="d-flex align-items-center justify-content-between p-3 rounded-3 border mb-2 bg-white">
      <div>
        <strong class="d-block">${r.name}</strong>
        <small class="text-muted">${r.note}</small>
      </div>
      <div class="d-flex align-items-center gap-2">
        <span class="badge ${r.type === 'eligible' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'} fw-semibold">
          ${r.type === 'eligible' ? 'Eligible' : 'Partial'}
        </span>
        <a href="/apply?scheme=${r.id}" class="btn btn-sm btn-primary rounded-pill px-3">
          Apply <i class="fas fa-arrow-right ms-1"></i>
        </a>
      </div>
    </div>`).join('');
}

function resetChecker() {
  Object.keys(answers).forEach(k => delete answers[k]);
  currentStep = 1;
  document.getElementById('questionArea').classList.remove('d-none');
  document.getElementById('navBtns').classList.remove('d-none');
  document.getElementById('progressArea').classList.remove('d-none');
  document.getElementById('resultArea').classList.add('d-none');
  document.querySelectorAll('.option-card').forEach(b => b.classList.remove('selected'));
  showStep(1);
}

// Init
showStep(1);

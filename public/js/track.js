/* track.js */
async function trackApp() {
  const id = document.getElementById('trackInput').value.trim().toUpperCase();
  if (!id) { showToast('Please enter an Application ID.', 'warning'); return; }

  document.getElementById('trackError').classList.add('d-none');
  document.getElementById('trackResult').classList.add('d-none');
  document.getElementById('trackLoading').classList.remove('d-none');

  try {
    const res = await fetch('/api/applications/track/' + id);
    const data = await res.json();
    document.getElementById('trackLoading').classList.add('d-none');

    if (!data.success) {
      document.getElementById('trackError').classList.remove('d-none');
      document.getElementById('trackErrorMsg').textContent = data.message;
      return;
    }
    renderResult(data.application);
  } catch {
    document.getElementById('trackLoading').classList.add('d-none');
    document.getElementById('trackError').classList.remove('d-none');
    document.getElementById('trackErrorMsg').textContent = 'Network error. Please try again.';
  }
}

function tryDemo(id) {
  document.getElementById('trackInput').value = id;
  trackApp();
}

function renderResult(app) {
  const result = document.getElementById('trackResult');
  document.getElementById('res_name').textContent = app.applicantName;
  document.getElementById('res_id').textContent = app.applicationId;
  document.getElementById('res_scheme').textContent = app.schemeName;
  document.getElementById('res_status_badge').className = 'status-pill pill-' + app.status;
  document.getElementById('res_status_badge').textContent = formatStatus(app.status);

  // Auto track if ?id= query param is provided
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const qId = params.get('id');
  if (qId) {
    const input = document.getElementById('trackInput');
    if (input) {
      input.value = qId.trim().toUpperCase();
      trackApp();
    }
  }
});
  const stages = [
    { key: 'submitted',    label: 'Application Submitted',     icon: 'fas fa-file-alt',     desc: 'Your application has been received.' },
    { key: 'under_review', label: 'Document Verification',     icon: 'fas fa-search',        desc: 'Officials are verifying your documents.' },
    { key: 'approved',     label: 'Application Approved',      icon: 'fas fa-check-circle',  desc: 'Congratulations! Your application is approved.' },
    { key: 'disbursed',    label: 'Benefit Disbursed',         icon: 'fas fa-money-bill-wave',desc: 'Housing benefit has been disbursed to your account.' }
  ];

  const statusOrder = ['submitted','under_review','approved','rejected','disbursed'];
  const currentIdx = statusOrder.indexOf(app.status);

  const timelineHTML = stages.map((stage, i) => {
    let state = 'pending';
    const stageIdx = statusOrder.indexOf(stage.key);
    if (app.status === 'rejected' && stage.key === 'approved') {
      // Show rejection instead
      return `
      <div class="timeline-item">
        <div class="t-dot" style="background:#C62828;border-color:#C62828;color:#fff"><i class="fas fa-times"></i></div>
        <div class="pt-1">
          <strong class="d-block small">Application Rejected</strong>
          <span class="text-muted" style="font-size:0.75rem">${fmtDate(app.reviewedAt)}</span>
          ${app.adminRemarks ? `<p class="text-muted small mt-1"><i class="fas fa-comment-alt me-1"></i>${app.adminRemarks}</p>` : ''}
        </div>
      </div>`;
    }
    if (stageIdx < currentIdx || (stageIdx === currentIdx)) state = stageIdx < currentIdx ? 'done' : 'current';
    const histItem = app.statusHistory?.find(h => h.status === stage.key);
    return `
    <div class="timeline-item ${state}">
      <div class="t-dot"><i class="${stage.icon}"></i></div>
      <div class="pt-1">
        <strong class="d-block small">${stage.label}</strong>
        <span class="text-muted" style="font-size:0.75rem">${histItem ? fmtDate(histItem.changedAt) : '—'}</span>
        ${state !== 'pending' ? `<p class="text-muted small mt-1">${stage.desc}</p>` : ''}
      </div>
    </div>`;
  }).join('');

  document.getElementById('appTimeline').innerHTML = `<div class="timeline-wrap">${timelineHTML}</div>`;

  // Subsidy amount calculation
  let subsidyVal = '₹2,50,000';
  if (app.constructionStages && app.constructionStages.length) {
    const total = app.constructionStages.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    if (total > 0) subsidyVal = '₹' + total.toLocaleString('en-IN');
  } else if (app.subsidyAmount) {
    subsidyVal = '₹' + Number(app.subsidyAmount).toLocaleString('en-IN');
  } else {
    const subsidyMap = {
      'PMAY - Urban': '₹2,67,280',
      'PM Housing Scheme – Urban': '₹2,67,280',
      'pmay-urban': '₹2,67,280',
      'PMAY - Gramin': '₹1,25,000',
      'PM Housing Scheme – Rural': '₹1,25,000',
      'pmay-gramin': '₹1,25,000',
      'SC/ST Housing Scheme': '₹1,50,000',
      'SC / ST Special Housing Grant': '₹1,50,000',
      'sc-st': '₹1,50,000',
      'Senior Citizen Housing': '₹2,00,000',
      'Senior Citizen Affordable Housing': '₹2,00,000',
      'senior': '₹2,00,000'
    };
    subsidyVal = subsidyMap[app.schemeName] || subsidyMap[app.schemeId] || '₹2,50,000';
  }

  // Details
  const details = [
    ['Applicant Name', app.applicantName],
    ['Application ID', app.applicationId],
    ['Email', app.email],
    ['Phone', app.phone],
    ['Scheme', app.schemeName],
    ['State', app.address?.state || '—'],
    ['City', app.address?.city || '—'],
    ['Subsidy Amount', subsidyVal],
    ['Category', app.category || '—'],
    ['Submitted On', fmtDate(app.submittedAt)],
    ['Status', formatStatus(app.status)],
    ['Gender', app.gender || '—']
  ];
  document.getElementById('appDetails').innerHTML = details.map(d =>
    `<div class="col-6 col-md-4">
      <div class="bg-light rounded-3 p-2">
        <div class="text-muted" style="font-size:0.7rem;text-transform:uppercase">${d[0]}</div>
        <div class="fw-semibold small">${d[1] || '—'}</div>
      </div>
    </div>`).join('');

  // 4 Construction & Subsidy Stages
  const constSec = document.getElementById('trackConstructionSection');
  const constGrid = document.getElementById('trackStagesGrid');
  if (constSec && constGrid) {
    if (app.status === 'approved' || app.status === 'disbursed') {
      const totalNum = parseInt(subsidyVal.replace(/[^\d]/g, '')) || 250000;
      const stagesList = [
        { name: 'Foundation Level', pct: '25%', amount: Math.round(totalNum * 0.25), status: 'Geo-Tag Photo Required', color: 'warning' },
        { name: 'Walls & Lintel', pct: '40%', amount: Math.round(totalNum * 0.40), status: 'Locked', color: 'secondary' },
        { name: 'Ceiling & Roof', pct: '25%', amount: Math.round(totalNum * 0.25), status: 'Locked', color: 'secondary' },
        { name: 'Final Completion', pct: '10%', amount: Math.round(totalNum * 0.10), status: 'Locked', color: 'secondary' }
      ];

      // Overwrite with real server stages if present
      if (app.constructionStages && app.constructionStages.length === 4) {
        app.constructionStages.forEach((cs, i) => {
          stagesList[i].amount = cs.amount || stagesList[i].amount;
          stagesList[i].dueDate = cs.dueDate;
          if (cs.status === 'disbursed') {
            stagesList[i].status = 'Verified & Disbursed';
            stagesList[i].color = 'success';
          } else if (cs.status === 'pending_verification') {
            stagesList[i].status = cs.photo ? 'Photo Uploaded (In Review)' : 'Geo-Tag Photo Required';
            stagesList[i].color = 'warning';
          } else {
            stagesList[i].status = 'Locked';
            stagesList[i].color = 'secondary';
          }
        });
      }

      constGrid.innerHTML = stagesList.map((stg, idx) => `
        <div class="col-6 col-md-3">
          <div class="p-2.5 rounded-3 border bg-light text-center h-100">
            <span class="badge bg-${stg.color} mb-1">Stage ${idx + 1} · ${stg.pct}</span>
            <div class="fw-bold small text-dark">${stg.name}</div>
            <div class="fw-bold text-${stg.color === 'success' ? 'success' : stg.color === 'primary' ? 'primary' : 'dark'} my-1 fs-6">₹${stg.amount.toLocaleString('en-IN')}</div>
            <small class="text-${stg.color} d-block fw-semibold">${stg.status}</small>
            ${stg.dueDate ? `
              <div class="mt-1 badge ${stg.color === 'success' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-dark border border-warning'}" style="font-size:0.67rem">
                <i class="fas fa-calendar-alt me-1"></i>Limit: ${new Date(stg.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </div>
            ` : ''}
          </div>
        </div>
      `).join('');
      constSec.classList.remove('d-none');
    } else {
      constSec.classList.add('d-none');
    }
  }

  // Admin remarks
  if (app.adminRemarks) {
    document.getElementById('adminRemarksSection').classList.remove('d-none');
    document.getElementById('adminRemarksText').textContent = app.adminRemarks;
  }

  result.classList.remove('d-none');
  result.scrollIntoView({ behavior: 'smooth' });
}

function formatStatus(s) {
  return { submitted: 'Submitted', under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected', disbursed: 'Disbursed' }[s] || s;
}

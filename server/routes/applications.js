const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

let Application;
try { Application = require('../models/Application'); } catch(e) { Application = null; }

// In-memory application store (starts empty; populated only by real registrations & submissions)
const demoApps = [];

const isMongo = () => Application && require('mongoose').connection.readyState === 1;

// GET /api/applications  (admin)
router.get('/', async (req, res) => {
  try {
    if (isMongo()) {
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      const apps = await Application.find(filter).sort({ submittedAt: -1 }).limit(100);
      return res.json({ success: true, applications: apps });
    }
    let apps = [...demoApps];
    if (req.query.status) apps = apps.filter(a => a.status === req.query.status);
    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      apps = apps.filter(a =>
        a.applicantName.toLowerCase().includes(q) ||
        a.applicationId.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q)
      );
    }
    res.json({ success: true, applications: apps });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/applications  (submit)
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const docs = [];

    // Handle uploaded files
    if (req.files) {
      const uploadDir = path.join(__dirname, '../../public/uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      for (const [field, file] of Object.entries(req.files)) {
        const fname = `${Date.now()}_${file.name}`;
        await file.mv(path.join(uploadDir, fname));
        docs.push({ fieldName: field, originalName: file.name, fileName: fname });
      }
    }

    if (isMongo()) {
      const app = await Application.create({
        userId: req.session.user?.id || null,
        applicantName: body.fullName,
        email: body.email,
        phone: body.phone,
        aadhaar: body.aadhaar,
        dob: body.dob,
        gender: body.gender,
        category: body.category,
        address: { street: body.street, city: body.city, district: body.district, state: body.state, pincode: body.pincode },
        schemeId: body.schemeId,
        schemeName: body.schemeName,
        annualIncome: Number(body.annualIncome),
        employmentType: body.employmentType,
        bankAccount: body.bankAccount,
        ifscCode: body.ifscCode,
        landOwnership: body.landOwnership,
        plotSize: body.plotSize,
        documents: docs,
        statusHistory: [{ status: 'submitted' }]
      });
      return res.json({ success: true, applicationId: app.applicationId, message: 'Application submitted!' });
    }

    // Demo mode
    const id = `HSP2025${String(demoApps.length + 1).padStart(6, '0')}`;
    const newApp = {
      _id: 'a' + Date.now(), applicationId: id,
      applicantName: body.fullName, email: body.email, phone: body.phone, aadhaar: body.aadhaar,
      dob: body.dob, gender: body.gender, category: body.category,
      address: { street: body.street, city: body.city, district: body.district, state: body.state, pincode: body.pincode },
      schemeId: body.schemeId, schemeName: body.schemeName,
      annualIncome: Number(body.annualIncome), employmentType: body.employmentType,
      bankAccount: body.bankAccount, ifscCode: body.ifscCode,
      documents: docs, status: 'submitted', submittedAt: new Date(),
      statusHistory: [{ status: 'submitted', changedAt: new Date() }]
    };
    demoApps.push(newApp);
    res.json({ success: true, applicationId: id, message: 'Application submitted successfully! (Demo Mode)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/applications/my-applications  (get applications submitted by current user)
router.get('/my-applications', async (req, res) => {
  try {
    const user = req.session?.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Please log in to view your applications.' });
    }

    if (isMongo()) {
      const orQuery = [{ email: user.email }];
      if (user.id) orQuery.push({ userId: user.id });
      const apps = await Application.find({ $or: orQuery }).sort({ submittedAt: -1 });
      return res.json({ success: true, applications: apps });
    }

    const apps = demoApps.filter(a => a.email === user.email || (user.id && a.userId === user.id));
    res.json({ success: true, applications: apps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/applications/track/:id
router.get('/track/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongo()) {
      const app = await Application.findOne({ applicationId: id.toUpperCase() });
      if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
      return res.json({ success: true, application: app });
    }
    const app = demoApps.find(a => a.applicationId === id.toUpperCase());
    if (!app) return res.status(404).json({ success: false, message: 'Application not found. Try: HSP2025000001' });
    res.json({ success: true, application: app });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/applications/:id/status  (admin)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (isMongo()) {
      const app = await Application.findByIdAndUpdate(req.params.id,
        { status, adminRemarks: remarks, $push: { statusHistory: { status, remarks, changedBy: 'admin' } } },
        { new: true }
      );
      if (!app) return res.status(404).json({ success: false, message: 'Not found.' });
      return res.json({ success: true, application: app });
    }
    const app = demoApps.find(a => a._id === req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Not found.' });
    app.status = status;
    app.adminRemarks = remarks;
    app.statusHistory.push({ status, remarks, changedAt: new Date() });
    res.json({ success: true, application: app });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/applications/stats
router.get('/stats/overview', async (req, res) => {
  try {
    if (isMongo()) {
      const [total, approved, under_review, rejected, disbursed] = await Promise.all([
        Application.countDocuments(),
        Application.countDocuments({ status: 'approved' }),
        Application.countDocuments({ status: 'under_review' }),
        Application.countDocuments({ status: 'rejected' }),
        Application.countDocuments({ status: 'disbursed' })
      ]);
      return res.json({ success: true, stats: { total, approved, under_review, rejected, disbursed, submitted: total - approved - under_review - rejected - disbursed } });
    }
    const stats = {
      total: demoApps.length,
      approved: demoApps.filter(a => a.status === 'approved').length,
      under_review: demoApps.filter(a => a.status === 'under_review').length,
      rejected: demoApps.filter(a => a.status === 'rejected').length,
      disbursed: demoApps.filter(a => a.status === 'disbursed').length,
      submitted: demoApps.filter(a => a.status === 'submitted').length
    };
    res.json({ success: true, stats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Construction Progress & Installment Tracking ─────────────────
const schemeSubsidyLookup = {
  'pmay-urban': 267280,
  'PM Housing Scheme – Urban': 267280,
  'pmay-gramin': 125000,
  'PM Housing Scheme – Rural': 125000,
  'sc-st': 150000,
  'SC / ST Special Housing Grant': 150000,
  'senior': 200000,
  'Senior Citizen Affordable Housing': 200000
};

function getOrCreateStages(app) {
  const baseDate = new Date(app.approvedAt || app.submittedAt || Date.now());
  const stageTargets = [
    { key: 'foundation', days: 30 },
    { key: 'lintel',     days: 60 },
    { key: 'roof',       days: 45 },
    { key: 'completed',  days: 45 }
  ];

  if (app.constructionStages && app.constructionStages.length === 4) {
    // If Stage 1 was previously auto-disbursed without a photo, require geo-tagged photo for Stage 1
    if (app.constructionStages[0].status === 'disbursed' && !app.constructionStages[0].photo && !app.constructionStages[1].photo) {
      app.constructionStages[0].status = 'pending_verification';
      app.constructionStages[0].disbursedAt = null;
      app.constructionStages[0].officerRemarks = 'Geo-tagged live site photo required showing ground excavation and foundation base construction.';
      app.constructionStages[1].status = 'locked';
      app.constructionStages[1].officerRemarks = 'Unlocks upon physical verification and disbursement of Stage 1 (Foundation).';
    }

    // Ensure all existing stages have targetDays and dueDate set
    let prevDisbursed = baseDate;
    app.constructionStages.forEach((s, idx) => {
      s.targetDays = s.targetDays || stageTargets[idx].days;
      if (!s.dueDate) {
        if (idx === 0) {
          s.dueDate = new Date(baseDate.getTime() + s.targetDays * 86400000);
        } else if (app.constructionStages[idx - 1].disbursedAt) {
          s.dueDate = new Date(new Date(app.constructionStages[idx - 1].disbursedAt).getTime() + s.targetDays * 86400000);
        } else {
          s.dueDate = new Date(prevDisbursed.getTime() + s.targetDays * 86400000);
        }
      }
      if (s.disbursedAt) prevDisbursed = new Date(s.disbursedAt);
      else prevDisbursed = new Date(prevDisbursed.getTime() + s.targetDays * 86400000);
    });

    return app.constructionStages;
  }

  const totalSubsidy = schemeSubsidyLookup[app.schemeName] || schemeSubsidyLookup[app.schemeId] || 250000;
  return [
    {
      stageKey: 'foundation',
      stageName: 'Stage 1: Foundation & Base Excavation',
      installmentPct: 25,
      amount: Math.round(totalSubsidy * 0.25),
      status: 'pending_verification',
      targetDays: 30,
      dueDate: new Date(baseDate.getTime() + 30 * 86400000),
      officerRemarks: 'Geo-tagged live site photo required showing ground excavation and foundation base construction before releasing Stage 1 advance.'
    },
    {
      stageKey: 'lintel',
      stageName: 'Stage 2: Walls & Lintel Level',
      installmentPct: 40,
      amount: Math.round(totalSubsidy * 0.40),
      status: 'locked',
      targetDays: 60,
      dueDate: new Date(baseDate.getTime() + 90 * 86400000),
      officerRemarks: 'Unlocks upon physical verification and disbursement of Stage 1 (Foundation).'
    },
    {
      stageKey: 'roof',
      stageName: 'Stage 3: Ceiling Slab & Roof Cast',
      installmentPct: 25,
      amount: Math.round(totalSubsidy * 0.25),
      status: 'locked',
      targetDays: 45,
      dueDate: new Date(baseDate.getTime() + 135 * 86400000),
      officerRemarks: 'Unlocks upon successful verification of Stage 2 masonry work.'
    },
    {
      stageKey: 'completed',
      stageName: 'Stage 4: Finishing, Toilet & Occupation',
      installmentPct: 10,
      amount: Math.round(totalSubsidy * 0.10),
      status: 'locked',
      targetDays: 45,
      dueDate: new Date(baseDate.getTime() + 180 * 86400000),
      officerRemarks: 'Final subsidy settlement upon full house construction & habitable completion.'
    }
  ];
}

// GET /api/applications/:id/construction
router.get('/:id/construction', async (req, res) => {
  try {
    let app = null;
    if (isMongo()) {
      app = await Application.findById(req.params.id);
    } else {
      app = demoApps.find(a => a._id === req.params.id);
    }
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    if (!app.constructionStages || app.constructionStages.length < 4) {
      const initStages = getOrCreateStages(app);
      if (isMongo()) {
        app.constructionStages = initStages;
        await app.save();
      } else {
        app.constructionStages = initStages;
      }
    }

    res.json({ success: true, application: app, stages: app.constructionStages, overdue: app.constructionOverdue || false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/applications/:id/upload-stage-photo
router.post('/:id/upload-stage-photo', async (req, res) => {
  try {
    const { stageKey, latitude, longitude, remarks } = req.body;
    let fileName = '';

    if (req.files && req.files.photo) {
      const uploadDir = path.join(__dirname, '../../public/uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const photoFile = req.files.photo;
      fileName = `stage_${stageKey}_${Date.now()}_${photoFile.name}`;
      await photoFile.mv(path.join(uploadDir, fileName));
    }

    let app = null;
    if (isMongo()) {
      app = await Application.findById(req.params.id);
    } else {
      app = demoApps.find(a => a._id === req.params.id);
    }
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    if (!app.constructionStages || app.constructionStages.length < 4) {
      app.constructionStages = getOrCreateStages(app);
    }

    const stage = app.constructionStages.find(s => s.stageKey === stageKey);
    if (stage) {
      if (fileName) stage.photo = fileName;
      stage.uploadedAt = new Date();
      stage.status = 'pending_verification';
      stage.geoTag = {
        latitude: latitude || '11.0168° N',
        longitude: longitude || '76.9558° E',
        timestamp: new Date()
      };
      if (remarks) stage.officerRemarks = remarks;
      app.constructionOverdue = false; // Reset warning once progress photo is submitted
    }

    if (isMongo()) {
      app.markModified('constructionStages');
      await app.save();
    }

    res.json({ success: true, message: 'Construction stage photo uploaded and geo-tagged successfully!', stages: app.constructionStages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/applications/:id/verify-stage
router.post('/:id/verify-stage', async (req, res) => {
  try {
    const { stageKey, remarks } = req.body;
    let app = null;
    if (isMongo()) {
      app = await Application.findById(req.params.id);
    } else {
      app = demoApps.find(a => a._id === req.params.id);
    }
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    if (!app.constructionStages || app.constructionStages.length < 4) {
      app.constructionStages = getOrCreateStages(app);
    }

    const stageIdx = app.constructionStages.findIndex(s => s.stageKey === stageKey);
    if (stageIdx !== -1) {
      app.constructionStages[stageIdx].status = 'disbursed';
      app.constructionStages[stageIdx].disbursedAt = new Date();
      if (remarks) app.constructionStages[stageIdx].officerRemarks = remarks;

      // Unlock next stage if exists with target date limit
      if (stageIdx + 1 < app.constructionStages.length) {
        if (app.constructionStages[stageIdx + 1].status === 'locked') {
          app.constructionStages[stageIdx + 1].status = 'pending_verification';
          const nextDays = app.constructionStages[stageIdx + 1].targetDays || 45;
          app.constructionStages[stageIdx + 1].dueDate = new Date(Date.now() + nextDays * 86400000);
        }
      } else {
        // All stages disbursed!
        app.status = 'disbursed';
        app.disbursedAt = new Date();
      }

      app.statusHistory.push({
        status: `Installment Released (${app.constructionStages[stageIdx].stageName})`,
        remarks: remarks || `Physical verification approved. Grant of ₹${app.constructionStages[stageIdx].amount?.toLocaleString('en-IN')} disbursed.`,
        changedBy: 'Inspection Officer'
      });
    }

    if (isMongo()) {
      app.markModified('constructionStages');
      app.markModified('statusHistory');
      await app.save();
    }

    res.json({ 
      success: true, 
      message: 'Physical stage verified! Installment grant released to citizen bank account.', 
      stages: app.constructionStages,
      appStatus: app.status
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/applications/:id/reject-stage
router.post('/:id/reject-stage', async (req, res) => {
  try {
    const { stageKey, reason } = req.body;
    let app = null;
    if (isMongo()) {
      app = await Application.findById(req.params.id);
    } else {
      app = demoApps.find(a => a._id === req.params.id);
    }
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    if (!app.constructionStages || app.constructionStages.length < 4) {
      app.constructionStages = getOrCreateStages(app);
    }

    const stage = app.constructionStages.find(s => s.stageKey === stageKey);
    if (!stage) return res.status(404).json({ success: false, message: 'Stage not found.' });

    // Unlink file if exists
    if (stage.photo) {
      const filePath = path.join(__dirname, '../../public/uploads', stage.photo);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }

    stage.photo = '';
    stage.geoTag = null;
    stage.uploadedAt = null;
    stage.status = 'pending_verification';
    stage.officerRemarks = `Photo Rejected: ${reason || 'Physical construction photo does not meet verification criteria. Please take and re-upload a clear geo-tagged photo.'}`;

    app.statusHistory.push({
      status: `Photo Rejected (${stage.stageName})`,
      remarks: reason || 'Construction photo rejected by verification officer. Re-upload requested.',
      changedBy: 'Inspection Officer'
    });

    if (isMongo()) {
      app.markModified('constructionStages');
      app.markModified('statusHistory');
      await app.save();
    }

    res.json({
      success: true,
      message: 'Stage photo rejected. Beneficiary notified to submit a new clear photo.',
      stages: app.constructionStages
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/applications/:id/stage-status - Update status of any stage
router.post('/:id/stage-status', async (req, res) => {
  try {
    const { stageKey, status, remarks, dueDate, targetDays } = req.body;
    let app = null;
    if (isMongo()) {
      app = await Application.findById(req.params.id);
    } else {
      app = demoApps.find(a => a._id === req.params.id || a.applicationId === req.params.id);
    }
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    if (!app.constructionStages || app.constructionStages.length < 4) {
      app.constructionStages = getOrCreateStages(app);
    }

    const stageIdx = app.constructionStages.findIndex(s => s.stageKey === stageKey);
    if (stageIdx === -1) return res.status(404).json({ success: false, message: 'Stage not found.' });

    const currentStage = app.constructionStages[stageIdx];
    if (status) currentStage.status = status;
    if (status === 'disbursed') {
      currentStage.disbursedAt = currentStage.disbursedAt || new Date();
      if (stageIdx + 1 < app.constructionStages.length && app.constructionStages[stageIdx + 1].status === 'locked') {
        app.constructionStages[stageIdx + 1].status = 'pending_verification';
        const nextDays = app.constructionStages[stageIdx + 1].targetDays || 45;
        app.constructionStages[stageIdx + 1].dueDate = new Date(Date.now() + nextDays * 86400000);
      }
    } else if (status && status !== 'disbursed') {
      currentStage.disbursedAt = null;
    }

    if (remarks) {
      currentStage.officerRemarks = remarks;
    }
    if (dueDate) {
      currentStage.dueDate = new Date(dueDate);
    }
    if (targetDays) {
      currentStage.targetDays = Number(targetDays);
    }

    const allDisbursed = app.constructionStages.every(s => s.status === 'disbursed');
    if (allDisbursed) {
      app.status = 'disbursed';
    } else if (app.status === 'disbursed') {
      app.status = 'approved';
    }

    if (!app.statusHistory) app.statusHistory = [];
    app.statusHistory.push({
      status: `Stage Status Updated (${currentStage.stageName}: ${status})`,
      updatedBy: req.session?.admin?.name || 'Inspection Officer',
      updatedAt: new Date(),
      remarks: remarks || `Status changed to ${status}`
    });

    if (isMongo()) {
      app.markModified('constructionStages');
      app.markModified('statusHistory');
      await app.save();
    }

    res.json({
      success: true,
      message: `Stage ${stageIdx + 1} status updated successfully!`,
      stages: app.constructionStages
    });
  } catch (err) {
    console.error('Update stage status error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/applications/:id/flag-delay
router.post('/:id/flag-delay', async (req, res) => {
  try {
    const { remarks } = req.body;
    let app = null;
    if (isMongo()) {
      app = await Application.findById(req.params.id);
    } else {
      app = demoApps.find(a => a._id === req.params.id);
    }
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    app.constructionOverdue = true;
    if (!app.statusHistory) app.statusHistory = [];
    app.statusHistory.push({
      status: '⚠️ Construction Overdue Notice Issued',
      remarks: remarks || 'Funds received but physical house construction not initiated. Show-cause inquiry initiated.',
      changedBy: req.session?.admin?.name || 'Verification Officer',
      changedAt: new Date()
    });

    if (isMongo()) {
      app.markModified('constructionOverdue');
      app.markModified('statusHistory');
      await app.save();
    }

    res.json({ success: true, message: 'Application flagged as Construction Overdue. Notice issued to beneficiary.', overdue: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/applications/:id/clear-delay
router.post('/:id/clear-delay', async (req, res) => {
  try {
    const { remarks } = req.body;
    let app = null;
    if (isMongo()) {
      app = await Application.findById(req.params.id);
    } else {
      app = demoApps.find(a => a._id === req.params.id);
    }
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    app.constructionOverdue = false;
    if (!app.statusHistory) app.statusHistory = [];
    app.statusHistory.push({
      status: '✅ Construction Delay Notice Revoked',
      remarks: remarks || 'Field verification approved. Delay warning notice officially revoked.',
      changedBy: req.session?.admin?.name || 'Verification Officer',
      changedAt: new Date()
    });

    if (isMongo()) {
      app.markModified('constructionOverdue');
      app.markModified('statusHistory');
      await app.save();
    }

    res.json({ success: true, message: 'Overdue notice cleared. Project marked as compliant.', overdue: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/applications/:id/stage-photo/:stageKey
router.delete('/:id/stage-photo/:stageKey', async (req, res) => {
  try {
    const { id, stageKey } = req.params;
    let app = null;
    if (isMongo()) {
      app = await Application.findById(id);
    } else {
      app = demoApps.find(a => a._id === id);
    }
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    const stage = (app.constructionStages || []).find(s => s.stageKey === stageKey);
    if (!stage) return res.status(404).json({ success: false, message: 'Stage not found.' });

    if (stage.photo) {
      const filePath = path.join(__dirname, '../../public/uploads', stage.photo);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }

    stage.photo = '';
    stage.geoTag = null;
    stage.uploadedAt = null;
    if (stage.status === 'pending_verification') {
      stage.officerRemarks = 'Live site photo removed. Awaiting re-upload of clear construction photo.';
    }

    if (isMongo()) {
      app.markModified('constructionStages');
      await app.save();
    }

    res.json({ success: true, message: 'Live site photo deleted successfully.', stages: app.constructionStages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

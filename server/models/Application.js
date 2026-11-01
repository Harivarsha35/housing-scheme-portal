const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  applicationId: { type: String, unique: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Applicant Details
  applicantName:  { type: String, required: true },
  email:          { type: String, required: true },
  phone:          { type: String, required: true },
  aadhaar:        { type: String, required: true },
  dob:            { type: Date },
  gender:         { type: String },
  category:       { type: String },
  // Address
  address: {
    street: String, city: String, district: String,
    state: String, pincode: String
  },
  // Scheme
  schemeId:       { type: String, required: true },
  schemeName:     { type: String, required: true },
  // Financial
  annualIncome:   { type: Number },
  employmentType: { type: String },
  bankAccount:    { type: String },
  ifscCode:       { type: String },
  // Property
  landOwnership:  { type: String },
  plotSize:       { type: String },
  // Documents
  documents: [{
    fieldName:    String,
    originalName: String,
    fileName:     String,
    uploadedAt:   { type: Date, default: Date.now }
  }],
  // Status
  status: {
    type: String,
    enum: ['submitted','under_review','approved','rejected','disbursed'],
    default: 'submitted'
  },
  // Construction Progress & Installment Tracking
  constructionStages: [{
    stageKey:       String,
    stageName:      String,
    installmentPct: Number,
    amount:         Number,
    status:         { type: String, default: 'locked' },
    targetDays:     Number,
    dueDate:        Date,
    photo:          String,
    geoTag:         { latitude: String, longitude: String, timestamp: Date },
    uploadedAt:     Date,
    disbursedAt:    Date,
    officerRemarks: String
  }],
  constructionOverdue: { type: Boolean, default: false },
  statusHistory: [{
    status:     String,
    changedAt:  { type: Date, default: Date.now },
    changedBy:  String,
    remarks:    String
  }],
  adminRemarks:   { type: String },
  submittedAt:    { type: Date, default: Date.now },
  reviewedAt:     { type: Date },
  approvedAt:     { type: Date },
  disbursedAt:    { type: Date }
});

// Auto-generate application ID
ApplicationSchema.pre('save', async function(next) {
  if (!this.applicationId) {
    const count = await mongoose.model('Application').countDocuments();
    const year = new Date().getFullYear();
    this.applicationId = `HSP${year}${String(count + 1).padStart(6, '0')}`;
  }
  // Track status changes
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status });
  }
  next();
});

module.exports = mongoose.model('Application', ApplicationSchema);

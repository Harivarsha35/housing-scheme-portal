const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  phone:       { type: String, default: '' },
  aadhaar:     { type: String, default: null },
  password:    { type: String, required: true },
  dob:         { type: Date },
  gender:      { type: String, enum: ['male','female','other'] },
  address:     {
    street: String, city: String, state: String,
    district: String, pincode: String
  },
  category:    { type: String, enum: ['general','obc','sc','st'], default: 'general' },
  annualIncome:{ type: Number, default: null },
  isVerified:  { type: Boolean, default: false },
  role:        { type: String, enum: ['user','admin'], default: 'user' },
  createdAt:   { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', UserSchema);

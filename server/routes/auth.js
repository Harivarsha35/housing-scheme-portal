const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Try to use Mongoose User model; fall back to in-memory for demo
let User;
try { User = require('../models/User'); } catch(e) { User = null; }

// In-memory demo store  (password = "demo1234" → bcrypt hash)
const demoUsers = [
  {
    _id: 'demo1', name: 'Demo User', email: 'user@demo.com',
    phone: '9999999999', aadhaar: '123456789012',
    // bcrypt hash of "demo1234"
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    role: 'user', isVerified: true
  }
];

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, aadhaar, password, dob, gender, category, annualIncome, state, district, city, pincode, street } = req.body;

    if (User && require('mongoose').connection.readyState === 1) {
      const existsQuery = [{ email }];
      if (aadhaar) existsQuery.push({ aadhaar });
      const exists = await User.findOne({ $or: existsQuery });
      if (exists) return res.status(400).json({ success: false, message: 'Email or phone already registered.' });

      const user = await User.create({
        name, email, phone: phone || '',
        ...(aadhaar ? { aadhaar } : {}),
        password, dob, gender, category,
        ...(annualIncome ? { annualIncome: Number(annualIncome) } : {}),
        address: { street, city, district, state, pincode }
      });
      req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };
      return res.json({ success: true, message: 'Registration successful!', user: req.session.user });
    }

    // Demo mode
    if (demoUsers.find(u => u.email === email)) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const newUser = { _id: 'u' + Date.now(), name, email, phone, aadhaar: aadhaar || null, password: hashed, role: 'user', isVerified: true };
    demoUsers.push(newUser);
    req.session.user = { id: newUser._id, name: newUser.name, email: newUser.email, role: 'user' };
    res.json({ success: true, message: 'Registration successful! (Demo Mode)', user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (User && require('mongoose').connection.readyState === 1) {
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      const match = await user.comparePassword(password);
      if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };
      return res.json({ success: true, message: 'Login successful!', user: req.session.user });
    }

    // Demo mode
    const found = demoUsers.find(u => u.email === email);
    if (!found) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    const match = await bcrypt.compare(password, found.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    req.session.user = { id: found._id, name: found.name, email: found.email, role: found.role };
    res.json({ success: true, message: 'Login successful! (Demo Mode)', user: req.session.user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true, message: 'Logged out.' }));
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (req.session.user) return res.json({ success: true, user: req.session.user });
  res.status(401).json({ success: false, message: 'Not authenticated.' });
});

module.exports = router;

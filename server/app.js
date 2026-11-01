const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Connect to MongoDB ────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.warn('⚠️  MongoDB not available – running in demo mode (in-memory data)');
});

// ── Middleware ────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(fileUpload({ limits: { fileSize: 5 * 1024 * 1024 }, createParentPath: true }));

// Session
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
};
if (mongoose.connection.readyState === 1) {
  sessionConfig.store = MongoStore.create({ mongoUrl: process.env.MONGO_URI });
}
app.use(session(sessionConfig));

// Locals for templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.admin = req.session.admin || null;
  next();
});

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/schemes',      require('./routes/schemes'));
app.use('/api/admin',        require('./routes/admin'));

// ── Serve HTML pages ─────────────────────────────────────────────
const pages = ['index','schemes','eligibility','apply','track','login','dashboard','admin'];
pages.forEach(page => {
  app.get(`/${page === 'index' ? '' : page}`, (req, res) => {
    res.sendFile(path.join(__dirname, `../public/${page}.html`));
  });
});

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏠 Digital Housing Scheme Portal`);
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📋 Admin panel:      http://localhost:${PORT}/admin`);
  console.log(`───────────────────────────────────────────────`);

  // Automatically open browser
  try {
    const startCmd = process.platform === 'win32' ? `start http://localhost:${PORT}` :
                     process.platform === 'darwin' ? `open http://localhost:${PORT}` :
                     `xdg-open http://localhost:${PORT}`;
    require('child_process').exec(startCmd);
  } catch (err) {}
});

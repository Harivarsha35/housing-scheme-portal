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
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.warn('⚠️  MongoDB not available – running in demo mode (in-memory data):', err.message);
  });
} else {
  console.log('ℹ️  No MONGO_URI provided – running in demo mode (in-memory data)');
}

// ── Global Error Guard (Prevents 502 crashes on cloud hosts like Render) ───
process.on('unhandledRejection', (reason) => {
  console.warn('⚠️  Unhandled Rejection handled gracefully:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.warn('⚠️  Uncaught Exception handled gracefully:', err?.message || err);
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

if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb')) {
  try {
    const store = MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60,
      mongoOptions: { serverSelectionTimeoutMS: 5000 }
    });
    // Prevent unhandled error event from crashing the server if Mongo is unreachable
    store.on('error', (err) => {
      console.warn('⚠️  MongoStore error (falling back to memory):', err.message);
    });
    sessionConfig.store = store;
  } catch (err) {
    console.warn('⚠️  Could not attach MongoStore session store, using MemoryStore fallback:', err.message);
  }
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

// Health check for Render load balancer
app.get('/health', (req, res) => res.status(200).send('OK'));

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏠 Digital Housing Scheme Portal`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`───────────────────────────────────────────────`);

  // Automatically open browser in local development
  if (process.env.NODE_ENV !== 'production' && !process.env.RENDER && !process.env.RAILWAY_ENVIRONMENT) {
    try {
      const startCmd = process.platform === 'win32' ? `start http://localhost:${PORT}` :
                       process.platform === 'darwin' ? `open http://localhost:${PORT}` :
                       `xdg-open http://localhost:${PORT}`;
      require('child_process').exec(startCmd);
    } catch (err) {}
  }
});

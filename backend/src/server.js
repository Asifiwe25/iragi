// backend/src/server.js
require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const routes    = require('./routes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS: support localhost + Vercel production ──
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    // Allow *.vercel.app subdomains
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Rate limiting ───────────────────────────────
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api',      rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// ── Body parser ─────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────
app.use('/api', routes);

// ── Health check ────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'ok', org: 'IRAGI', version: '1.0.0',
  env: process.env.NODE_ENV,
}));

// ── 404 handler ─────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error handler ───────────────────────────────
app.use((err, _, res, __) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 IRAGI Backend running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Database:    ${process.env.DB_NAME || 'via DATABASE_URL'}@${process.env.DB_HOST || 'cloud'}`);
  console.log(`   CORS:        ${allowedOrigins.join(', ')}`);
});

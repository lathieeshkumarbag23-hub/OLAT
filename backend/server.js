// server.js  — Main Express entry point
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');

const authRoutes    = require('./routes/auth');
const lessonRoutes  = require('./routes/lessons');
const quizRoutes    = require('./routes/quizzes');
const scoreRoutes   = require('./routes/scores');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────
app.use(cors({ 
  origin: function (origin, callback) {
    // Allow any localhost port or 127.0.0.1 port, or no origin (like postman)
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked origin: ' + origin));
    }
  }, 
  credentials: true 
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ── Routes ───────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/scores',  scoreRoutes);

// ── 404 catch-all ────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ─────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Kahoootix API running on http://127.0.0.1:${PORT}`);
});

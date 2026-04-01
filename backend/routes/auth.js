// routes/auth.js
const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'kahoootix_super_secret_jwt_key_2026';

// ──────────────────────────────────────────────────
// POST /api/auth/register  — Students only
// ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  // Block teacher self-registration
  if (role === 'teacher') {
    return res.status(403).json({ error: 'Teacher registration is not allowed. Contact your administrator.' });
  }

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }

  try {
    // Check duplicate email
    const [existing] = await db.query('SELECT id FROM Users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO Users (role, name, email, password_hash) VALUES (?, ?, ?, ?)',
      ['student', name, email, hash]
    );

    const token = jwt.sign(
      { id: result.insertId, role: 'student', name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: result.insertId, role: 'student', name, email } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// ──────────────────────────────────────────────────
// POST /api/auth/login  — Teacher + Student
// ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Update streak
    const today = new Date().toISOString().slice(0, 10);
    if (user.last_login !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak = user.last_login === yesterday ? user.streak + 1 : 1;
      await db.query('UPDATE Users SET streak = ?, last_login = ? WHERE id = ?', [newStreak, today, user.id]);
      user.streak = newStreak;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, role: user.role, name: user.name, email: user.email, streak: user.streak }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router;

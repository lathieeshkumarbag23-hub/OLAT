// middleware/auth.js — JWT verification middleware
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kahoootix_super_secret_jwt_key_2026';

/**
 * Verifies a Bearer JWT and attaches the decoded payload to req.user
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Only allows teacher role through
 */
function requireTeacher(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Teachers only' });
    }
    next();
  });
}

/**
 * Only allows student role through
 */
function requireStudent(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Students only' });
    }
    next();
  });
}

module.exports = { requireAuth, requireTeacher, requireStudent };

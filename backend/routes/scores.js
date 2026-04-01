// routes/scores.js
const express = require('express');
const db      = require('../db');
const { requireTeacher, requireStudent } = require('../middleware/auth');

const router = express.Router();

// ──────────────────────────────────────────────────
// POST /api/scores  — Student only
// Body: { quizId, score }
// ──────────────────────────────────────────────────
router.post('/', requireStudent, async (req, res) => {
  const { quizId, score } = req.body;

  if (!quizId || score == null) {
    return res.status(400).json({ error: 'quizId and score are required.' });
  }

  try {
    // Verify quiz exists
    const [[quiz]] = await db.query('SELECT id FROM Quizzes WHERE id = ?', [quizId]);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    // Check if score already exists for single-attempt constraint
    const [[existingScore]] = await db.query(
      'SELECT id FROM Scores WHERE student_id = ? AND quiz_id = ?',
      [req.user.id, quizId]
    );
    if (existingScore) {
      return res.status(409).json({ error: 'You have already submitted a score for this quiz.' });
    }

    await db.query(
      'INSERT INTO Scores (student_id, quiz_id, score) VALUES (?, ?, ?)',
      [req.user.id, quizId, score]
    );

    // Compute rank (number of higher scores + 1)
    const [[{ betterCount }]] = await db.query(`
      SELECT COUNT(*) AS betterCount
      FROM Scores
      WHERE quiz_id = ? AND score > ?
    `, [quizId, score]);

    const rank = betterCount + 1;

    res.status(201).json({ message: 'Score saved.', rank });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save score.' });
  }
});

// ──────────────────────────────────────────────────
// GET /api/scores  — Teacher only
// Returns all scores with student info + quiz info
// ──────────────────────────────────────────────────
router.get('/', requireTeacher, async (req, res) => {
  try {
    const [scores] = await db.query(`
      SELECT
        S.id,
        S.score,
        S.completed_at,
        U.name  AS student_name,
        U.email AS student_email,
        Q.title AS quiz_title,
        L.title AS lesson_title,
        L.id    AS lesson_id
      FROM Scores S
      JOIN Users   U ON U.id = S.student_id
      JOIN Quizzes Q ON Q.id = S.quiz_id
      JOIN Lessons L ON L.id = Q.lesson_id
      ORDER BY S.completed_at DESC
    `);
    res.json(scores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch scores.' });
  }
});

// ──────────────────────────────────────────────────
// GET /api/scores/leaderboard/:quizId  — Authenticated
// ──────────────────────────────────────────────────
router.get('/leaderboard/:quizId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        U.name  AS student_name,
        MAX(S.score) AS best_score,
        MIN(S.completed_at) AS first_completion
      FROM Scores S
      JOIN Users U ON U.id = S.student_id
      WHERE S.quiz_id = ?
      GROUP BY S.student_id
      ORDER BY best_score DESC
      LIMIT 10
    `, [req.params.quizId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

module.exports = router;

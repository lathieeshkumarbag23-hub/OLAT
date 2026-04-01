// routes/quizzes.js
const express = require('express');
const db      = require('../db');
const { requireAuth, requireTeacher } = require('../middleware/auth');

const router = express.Router();

// ──────────────────────────────────────────────────
// GET /api/quizzes/:lessonId
// Returns the full quiz tree (questions + options) for a lesson
// ──────────────────────────────────────────────────
router.get('/:lessonId', requireAuth, async (req, res) => {
  try {
    const [[quiz]] = await db.query(
      'SELECT * FROM Quizzes WHERE lesson_id = ?',
      [req.params.lessonId]
    );
    if (!quiz) return res.status(404).json({ error: 'No quiz found for this lesson.' });

    // Enforce Single-Take rule: Check if student already has a score
    if (req.user.role === 'student') {
      const [[existingScore]] = await db.query(
        'SELECT score FROM Scores WHERE quiz_id = ? AND student_id = ?',
        [quiz.id, req.user.id]
      );
      if (existingScore) {
        return res.status(403).json({ error: 'You have already completed this quiz.', score: existingScore.score });
      }
    }

    const [questions] = await db.query(
      'SELECT * FROM Questions WHERE quiz_id = ? ORDER BY sort_order, id',
      [quiz.id]
    );

    // Attach options to each question
    for (const q of questions) {
      const [options] = await db.query(
        'SELECT * FROM Options WHERE question_id = ?',
        [q.id]
      );
      q.options = options;
    }

    res.json({ ...quiz, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch quiz.' });
  }
});

// ──────────────────────────────────────────────────
// POST /api/quizzes  — Teacher only
// Body: {
//   lessonId,
//   title,
//   questions: [{ text, timeLimit, points, options: [{ text, isCorrect }] }]
// }
// ──────────────────────────────────────────────────
router.post('/', requireTeacher, async (req, res) => {
  const { lessonId, title, questions = [] } = req.body;

  if (!lessonId || !title || !title.trim()) {
    return res.status(400).json({ error: 'lessonId and title are required.' });
  }
  if (questions.length === 0) {
    return res.status(400).json({ error: 'At least one question is required.' });
  }
  // Validate each question
  for (const [i, q] of questions.entries()) {
    if (!q.text || !q.text.trim()) {
      return res.status(400).json({ error: `Question ${i + 1} text is required.` });
    }
    const correctCount = (q.options || []).filter(o => o.isCorrect).length;
    if (correctCount === 0) {
      return res.status(400).json({ error: `Question ${i + 1} must have at least one correct option.` });
    }
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Check if lesson exists and belongs to this teacher
    const [[lesson]] = await conn.query('SELECT id, teacher_id FROM Lessons WHERE id = ?', [lessonId]);
    if (!lesson) {
      await conn.rollback();
      return res.status(404).json({ error: 'Lesson not found.' });
    }
    if (lesson.teacher_id !== req.user.id) {
      await conn.rollback();
      return res.status(403).json({ error: 'Not your lesson.' });
    }

    // Delete existing quiz for this lesson (replace mode)
    await conn.query('DELETE FROM Quizzes WHERE lesson_id = ?', [lessonId]);

    const [quizResult] = await conn.query(
      'INSERT INTO Quizzes (lesson_id, title) VALUES (?, ?)',
      [lessonId, title.trim()]
    );
    const quizId = quizResult.insertId;

    for (const [idx, q] of questions.entries()) {
      const [qResult] = await conn.query(
        'INSERT INTO Questions (quiz_id, text, time_limit, points, sort_order) VALUES (?, ?, ?, ?, ?)',
        [quizId, q.text.trim(), q.timeLimit || 20, q.points || 100, idx]
      );
      const qId = qResult.insertId;

      for (const opt of (q.options || [])) {
        if (opt.text && opt.text.trim()) {
          await conn.query(
            'INSERT INTO Options (question_id, text, is_correct) VALUES (?, ?, ?)',
            [qId, opt.text.trim(), opt.isCorrect ? 1 : 0]
          );
        }
      }
    }

    await conn.commit();
    res.status(201).json({ id: quizId, message: 'Quiz saved successfully.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to save quiz.' });
  } finally {
    conn.release();
  }
});

module.exports = router;

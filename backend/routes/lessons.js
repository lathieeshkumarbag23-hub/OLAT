// routes/lessons.js
const express = require('express');
const db      = require('../db');
const { requireAuth, requireTeacher } = require('../middleware/auth');

const router = express.Router();

// ──────────────────────────────────────────────────
// GET /api/lessons  — Any authenticated user
// ──────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const [lessons] = await db.query(`
      SELECT
        L.id,
        L.teacher_id,
        L.title,
        L.description,
        L.created_at,
        U.name AS teacher_name,
        (SELECT COUNT(*) FROM Materials M WHERE M.lesson_id = L.id) AS material_count,
        (SELECT COUNT(*) > 0 FROM Quizzes Q WHERE Q.lesson_id = L.id) AS has_quiz,
        (
          SELECT S.score 
          FROM Scores S 
          JOIN Quizzes Q ON Q.id = S.quiz_id 
          WHERE Q.lesson_id = L.id AND S.student_id = ?
          LIMIT 1
        ) AS student_score
      FROM Lessons L
      JOIN Users U ON U.id = L.teacher_id
      ORDER BY L.created_at DESC
    `, [req.user.id]);
    res.json(lessons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch lessons.' });
  }
});

// ──────────────────────────────────────────────────
// GET /api/lessons/:id — Single lesson with materials
// ──────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [[lesson]] = await db.query(
      'SELECT L.*, U.name AS teacher_name FROM Lessons L JOIN Users U ON U.id = L.teacher_id WHERE L.id = ?',
      [req.params.id]
    );
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    const [materials] = await db.query(
      'SELECT * FROM Materials WHERE lesson_id = ? ORDER BY created_at',
      [req.params.id]
    );

    res.json({ ...lesson, materials });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch lesson.' });
  }
});

// ──────────────────────────────────────────────────
// POST /api/lessons  — Teacher only
// Body: { title, description, materials: [{type, title, url}] }
// ──────────────────────────────────────────────────
router.post('/', requireTeacher, async (req, res) => {
  const { title, description, materials = [] } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Lesson title is required.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [lessonResult] = await conn.query(
      'INSERT INTO Lessons (teacher_id, title, description) VALUES (?, ?, ?)',
      [req.user.id, title.trim(), description || '']
    );
    const lessonId = lessonResult.insertId;

    for (const m of materials) {
      if (m.url && m.url.trim()) {
        await conn.query(
          'INSERT INTO Materials (lesson_id, type, title, url) VALUES (?, ?, ?, ?)',
          [lessonId, m.type || 'link', m.title || '', m.url.trim()]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ id: lessonId, message: 'Lesson created successfully.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to create lesson.' });
  } finally {
    conn.release();
  }
});

// ──────────────────────────────────────────────────
// DELETE /api/lessons/:id  — Teacher only (own lesson)
// ──────────────────────────────────────────────────
router.delete('/:id', requireTeacher, async (req, res) => {
  try {
    const [[lesson]] = await db.query('SELECT teacher_id FROM Lessons WHERE id = ?', [req.params.id]);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });
    if (lesson.teacher_id !== req.user.id) return res.status(403).json({ error: 'Not your lesson.' });

    await db.query('DELETE FROM Lessons WHERE id = ?', [req.params.id]);
    res.json({ message: 'Lesson deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete lesson.' });
  }
});

module.exports = router;

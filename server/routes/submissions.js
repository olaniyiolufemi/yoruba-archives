const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav', 'video/mp4'];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.get('/', (req, res) => {
  const { category, status, q, page = 1, limit = 12, source_type } = req.query;
  let sql = `
    SELECT s.*, c.category_name, u.name as author_name, u.institution
    FROM research_submissions s
    JOIN categories c ON s.category_id = c.category_id
    JOIN users u ON s.user_id = u.user_id
    WHERE 1=1
  `;
  const params = [];

  const user = req.user || null;
  if (!user || (user.role !== 'admin' && user.role !== 'reviewer')) {
    sql += ` AND s.status = 'verified'`;
  } else if (status) {
    sql += ` AND s.status = ?`;
    params.push(status);
  }

  if (category) { sql += ` AND s.category_id = ?`; params.push(category); }
  if (source_type) { sql += ` AND s.source_type = ?`; params.push(source_type); }
  if (q) { sql += ` AND (s.title LIKE ? OR s.abstract LIKE ?)`; params.push(`%${q}%`, `%${q}%`); }

  sql += ` ORDER BY s.created_at DESC`;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const countSql = sql.replace(/SELECT s\.\*.*?FROM/s, 'SELECT COUNT(*) as total FROM');
  const total = db.prepare(countSql).get(...params)?.total || 0;

  sql += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const rows = db.prepare(sql).all(...params);
  res.json({ submissions: rows, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

router.get('/categories', (req, res) => {
  const cats = db.prepare('SELECT * FROM categories').all();
  res.json(cats);
});

router.get('/share/:link', (req, res) => {
  const sub = db.prepare(`
    SELECT s.*, c.category_name, u.name as author_name
    FROM research_submissions s
    JOIN categories c ON s.category_id = c.category_id
    JOIN users u ON s.user_id = u.user_id
    WHERE s.shareable_link = ?
  `).get(req.params.link);
  if (!sub) return res.status(404).json({ error: 'Not found' });
  res.json(sub);
});

router.get('/:id', (req, res) => {
  const sub = db.prepare(`
    SELECT s.*, c.category_name, u.name as author_name, u.institution
    FROM research_submissions s
    JOIN categories c ON s.category_id = c.category_id
    JOIN users u ON s.user_id = u.user_id
    WHERE s.submission_id = ?
  `).get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Not found' });
  res.json(sub);
});

router.post('/', requireAuth, upload.single('file'), (req, res) => {
  const { title, abstract, category_id } = req.body;
  if (!title || !abstract || !category_id) {
    return res.status(400).json({ error: 'title, abstract and category_id are required' });
  }

  const id = `sub_${crypto.randomBytes(8).toString('hex')}`;
  const shareLink = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${crypto.randomBytes(3).toString('hex')}`;

  const file_url = req.file ? `/uploads/${req.file.filename}` : null;
  const file_name = req.file ? req.file.originalname : null;
  const file_type = req.file ? req.file.mimetype : null;

  db.prepare(`
    INSERT INTO research_submissions (submission_id, user_id, title, abstract, category_id, file_url, file_name, file_type, shareable_link)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.user_id, title, abstract, category_id, file_url, file_name, file_type, shareLink);

  db.prepare(`
    INSERT INTO notifications (user_id, title, message, submission_id)
    VALUES (?, ?, ?, ?)
  `).run(req.user.user_id, 'Submission Received', `Your submission "${title}" is pending peer review.`, id);

  res.status(201).json({ submission_id: id, shareable_link: shareLink });
});

router.patch('/:id/review', requireAuth, requireRole('reviewer', 'admin'), (req, res) => {
  const { decision, comments } = req.body;
  const valid = ['verified', 'rejected', 'revision_requested'];
  if (!valid.includes(decision)) return res.status(400).json({ error: 'Invalid decision' });

  const sub = db.prepare('SELECT * FROM research_submissions WHERE submission_id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Not found' });

  db.prepare(`
    INSERT INTO peer_reviews (submission_id, reviewer_id, decision, comments)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, req.user.user_id, decision, comments || null);

  db.prepare(`UPDATE research_submissions SET status = ? WHERE submission_id = ?`).run(decision, req.params.id);

  const msg = decision === 'verified'
    ? `Your submission "${sub.title}" has been verified and published.`
    : decision === 'rejected'
    ? `Your submission "${sub.title}" was rejected. Reviewer notes: ${comments || 'None'}`
    : `Revision requested for "${sub.title}". Notes: ${comments || 'None'}`;

  db.prepare(`
    INSERT INTO notifications (user_id, title, message, submission_id)
    VALUES (?, ?, ?, ?)
  `).run(sub.user_id, 'Submission Review Update', msg, req.params.id);

  res.json({ message: 'Review recorded', status: decision });
});

router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const sub = db.prepare('SELECT submission_id FROM research_submissions WHERE submission_id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM research_submissions WHERE submission_id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;

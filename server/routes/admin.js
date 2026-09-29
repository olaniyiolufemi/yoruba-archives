const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', requireAuth, requireRole('admin'), (req, res) => {
  const total_submissions = db.prepare('SELECT COUNT(*) as c FROM research_submissions').get().c;
  const verified = db.prepare("SELECT COUNT(*) as c FROM research_submissions WHERE status = 'verified'").get().c;
  const pending = db.prepare("SELECT COUNT(*) as c FROM research_submissions WHERE status = 'pending'").get().c;
  const rejected = db.prepare("SELECT COUNT(*) as c FROM research_submissions WHERE status = 'rejected'").get().c;
  const total_users = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const total_requests = db.prepare('SELECT COUNT(*) as c FROM research_requests').get().c;

  const by_category = db.prepare(`
    SELECT c.category_name, COUNT(*) as count
    FROM research_submissions s
    JOIN categories c ON s.category_id = c.category_id
    GROUP BY c.category_id
    ORDER BY count DESC
  `).all();

  res.json({ total_submissions, verified, pending, rejected, total_users, total_requests, by_category });
});

router.get('/users', requireAuth, requireRole('admin'), (req, res) => {
  const users = db.prepare('SELECT user_id, name, email, role, institution, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

router.patch('/users/:id/role', requireAuth, requireRole('admin'), (req, res) => {
  const { role } = req.body;
  const valid = ['researcher', 'public', 'reviewer', 'admin'];
  if (!valid.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  db.prepare('UPDATE users SET role = ? WHERE user_id = ?').run(role, req.params.id);
  res.json({ message: 'Role updated' });
});

router.get('/pending', requireAuth, requireRole('admin', 'reviewer'), (req, res) => {
  const subs = db.prepare(`
    SELECT s.*, c.category_name, u.name as author_name
    FROM research_submissions s
    JOIN categories c ON s.category_id = c.category_id
    JOIN users u ON s.user_id = u.user_id
    WHERE s.status = 'pending'
    ORDER BY s.created_at ASC
  `).all();
  res.json(subs);
});

router.get('/external-sources', requireAuth, requireRole('admin'), (req, res) => {
  const sources = db.prepare('SELECT * FROM external_sources ORDER BY last_indexed_at DESC').all();
  res.json(sources);
});

module.exports = router;

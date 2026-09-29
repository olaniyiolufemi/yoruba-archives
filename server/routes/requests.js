const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  let sql = `
    SELECT r.*, u.name as requester_name
    FROM research_requests r
    JOIN users u ON r.user_id = u.user_id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ` AND r.status = ?`; params.push(status); }
  sql += ` ORDER BY r.vote_count DESC, r.created_at DESC`;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const countSql = sql.replace(/SELECT r\.\*.*?FROM/s, 'SELECT COUNT(*) as total FROM');
  const total = db.prepare(countSql).get(...params)?.total || 0;

  sql += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const rows = db.prepare(sql).all(...params);
  res.json({ requests: rows, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

router.post('/', requireAuth, (req, res) => {
  const { topic, description } = req.body;
  if (!topic || !description) return res.status(400).json({ error: 'topic and description are required' });

  const result = db.prepare(`
    INSERT INTO research_requests (user_id, topic, description)
    VALUES (?, ?, ?)
  `).run(req.user.user_id, topic, description);

  res.status(201).json({ request_id: result.lastInsertRowid });
});

router.post('/:id/vote', requireAuth, (req, res) => {
  const reqId = parseInt(req.params.id);
  const existing = db.prepare('SELECT vote_id FROM votes WHERE request_id = ? AND user_id = ?').get(reqId, req.user.user_id);

  if (existing) {
    db.prepare('DELETE FROM votes WHERE request_id = ? AND user_id = ?').run(reqId, req.user.user_id);
    db.prepare('UPDATE research_requests SET vote_count = vote_count - 1 WHERE request_id = ?').run(reqId);
    return res.json({ voted: false });
  }

  db.prepare('INSERT INTO votes (request_id, user_id) VALUES (?, ?)').run(reqId, req.user.user_id);
  db.prepare('UPDATE research_requests SET vote_count = vote_count + 1 WHERE request_id = ?').run(reqId);
  res.json({ voted: true });
});

router.patch('/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  const valid = ['open', 'prioritized', 'addressed'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (!['admin', 'reviewer'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  db.prepare('UPDATE research_requests SET status = ? WHERE request_id = ?').run(status, req.params.id);
  res.json({ message: 'Status updated', status });
});

module.exports = router;

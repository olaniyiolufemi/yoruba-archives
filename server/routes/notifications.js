const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const notifs = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 30
  `).all(req.user.user_id);
  res.json(notifs);
});

router.patch('/:id/read', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?').run(req.params.id, req.user.user_id);
  res.json({ message: 'Marked read' });
});

router.patch('/mark-all-read', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.user_id);
  res.json({ message: 'All notifications marked as read' });
});

module.exports = router;

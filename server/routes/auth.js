const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { signToken } = require('../middleware/auth');

const router = express.Router();

const hashPw = (pw) => crypto.createHash('sha256').update(pw).digest('hex');

router.post('/register', (req, res) => {
  const { name, email, password, role, institution } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  const allowed_roles = ['researcher', 'public'];
  const user_role = allowed_roles.includes(role) ? role : 'public';

  try {
    const existing = db.prepare('SELECT user_id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, institution)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, email, hashPw(password), user_role, institution || null);

    const token = signToken({ user_id: result.lastInsertRowid, role: user_role, exp: Date.now() + 86400000 * 7 });
    res.status(201).json({ message: 'Registration successful', token, role: user_role });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || user.password_hash !== hashPw(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({ user_id: user.user_id, role: user.role, exp: Date.now() + 86400000 * 7 });
  res.json({
    token,
    user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role, institution: user.institution }
  });
});

module.exports = router;

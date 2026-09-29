const express = require('express');
const path = require('path');
const cors = require('cors');

const authRouter = require('./routes/auth');
const submissionsRouter = require('./routes/submissions');
const requestsRouter = require('./routes/requests');
const notificationsRouter = require('./routes/notifications');
const adminRouter = require('./routes/admin');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../client')));

app.use('/api/auth', authRouter);
app.use('/api/submissions', (req, res, next) => {
  const token = (req.headers.authorization || '').slice(7);
  if (token) {
    try {
      const { verifyToken } = require('./middleware/auth');
      const payload = verifyToken(token);
      if (payload) {
        const db = require('./db');
        req.user = db.prepare('SELECT user_id, name, email, role FROM users WHERE user_id = ?').get(payload.user_id);
      }
    } catch (_) {}
  }
  next();
}, submissionsRouter);
app.use('/api/requests', (req, res, next) => {
  const token = (req.headers.authorization || '').slice(7);
  if (token) {
    try {
      const { verifyToken } = require('./middleware/auth');
      const payload = verifyToken(token);
      if (payload) {
        const db = require('./db');
        req.user = db.prepare('SELECT user_id, name, email, role FROM users WHERE user_id = ?').get(payload.user_id);
      }
    } catch (_) {}
  }
  next();
}, requestsRouter);
app.use('/api/notifications', requireAuth, notificationsRouter);
app.use('/api/admin', requireAuth, adminRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get(/^\/(?!api|uploads).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => console.log(`Yoruba Archives server running on http://localhost:${PORT}`));

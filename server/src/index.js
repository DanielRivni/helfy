import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { pool, initSchema } from './db.js';
import { authMiddleware } from './auth.js';
import { sendUserEvent } from './kafka.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 3001);

// Utility: create token (random 32 bytes hex)
function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, password_hash]);
    const userId = result.insertId;

    // send kafka event
    sendUserEvent('user_registered', { userId, email }).catch(() => {});

    return res.json({ ok: true, userId });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error(e);
    return res.status(500).json({ error: 'Failed to register' });
  }
});

// Login -> returns a token valid for 7 days (stored in DB)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const [rows] = await pool.query('SELECT id, password_hash FROM users WHERE email = ? LIMIT 1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = createToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7d
    await pool.query(
      'INSERT INTO user_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );

    // send kafka event
    sendUserEvent('user_logged_in', { userId: user.id, email }).catch(() => {});

    return res.json({ token, expiresAt: expiresAt.toISOString() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

// Protected route
app.get('/api/profile', authMiddleware, async (req, res) => {
  res.json({ id: req.user.id, email: req.user.email });
});

// On container start, try to ensure schema (safe if already applied)
(async () => {
  try {
    await initSchema();
    console.log('Schema ensured.');
  } catch (e) {
    console.warn('Schema ensure failed (will continue):', e.message);
  }
  app.listen(PORT, () => {
    console.log(`API listening on http://0.0.0.0:${PORT}`);
  });
})();

import { pool } from './db.js';

export async function authMiddleware(req, res, next) {
  try {
    const hdr = req.headers['authorization'] || '';
    const parts = hdr.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = parts[1];

    const [rows] = await pool.query(
      'SELECT ut.user_id, u.email FROM user_tokens ut JOIN users u ON u.id = ut.user_id WHERE ut.token = ? AND ut.expires_at > NOW() LIMIT 1',
      [token]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = { id: rows[0].user_id, email: rows[0].email, token };
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Auth failed' });
  }
}

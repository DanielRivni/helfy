import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import { pool, initSchema } from './db.js';

const email = process.env.DEFAULT_USER_EMAIL || 'admin@example.com';
const password = process.env.DEFAULT_USER_PASSWORD || 'Admin12345!';

const RETRIES = 60;
const SLEEP_MS = 2000;

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function waitForDB() {
  for (let i = 1; i <= RETRIES; i++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (e) {
      console.log(`[seed] DB not ready yet, retry ${i}/${RETRIES}...`);
      await sleep(SLEEP_MS);
    }
  }
  throw new Error('DB not reachable after retries');
}

(async () => {
  await waitForDB();
  await initSchema();

  const [rows] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (rows.length) {
    console.log(`[seed] Default user already exists: ${email}`);
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hash]);
  console.log(`[seed] Default user created: ${email}`);
  process.exit(0);
})().catch((e) => {
  console.error('[seed] Failed:', e);
  process.exit(1);
});

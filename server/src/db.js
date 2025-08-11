import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const {
  TIDB_HOST,
  TIDB_PORT,
  TIDB_USER,
  TIDB_PASSWORD,
  TIDB_DATABASE,
  TIDB_USE_SSL
} = process.env;

export const pool = mysql.createPool({
  host: TIDB_HOST || 'localhost',
  port: Number(TIDB_PORT || 4000),
  user: TIDB_USER || 'root',
  password: TIDB_PASSWORD || '',
  database: TIDB_DATABASE || 'test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: String(TIDB_USE_SSL || 'false').toLowerCase() === 'true'
    ? { minVersion: 'TLSv1.2' }
    : undefined
});

export async function initSchema() {
  const conn = await pool.getConnection();
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await conn.query(sql);
  } finally {
    conn.release();
  }
}

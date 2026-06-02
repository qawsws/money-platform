import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
const currentDir = dirname(fileURLToPath(import.meta.url));
let sqlite;
let pool;

const mapUser = (user) => user && ({
  id: user.id,
  username: user.username,
  password_hash: user.password_hash,
  name: user.name,
  email: user.email,
  phone: user.phone,
  birthDate: user.birth_date ?? user.birthDate,
});

export async function initDb() {
  if (databaseUrl) {
    pool = new Pool({ connectionString: databaseUrl, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        birth_date TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    return;
  }

  const dataDir = resolve(currentDir, '../data');
  mkdirSync(dataDir, { recursive: true });
  sqlite = new DatabaseSync(resolve(dataDir, 'money-platform.sqlite'));
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      birth_date TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function findUserByUsername(username) {
  if (pool) return mapUser((await pool.query('SELECT * FROM users WHERE username = $1', [username])).rows[0]);
  return mapUser(sqlite.prepare('SELECT * FROM users WHERE username = ?').get(username));
}

export async function findUserByEmail(email) {
  if (pool) return mapUser((await pool.query('SELECT * FROM users WHERE email = $1', [email])).rows[0]);
  return mapUser(sqlite.prepare('SELECT * FROM users WHERE email = ?').get(email));
}

export async function createUser({ username, passwordHash, name, email, phone, birthDate }) {
  if (pool) {
    const result = await pool.query('INSERT INTO users (username, password_hash, name, email, phone, birth_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [username, passwordHash, name, email, phone, birthDate]);
    return mapUser(result.rows[0]);
  }
  sqlite.prepare('INSERT INTO users (username, password_hash, name, email, phone, birth_date) VALUES (?, ?, ?, ?, ?, ?)').run(username, passwordHash, name, email, phone, birthDate);
  return findUserByUsername(username);
}

export async function closeDb() {
  if (pool) await pool.end();
  if (sqlite) sqlite.close();
}

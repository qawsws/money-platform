import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import { communityPosts } from '../src/mock/marketData.js';

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

const countValue = (value) => {
  const text = String(value || '0').trim().toUpperCase();
  const number = Number.parseFloat(text);
  if (Number.isNaN(number)) return 0;
  return text.endsWith('K') ? Math.round(number * 1000) : Math.round(number);
};

const formatCount = (value) => {
  const number = Number(value || 0);
  if (number >= 1000) return `${Number((number / 1000).toFixed(1))}K`;
  return String(number);
};

const mapPost = (post) => post && ({
  id: post.id,
  author: post.author,
  title: post.title,
  views: formatCount(post.views),
  likes: formatCount(post.likes),
  comments: post.comments,
  category: post.category,
  score: post.score,
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id SERIAL PRIMARY KEY,
        author TEXT NOT NULL,
        title TEXT NOT NULL,
        views INTEGER NOT NULL DEFAULT 0,
        likes INTEGER NOT NULL DEFAULT 0,
        comments INTEGER NOT NULL DEFAULT 0,
        category TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorite_assets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_key TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, item_key)
      )
    `);
    await seedCommunityPosts();
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
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      title TEXT NOT NULL,
      views INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0,
      comments INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS favorite_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_key TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, item_key),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  await seedCommunityPosts();
}

async function seedCommunityPosts() {
  if (pool) {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM community_posts');
    if (rows[0]?.count > 0) return;
    for (const post of communityPosts) {
      await pool.query(
        'INSERT INTO community_posts (author, title, views, likes, comments, category, score) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [post.author, post.title, countValue(post.views), countValue(post.likes), post.comments, post.category, post.score],
      );
    }
    return;
  }

  const existing = sqlite.prepare('SELECT COUNT(*) AS count FROM community_posts').get();
  if (existing.count > 0) return;
  const insert = sqlite.prepare('INSERT INTO community_posts (author, title, views, likes, comments, category, score) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const post of communityPosts) {
    insert.run(post.author, post.title, countValue(post.views), countValue(post.likes), post.comments, post.category, post.score);
  }
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

export async function getCommunityPosts() {
  const query = 'SELECT id, author, title, views, likes, comments, category, score FROM community_posts ORDER BY score DESC, id ASC';
  if (pool) return (await pool.query(query)).rows.map(mapPost);
  return sqlite.prepare(query).all().map(mapPost);
}

export async function incrementCommunityPostMetric(id, metric) {
  if (!['likes', 'views'].includes(metric)) return null;
  if (pool) {
    const result = await pool.query(
      `UPDATE community_posts SET ${metric} = ${metric} + 1 WHERE id = $1 RETURNING id, author, title, views, likes, comments, category, score`,
      [id],
    );
    return mapPost(result.rows[0]);
  }
  const result = sqlite.prepare(`UPDATE community_posts SET ${metric} = ${metric} + 1 WHERE id = ?`).run(id);
  if (result.changes === 0) return null;
  return mapPost(sqlite.prepare('SELECT id, author, title, views, likes, comments, category, score FROM community_posts WHERE id = ?').get(id));
}

export async function getFavoriteKeys(username) {
  const user = await findUserByUsername(username);
  if (!user) return null;
  if (pool) {
    const result = await pool.query('SELECT item_key FROM favorite_assets WHERE user_id = $1 ORDER BY created_at ASC', [user.id]);
    return result.rows.map((row) => row.item_key);
  }
  return sqlite.prepare('SELECT item_key FROM favorite_assets WHERE user_id = ? ORDER BY created_at ASC').all(user.id).map((row) => row.item_key);
}

export async function toggleFavoriteKey(username, itemKey) {
  const user = await findUserByUsername(username);
  if (!user || !itemKey) return null;

  if (pool) {
    const existing = await pool.query('SELECT id FROM favorite_assets WHERE user_id = $1 AND item_key = $2', [user.id, itemKey]);
    if (existing.rows[0]) await pool.query('DELETE FROM favorite_assets WHERE user_id = $1 AND item_key = $2', [user.id, itemKey]);
    else await pool.query('INSERT INTO favorite_assets (user_id, item_key) VALUES ($1, $2)', [user.id, itemKey]);
    return getFavoriteKeys(username);
  }

  const existing = sqlite.prepare('SELECT id FROM favorite_assets WHERE user_id = ? AND item_key = ?').get(user.id, itemKey);
  if (existing) sqlite.prepare('DELETE FROM favorite_assets WHERE user_id = ? AND item_key = ?').run(user.id, itemKey);
  else sqlite.prepare('INSERT INTO favorite_assets (user_id, item_key) VALUES (?, ?)').run(user.id, itemKey);
  return getFavoriteKeys(username);
}

export async function closeDb() {
  if (pool) await pool.end();
  if (sqlite) sqlite.close();
}

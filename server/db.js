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
  isAdmin: Boolean(user.is_admin ?? user.isAdmin),
  createdAt: user.created_at ?? user.createdAt,
  adminNote: user.admin_note ?? user.adminNote ?? '',
  adminNoteUpdatedAt: user.admin_note_updated_at ?? user.adminNoteUpdatedAt,
  postsCount: Number(user.posts_count ?? user.postsCount ?? 0),
  commentsCount: Number(user.comments_count ?? user.commentsCount ?? 0),
  holdingsCount: Number(user.holdings_count ?? user.holdingsCount ?? 0),
  favoritesCount: Number(user.favorites_count ?? user.favoritesCount ?? 0),
  savedNewsCount: Number(user.saved_news_count ?? user.savedNewsCount ?? 0),
  notesCount: Number(user.notes_count ?? user.notesCount ?? 0),
});

const countValue = (value) => {
  const text = String(value || '0').trim().toUpperCase();
  const number = Number.parseFloat(text);
  if (Number.isNaN(number)) return 0;
  return text.endsWith('K') ? Math.round(number * 1000) : Math.round(number);
};

const legacyCommunitySeeds = [
  { author: '투자초심', title: '초보자를 위한 주식 투자 시작 가이드' },
  { author: '코인마스터', title: '주목할 암호화폐 5개 분석' },
  { author: '배당금사냥꾼', title: '배당률 높은 미국 주식 포트폴리오 구성' },
];

const formatCount = (value) => {
  const number = Number(value || 0);
  if (number >= 1000) return `${Number((number / 1000).toFixed(1))}K`;
  return String(number);
};

const mapPost = (post) => post && ({
  id: post.id,
  author: post.author,
  authorName: post.author_name ?? post.authorName ?? post.author,
  title: post.title,
  content: post.content,
  views: formatCount(post.views),
  likes: formatCount(post.likes),
  comments: post.comments,
  category: post.category,
  score: post.score,
  createdAt: post.created_at ?? post.createdAt,
  isHidden: Boolean(post.is_hidden ?? post.isHidden),
});

const mapAnnouncement = (notice) => notice && ({
  id: notice.id,
  title: notice.title,
  content: notice.content,
  priority: notice.priority,
  isHidden: Boolean(notice.is_hidden ?? notice.isHidden),
  createdAt: notice.created_at ?? notice.createdAt,
  updatedAt: notice.updated_at ?? notice.updatedAt,
});

const mapReport = (report) => report && ({
  id: report.id,
  targetType: report.target_type ?? report.targetType,
  targetId: report.target_id ?? report.targetId,
  reporter: report.reporter,
  reporterName: report.reporter_name ?? report.reporterName ?? report.reporter,
  reason: report.reason,
  status: report.status,
  createdAt: report.created_at ?? report.createdAt,
  targetTitle: report.target_title ?? report.targetTitle,
  targetContent: report.target_content ?? report.targetContent,
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
        is_admin BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id SERIAL PRIMARY KEY,
        author TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        views INTEGER NOT NULL DEFAULT 0,
        likes INTEGER NOT NULL DEFAULT 0,
        comments INTEGER NOT NULL DEFAULT 0,
        category TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        is_hidden BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_user_notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        note TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'normal',
        is_hidden BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS asset_notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_key TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, item_key)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_news (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        news_key TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,
        category TEXT,
        url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, news_key)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portfolio_holdings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_key TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        quantity NUMERIC NOT NULL,
        average_price NUMERIC NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, item_key)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS community_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_reports (
        id SERIAL PRIMARY KEY,
        target_type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        reporter TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await ensureCommunityContentColumn();
    await ensureCommunityHiddenColumn();
    await ensureUserAdminColumn();
    await seedCommunityPosts();
    await cleanupLegacyCommunityPosts();
    return;
  }

  const dataDir = resolve(currentDir, '../data');
  mkdirSync(dataDir, { recursive: true });
  sqlite = new DatabaseSync(resolve(dataDir, 'money-platform.sqlite'));
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      birth_date TEXT,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      views INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0,
      comments INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      is_hidden INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS admin_user_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      note TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      is_hidden INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS asset_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_key TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, item_key),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS saved_news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      news_key TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      category TEXT,
      url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, news_key),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS community_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES community_posts(id) ON DELETE CASCADE
    )
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS portfolio_holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_key TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      average_price REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, item_key),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS content_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      reporter TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await ensureCommunityContentColumn();
  await ensureCommunityHiddenColumn();
  await ensureUserAdminColumn();
  await seedCommunityPosts();
  await cleanupLegacyCommunityPosts();
}

async function ensureUserAdminColumn() {
  if (pool) {
    const result = await pool.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'is_admin'
    `);
    if (result.rowCount === 0) await pool.query('ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false');
    return;
  }

  const columns = sqlite.prepare("PRAGMA table_info('users')").all();
  if (!columns.some((column) => column.name === 'is_admin')) sqlite.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0');
}

async function ensureCommunityContentColumn() {
  if (pool) {
    const result = await pool.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'community_posts' AND column_name = 'content'
    `);
    if (result.rowCount === 0) await pool.query("ALTER TABLE community_posts ADD COLUMN content TEXT NOT NULL DEFAULT ''");
    await pool.query("UPDATE community_posts SET content = title WHERE content = ''");
    return;
  }

  const columns = sqlite.prepare("PRAGMA table_info('community_posts')").all();
  if (!columns.some((column) => column.name === 'content')) sqlite.exec("ALTER TABLE community_posts ADD COLUMN content TEXT NOT NULL DEFAULT ''");
  sqlite.prepare("UPDATE community_posts SET content = title WHERE content = ''").run();
}

const defaultContent = (post) => post.content || post.title;

async function ensureCommunityHiddenColumn() {
  if (pool) {
    const result = await pool.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'community_posts' AND column_name = 'is_hidden'
    `);
    if (result.rowCount === 0) await pool.query('ALTER TABLE community_posts ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT false');
    return;
  }

  const columns = sqlite.prepare("PRAGMA table_info('community_posts')").all();
  if (!columns.some((column) => column.name === 'is_hidden')) sqlite.exec('ALTER TABLE community_posts ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0');
}

async function seedCommunityPosts() {
  if (communityPosts.length === 0) return;

  if (pool) {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM community_posts');
    if (rows[0]?.count > 0) return;
    for (const post of communityPosts) {
      await pool.query(
        'INSERT INTO community_posts (author, title, content, views, likes, comments, category, score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [post.author, post.title, defaultContent(post), countValue(post.views), countValue(post.likes), post.comments, post.category, post.score],
      );
    }
    return;
  }

  const existing = sqlite.prepare('SELECT COUNT(*) AS count FROM community_posts').get();
  if (existing.count > 0) return;
  const insert = sqlite.prepare('INSERT INTO community_posts (author, title, content, views, likes, comments, category, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const post of communityPosts) {
    insert.run(post.author, post.title, defaultContent(post), countValue(post.views), countValue(post.likes), post.comments, post.category, post.score);
  }
}


async function cleanupLegacyCommunityPosts() {
  if (pool) {
    for (const post of legacyCommunitySeeds) {
      await pool.query('DELETE FROM community_posts WHERE author = $1 AND title = $2', [post.author, post.title]);
    }
    return;
  }

  const deletePost = sqlite.prepare('DELETE FROM community_posts WHERE author = ? AND title = ?');
  for (const post of legacyCommunitySeeds) {
    deletePost.run(post.author, post.title);
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

export async function updateUserProfile(username, profile) {
  const user = await findUserByUsername(username);
  const name = String(profile.name || '').trim();
  const email = String(profile.email || '').trim();
  const phone = String(profile.phone || '').trim();
  const birthDate = String(profile.birthDate || '').trim();
  if (!user || !name || !email || !phone) return null;

  if (pool) {
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, phone = $3, birth_date = $4 WHERE username = $5 RETURNING *',
      [name, email, phone, birthDate, username],
    );
    return mapUser(result.rows[0]);
  }
  sqlite.prepare('UPDATE users SET name = ?, email = ?, phone = ?, birth_date = ? WHERE username = ?').run(name, email, phone, birthDate, username);
  return findUserByUsername(username);
}

export async function updateUserPassword(username, passwordHash) {
  const user = await findUserByUsername(username);
  if (!user || !passwordHash) return null;
  if (pool) {
    const result = await pool.query('UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING *', [passwordHash, username]);
    return mapUser(result.rows[0]);
  }
  sqlite.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(passwordHash, username);
  return findUserByUsername(username);
}

export async function deleteUser(username) {
  const user = await findUserByUsername(username);
  if (!user) return null;
  if (pool) {
    await pool.query('DELETE FROM content_reports WHERE reporter = $1', [user.username]);
    await pool.query('DELETE FROM community_comments WHERE author = $1', [user.username]);
    await pool.query('DELETE FROM community_posts WHERE author = $1', [user.username]);
    await pool.query('DELETE FROM users WHERE username = $1', [username]);
    return true;
  }
  sqlite.prepare('DELETE FROM content_reports WHERE reporter = ?').run(user.username);
  sqlite.prepare('DELETE FROM community_comments WHERE author = ?').run(user.username);
  sqlite.prepare('DELETE FROM community_posts WHERE author = ?').run(user.username);
  sqlite.prepare('DELETE FROM users WHERE username = ?').run(username);
  return true;
}

export async function getCommunityPosts() {
  const query = 'SELECT id, author, title, content, views, likes, comments, category, score, is_hidden, created_at FROM community_posts WHERE is_hidden = $1 ORDER BY score DESC, id ASC';
  if (pool) return (await pool.query(query, [false])).rows.map(mapPost);
  return sqlite.prepare(query.replace('$1', '?')).all(0).map(mapPost);
}

async function getCommunityPostById(id) {
  const query = 'SELECT id, author, title, content, views, likes, comments, category, score, is_hidden, created_at FROM community_posts WHERE id = $1';
  if (pool) return mapPost((await pool.query(query, [id])).rows[0]);
  return mapPost(sqlite.prepare(query.replace('$1', '?')).get(id));
}

export async function createCommunityPost(username, post) {
  const user = await findUserByUsername(username);
  const title = String(post.title || '').trim();
  const content = String(post.content || '').trim();
  const category = String(post.category || '자유').trim();
  if (!user || title.length < 2 || content.length < 5) return null;

  if (pool) {
    const result = await pool.query(
      'INSERT INTO community_posts (author, title, content, category, score) VALUES ($1, $2, $3, $4, $5) RETURNING id, author, title, content, views, likes, comments, category, score, is_hidden, created_at',
      [user.username, title, content, category, 0],
    );
    return mapPost(result.rows[0]);
  }

  const result = sqlite.prepare('INSERT INTO community_posts (author, title, content, category, score) VALUES (?, ?, ?, ?, ?)').run(user.username, title, content, category, 0);
  return getCommunityPostById(result.lastInsertRowid);
}

export async function incrementCommunityPostMetric(id, metric) {
  if (!['likes', 'views'].includes(metric)) return null;
  if (pool) {
    const result = await pool.query(
      `UPDATE community_posts SET ${metric} = ${metric} + 1 WHERE id = $1 AND is_hidden = false RETURNING id, author, title, content, views, likes, comments, category, score, is_hidden, created_at`,
      [id],
    );
    return mapPost(result.rows[0]);
  }
  const result = sqlite.prepare(`UPDATE community_posts SET ${metric} = ${metric} + 1 WHERE id = ? AND is_hidden = 0`).run(id);
  if (result.changes === 0) return null;
  return getCommunityPostById(id);
}

export async function decrementCommunityPostMetric(id, metric) {
  if (!['likes'].includes(metric)) return null;
  if (pool) {
    const result = await pool.query(
      `UPDATE community_posts SET ${metric} = GREATEST(${metric} - 1, 0) WHERE id = $1 AND is_hidden = false RETURNING id, author, title, content, views, likes, comments, category, score, is_hidden, created_at`,
      [id],
    );
    return mapPost(result.rows[0]);
  }
  const result = sqlite.prepare(`UPDATE community_posts SET ${metric} = MAX(${metric} - 1, 0) WHERE id = ? AND is_hidden = 0`).run(id);
  if (result.changes === 0) return null;
  return getCommunityPostById(id);
}

const mapComment = (comment) => comment && ({
  id: comment.id,
  postId: comment.post_id ?? comment.postId,
  author: comment.author,
  authorName: comment.author_name ?? comment.authorName ?? comment.author,
  content: comment.content,
  createdAt: comment.created_at ?? comment.createdAt,
});

export async function getCommunityComments(postId) {
  if (pool) {
    const result = await pool.query('SELECT id, post_id, author, content, created_at FROM community_comments WHERE post_id = $1 ORDER BY id ASC', [postId]);
    return result.rows.map(mapComment);
  }
  return sqlite.prepare('SELECT c.id, c.post_id, c.author, COALESCE(u.name, c.author) AS author_name, c.content, c.created_at FROM community_comments c LEFT JOIN users u ON u.username = c.author WHERE c.post_id = ? ORDER BY c.id ASC').all(postId).map(mapComment);
}

export async function createCommunityComment(username, postId, content) {
  const user = await findUserByUsername(username);
  const text = String(content || '').trim();
  if (!user || !postId || text.length < 2) return null;

  if (pool) {
    const result = await pool.query(
      'INSERT INTO community_comments (post_id, author, content) VALUES ($1, $2, $3) RETURNING id, post_id, author, content, created_at',
      [postId, user.username, text],
    );
    await pool.query('UPDATE community_posts SET comments = comments + 1 WHERE id = $1', [postId]);
    return mapComment(result.rows[0]);
  }

  const result = sqlite.prepare('INSERT INTO community_comments (post_id, author, content) VALUES (?, ?, ?)').run(postId, user.username, text);
  sqlite.prepare('UPDATE community_posts SET comments = comments + 1 WHERE id = ?').run(postId);
  return mapComment(sqlite.prepare('SELECT c.id, c.post_id, c.author, COALESCE(u.name, c.author) AS author_name, c.content, c.created_at FROM community_comments c LEFT JOIN users u ON u.username = c.author WHERE c.id = ?').get(result.lastInsertRowid));
}

export async function deleteCommunityPost(username, id) {
  const user = await findUserByUsername(username);
  if (!user || !id) return null;
  if (pool) {
    const result = await pool.query('DELETE FROM community_posts WHERE id = $1 AND author = $2', [id, user.username]);
    if (result.rowCount === 0) return false;
    return getCommunityPosts();
  }
  const result = sqlite.prepare('DELETE FROM community_posts WHERE id = ? AND author = ?').run(id, user.username);
  if (result.changes === 0) return false;
  return getCommunityPosts();
}

export async function deleteCommunityComment(username, id) {
  const user = await findUserByUsername(username);
  if (!user || !id) return null;
  if (pool) {
    const existing = await pool.query('SELECT post_id FROM community_comments WHERE id = $1 AND author = $2', [id, user.username]);
    if (!existing.rows[0]) return false;
    await pool.query('DELETE FROM community_comments WHERE id = $1 AND author = $2', [id, user.username]);
    await pool.query('UPDATE community_posts SET comments = GREATEST(comments - 1, 0) WHERE id = $1', [existing.rows[0].post_id]);
    return true;
  }
  const existing = sqlite.prepare('SELECT post_id FROM community_comments WHERE id = ? AND author = ?').get(id, user.username);
  if (!existing) return false;
  sqlite.prepare('DELETE FROM community_comments WHERE id = ? AND author = ?').run(id, user.username);
  sqlite.prepare('UPDATE community_posts SET comments = MAX(comments - 1, 0) WHERE id = ?').run(existing.post_id);
  return true;
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

const mapAssetNote = (note) => note && ({
  itemKey: note.item_key ?? note.itemKey,
  note: note.note || '',
  updatedAt: note.updated_at ?? note.updatedAt,
});

export async function getAssetNote(username, itemKey) {
  const user = await findUserByUsername(username);
  if (!user || !itemKey) return null;
  if (pool) {
    const result = await pool.query('SELECT item_key, note, updated_at FROM asset_notes WHERE user_id = $1 AND item_key = $2', [user.id, itemKey]);
    return mapAssetNote(result.rows[0]) || { itemKey, note: '' };
  }
  return mapAssetNote(sqlite.prepare('SELECT item_key, note, updated_at FROM asset_notes WHERE user_id = ? AND item_key = ?').get(user.id, itemKey)) || { itemKey, note: '' };
}

export async function saveAssetNote(username, itemKey, note) {
  const user = await findUserByUsername(username);
  const text = String(note || '').trim();
  if (!user || !itemKey) return null;
  if (pool) {
    await pool.query(`
      INSERT INTO asset_notes (user_id, item_key, note, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, item_key)
      DO UPDATE SET note = EXCLUDED.note, updated_at = NOW()
    `, [user.id, itemKey, text]);
    return getAssetNote(username, itemKey);
  }
  sqlite.prepare(`
    INSERT INTO asset_notes (user_id, item_key, note, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, item_key)
    DO UPDATE SET note = excluded.note, updated_at = CURRENT_TIMESTAMP
  `).run(user.id, itemKey, text);
  return getAssetNote(username, itemKey);
}

const mapSavedNews = (item) => item && ({
  newsKey: item.news_key ?? item.newsKey,
  title: item.title,
  summary: item.summary,
  category: item.category,
  url: item.url,
  createdAt: item.created_at ?? item.createdAt,
});

export async function getSavedNews(username) {
  const user = await findUserByUsername(username);
  if (!user) return null;
  const query = 'SELECT news_key, title, summary, category, url, created_at FROM saved_news WHERE user_id = $1 ORDER BY created_at DESC, id DESC';
  if (pool) return (await pool.query(query, [user.id])).rows.map(mapSavedNews);
  return sqlite.prepare(query.replace('$1', '?')).all(user.id).map(mapSavedNews);
}

export async function toggleSavedNews(username, news) {
  const user = await findUserByUsername(username);
  const newsKey = String(news.newsKey || news.url || news.title || '').trim();
  const title = String(news.title || '').trim();
  if (!user || !newsKey || !title) return null;

  if (pool) {
    const existing = await pool.query('SELECT id FROM saved_news WHERE user_id = $1 AND news_key = $2', [user.id, newsKey]);
    if (existing.rows[0]) await pool.query('DELETE FROM saved_news WHERE user_id = $1 AND news_key = $2', [user.id, newsKey]);
    else await pool.query('INSERT INTO saved_news (user_id, news_key, title, summary, category, url) VALUES ($1, $2, $3, $4, $5, $6)', [user.id, newsKey, title, news.summary || '', news.category || '', news.url || '']);
    return getSavedNews(username);
  }

  const existing = sqlite.prepare('SELECT id FROM saved_news WHERE user_id = ? AND news_key = ?').get(user.id, newsKey);
  if (existing) sqlite.prepare('DELETE FROM saved_news WHERE user_id = ? AND news_key = ?').run(user.id, newsKey);
  else sqlite.prepare('INSERT INTO saved_news (user_id, news_key, title, summary, category, url) VALUES (?, ?, ?, ?, ?, ?)').run(user.id, newsKey, title, news.summary || '', news.category || '', news.url || '');
  return getSavedNews(username);
}

export async function deleteSavedNews(username, newsKey) {
  const user = await findUserByUsername(username);
  if (!user || !newsKey) return null;
  if (pool) {
    await pool.query('DELETE FROM saved_news WHERE user_id = $1 AND news_key = $2', [user.id, newsKey]);
    return getSavedNews(username);
  }
  sqlite.prepare('DELETE FROM saved_news WHERE user_id = ? AND news_key = ?').run(user.id, newsKey);
  return getSavedNews(username);
}

export async function getUserDashboard(username) {
  const user = await findUserByUsername(username);
  if (!user) return null;

  if (pool) {
    const [posts, comments, notes, news, holdings, favorites] = await Promise.all([
      pool.query('SELECT id, author, title, content, views, likes, comments, category, score, is_hidden, created_at FROM community_posts WHERE author = $1 ORDER BY created_at DESC, id DESC', [user.username]),
      pool.query('SELECT id, post_id, author, content, created_at FROM community_comments WHERE author = $1 ORDER BY created_at DESC, id DESC', [user.username]),
      pool.query('SELECT item_key, note, updated_at FROM asset_notes WHERE user_id = $1 AND note <> $2 ORDER BY updated_at DESC, id DESC', [user.id, '']),
      pool.query('SELECT news_key, title, summary, category, url, created_at FROM saved_news WHERE user_id = $1 ORDER BY created_at DESC, id DESC', [user.id]),
      pool.query('SELECT COUNT(*)::int AS count FROM portfolio_holdings WHERE user_id = $1', [user.id]),
      pool.query('SELECT COUNT(*)::int AS count FROM favorite_assets WHERE user_id = $1', [user.id]),
    ]);
    return { posts: posts.rows.map(mapPost), comments: comments.rows.map(mapComment), notes: notes.rows.map(mapAssetNote), news: news.rows.map(mapSavedNews), counts: { posts: posts.rowCount, comments: comments.rowCount, notes: notes.rowCount, news: news.rowCount, holdings: holdings.rows[0]?.count || 0, favorites: favorites.rows[0]?.count || 0 } };
  }

  const posts = sqlite.prepare('SELECT p.id, p.author, COALESCE(u.name, p.author) AS author_name, p.title, p.content, p.views, p.likes, p.comments, p.category, p.score, p.is_hidden, p.created_at FROM community_posts p LEFT JOIN users u ON u.username = p.author WHERE p.author = ? ORDER BY p.created_at DESC, p.id DESC').all(user.username).map(mapPost);
  const comments = sqlite.prepare('SELECT c.id, c.post_id, c.author, COALESCE(u.name, c.author) AS author_name, c.content, c.created_at FROM community_comments c LEFT JOIN users u ON u.username = c.author WHERE c.author = ? ORDER BY c.created_at DESC, c.id DESC').all(user.username).map(mapComment);
  const notes = sqlite.prepare("SELECT item_key, note, updated_at FROM asset_notes WHERE user_id = ? AND note <> '' ORDER BY updated_at DESC, id DESC").all(user.id).map(mapAssetNote);
  const news = sqlite.prepare('SELECT news_key, title, summary, category, url, created_at FROM saved_news WHERE user_id = ? ORDER BY created_at DESC, id DESC').all(user.id).map(mapSavedNews);
  const holdings = sqlite.prepare('SELECT COUNT(*) AS count FROM portfolio_holdings WHERE user_id = ?').get(user.id).count;
  const favorites = sqlite.prepare('SELECT COUNT(*) AS count FROM favorite_assets WHERE user_id = ?').get(user.id).count;
  return { posts, comments, notes, news, counts: { posts: posts.length, comments: comments.length, notes: notes.length, news: news.length, holdings, favorites } };
}

export async function getAdminDashboard() {
  if (pool) {
    const [users, posts, comments, notices, reports, savedNews, holdings, favorites] = await Promise.all([
      pool.query(`
        SELECT
          u.id,
          u.username,
          u.name,
          u.email,
          u.phone,
          u.birth_date,
          u.is_admin,
          u.created_at,
          COALESCE(n.note, '') AS admin_note,
          n.updated_at AS admin_note_updated_at,
          (SELECT COUNT(*)::int FROM community_posts WHERE author = u.username) AS posts_count,
          (SELECT COUNT(*)::int FROM community_comments WHERE author = u.username) AS comments_count,
          (SELECT COUNT(*)::int FROM portfolio_holdings WHERE user_id = u.id) AS holdings_count,
          (SELECT COUNT(*)::int FROM favorite_assets WHERE user_id = u.id) AS favorites_count,
          (SELECT COUNT(*)::int FROM saved_news WHERE user_id = u.id) AS saved_news_count,
          (SELECT COUNT(*)::int FROM asset_notes WHERE user_id = u.id AND note <> '') AS notes_count
        FROM users u
        LEFT JOIN admin_user_notes n ON n.user_id = u.id
        ORDER BY u.id DESC
      `),
      pool.query('SELECT p.id, p.author, COALESCE(u.name, p.author) AS author_name, p.title, p.content, p.views, p.likes, p.comments, p.category, p.score, p.is_hidden, p.created_at FROM community_posts p LEFT JOIN users u ON u.username = p.author ORDER BY p.created_at DESC, p.id DESC'),
      pool.query('SELECT c.id, c.post_id, c.author, COALESCE(u.name, c.author) AS author_name, c.content, c.created_at FROM community_comments c LEFT JOIN users u ON u.username = c.author ORDER BY c.created_at DESC, c.id DESC'),
      pool.query('SELECT id, title, content, priority, is_hidden, created_at, updated_at FROM announcements ORDER BY CASE priority WHEN $1 THEN 0 ELSE 1 END, updated_at DESC, id DESC', ['important']),
      pool.query(`
        SELECT
          r.id,
          r.target_type,
          r.target_id,
          r.reporter,
          r.reason,
          r.status,
          r.created_at,
          COALESCE(p.title, '') AS target_title,
          COALESCE(c.content, p.content, '') AS target_content,
          COALESCE(ru.name, r.reporter) AS reporter_name
        FROM content_reports r
        LEFT JOIN community_posts p ON r.target_type = 'post' AND p.id = r.target_id
        LEFT JOIN community_comments c ON r.target_type = 'comment' AND c.id = r.target_id
        LEFT JOIN users ru ON ru.username = r.reporter
        ORDER BY CASE r.status WHEN 'open' THEN 0 ELSE 1 END, r.id DESC
      `),
      pool.query('SELECT COUNT(*)::int AS count FROM saved_news'),
      pool.query('SELECT COUNT(*)::int AS count FROM portfolio_holdings'),
      pool.query('SELECT COUNT(*)::int AS count FROM favorite_assets'),
    ]);
    return {
      users: users.rows.map(mapUser),
      posts: posts.rows.map(mapPost),
      comments: comments.rows.map(mapComment),
      notices: notices.rows.map(mapAnnouncement),
      reports: reports.rows.map(mapReport),
      counts: { users: users.rowCount, posts: posts.rowCount, comments: comments.rowCount, notices: notices.rowCount, reports: reports.rowCount, savedNews: savedNews.rows[0]?.count || 0, holdings: holdings.rows[0]?.count || 0, favorites: favorites.rows[0]?.count || 0 },
    };
  }

  const users = sqlite.prepare(`
    SELECT
      u.id,
      u.username,
      u.name,
      u.email,
      u.phone,
      u.birth_date,
      u.is_admin,
      u.created_at,
      COALESCE(n.note, '') AS admin_note,
      n.updated_at AS admin_note_updated_at,
      (SELECT COUNT(*) FROM community_posts WHERE author = u.username) AS posts_count,
      (SELECT COUNT(*) FROM community_comments WHERE author = u.username) AS comments_count,
      (SELECT COUNT(*) FROM portfolio_holdings WHERE user_id = u.id) AS holdings_count,
      (SELECT COUNT(*) FROM favorite_assets WHERE user_id = u.id) AS favorites_count,
      (SELECT COUNT(*) FROM saved_news WHERE user_id = u.id) AS saved_news_count,
      (SELECT COUNT(*) FROM asset_notes WHERE user_id = u.id AND note <> '') AS notes_count
    FROM users u
    LEFT JOIN admin_user_notes n ON n.user_id = u.id
    ORDER BY u.id DESC
  `).all().map(mapUser);
  const posts = sqlite.prepare('SELECT p.id, p.author, COALESCE(u.name, p.author) AS author_name, p.title, p.content, p.views, p.likes, p.comments, p.category, p.score, p.is_hidden, p.created_at FROM community_posts p LEFT JOIN users u ON u.username = p.author ORDER BY p.created_at DESC, p.id DESC').all().map(mapPost);
  const comments = sqlite.prepare('SELECT c.id, c.post_id, c.author, COALESCE(u.name, c.author) AS author_name, c.content, c.created_at FROM community_comments c LEFT JOIN users u ON u.username = c.author ORDER BY c.created_at DESC, c.id DESC').all().map(mapComment);
  const notices = sqlite.prepare("SELECT id, title, content, priority, is_hidden, created_at, updated_at FROM announcements ORDER BY CASE priority WHEN 'important' THEN 0 ELSE 1 END, updated_at DESC, id DESC").all().map(mapAnnouncement);
  const reports = await getContentReports();
  const savedNews = sqlite.prepare('SELECT COUNT(*) AS count FROM saved_news').get().count;
  const holdings = sqlite.prepare('SELECT COUNT(*) AS count FROM portfolio_holdings').get().count;
  const favorites = sqlite.prepare('SELECT COUNT(*) AS count FROM favorite_assets').get().count;
  return { users, posts, comments, notices, reports, counts: { users: users.length, posts: posts.length, comments: comments.length, notices: notices.length, reports: reports.length, savedNews, holdings, favorites } };
}

export async function setUserAdmin(id, isAdmin) {
  if (!id) return null;
  const nextValue = Boolean(isAdmin);
  if (pool) {
    const result = await pool.query(
      'UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING id, username, password_hash, name, email, phone, birth_date, is_admin, created_at',
      [nextValue, id],
    );
    return mapUser(result.rows[0]);
  }
  const result = sqlite.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(nextValue ? 1 : 0, id);
  if (result.changes === 0) return null;
  return mapUser(sqlite.prepare('SELECT id, username, password_hash, name, email, phone, birth_date, is_admin, created_at FROM users WHERE id = ?').get(id));
}

export async function saveAdminUserNote(id, note) {
  if (!id) return null;
  const text = String(note || '').trim();
  if (pool) {
    const existing = (await pool.query('SELECT id FROM users WHERE id = $1', [id])).rows[0];
    if (!existing) return null;
    await pool.query(`
      INSERT INTO admin_user_notes (user_id, note, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET note = EXCLUDED.note, updated_at = NOW()
    `, [id, text]);
    const result = await pool.query('SELECT id, username, password_hash, name, email, phone, birth_date, is_admin, created_at FROM users WHERE id = $1', [id]);
    return { ...mapUser(result.rows[0]), adminNote: text };
  }
  const existing = sqlite.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existing) return null;
  sqlite.prepare(`
    INSERT INTO admin_user_notes (user_id, note, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id)
    DO UPDATE SET note = excluded.note, updated_at = CURRENT_TIMESTAMP
  `).run(id, text);
  return { ...mapUser(sqlite.prepare('SELECT id, username, password_hash, name, email, phone, birth_date, is_admin, created_at FROM users WHERE id = ?').get(id)), adminNote: text };
}

export async function deleteUserByAdmin(id) {
  if (!id) return null;
  if (pool) {
    const user = (await pool.query('SELECT username FROM users WHERE id = $1', [id])).rows[0];
    if (!user) return false;
    await pool.query('DELETE FROM community_comments WHERE author = $1', [user.username]);
    await pool.query('DELETE FROM community_posts WHERE author = $1', [user.username]);
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return true;
  }
  const user = sqlite.prepare('SELECT username FROM users WHERE id = ?').get(id);
  if (!user) return false;
  sqlite.prepare('DELETE FROM community_comments WHERE author = ?').run(user.username);
  sqlite.prepare('DELETE FROM community_posts WHERE author = ?').run(user.username);
  sqlite.prepare('DELETE FROM users WHERE id = ?').run(id);
  return true;
}

export async function deleteCommunityPostByAdmin(id) {
  if (!id) return null;
  if (pool) {
    await pool.query('DELETE FROM community_posts WHERE id = $1', [id]);
    return true;
  }
  sqlite.prepare('DELETE FROM community_posts WHERE id = ?').run(id);
  return true;
}

export async function setCommunityPostHidden(id, isHidden) {
  if (!id) return null;
  const nextValue = Boolean(isHidden);
  if (pool) {
    const result = await pool.query(
      'UPDATE community_posts SET is_hidden = $1 WHERE id = $2 RETURNING id, author, title, content, views, likes, comments, category, score, is_hidden, created_at',
      [nextValue, id],
    );
    return mapPost(result.rows[0]);
  }
  const result = sqlite.prepare('UPDATE community_posts SET is_hidden = ? WHERE id = ?').run(nextValue ? 1 : 0, id);
  if (result.changes === 0) return null;
  return getCommunityPostById(id);
}

export async function getAnnouncements({ includeHidden = false } = {}) {
  const filter = includeHidden ? '' : 'WHERE is_hidden = $1';
  const query = `SELECT id, title, content, priority, is_hidden, created_at, updated_at FROM announcements ${filter} ORDER BY CASE priority WHEN 'important' THEN 0 ELSE 1 END, updated_at DESC, id DESC`;
  if (pool) return (await pool.query(query, includeHidden ? [] : [false])).rows.map(mapAnnouncement);
  return sqlite.prepare(query.replace('WHERE is_hidden = $1', includeHidden ? '' : 'WHERE is_hidden = ?')).all(...(includeHidden ? [] : [0])).map(mapAnnouncement);
}

export async function createAnnouncement(notice) {
  const title = String(notice.title || '').trim();
  const content = String(notice.content || '').trim();
  const priority = notice.priority === 'important' ? 'important' : 'normal';
  if (title.length < 2 || content.length < 5) return null;

  if (pool) {
    const result = await pool.query(
      'INSERT INTO announcements (title, content, priority) VALUES ($1, $2, $3) RETURNING id, title, content, priority, is_hidden, created_at, updated_at',
      [title, content, priority],
    );
    return mapAnnouncement(result.rows[0]);
  }
  const result = sqlite.prepare('INSERT INTO announcements (title, content, priority) VALUES (?, ?, ?)').run(title, content, priority);
  return mapAnnouncement(sqlite.prepare('SELECT id, title, content, priority, is_hidden, created_at, updated_at FROM announcements WHERE id = ?').get(result.lastInsertRowid));
}

export async function updateAnnouncement(id, notice) {
  if (!id) return null;
  const title = String(notice.title || '').trim();
  const content = String(notice.content || '').trim();
  const priority = notice.priority === 'important' ? 'important' : 'normal';
  if (title.length < 2 || content.length < 5) return null;

  if (pool) {
    const result = await pool.query(
      'UPDATE announcements SET title = $1, content = $2, priority = $3, updated_at = NOW() WHERE id = $4 RETURNING id, title, content, priority, is_hidden, created_at, updated_at',
      [title, content, priority, id],
    );
    return mapAnnouncement(result.rows[0]);
  }
  const result = sqlite.prepare('UPDATE announcements SET title = ?, content = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(title, content, priority, id);
  if (result.changes === 0) return null;
  return mapAnnouncement(sqlite.prepare('SELECT id, title, content, priority, is_hidden, created_at, updated_at FROM announcements WHERE id = ?').get(id));
}

export async function setAnnouncementHidden(id, isHidden) {
  if (!id) return null;
  const nextValue = Boolean(isHidden);
  if (pool) {
    const result = await pool.query(
      'UPDATE announcements SET is_hidden = $1, updated_at = NOW() WHERE id = $2 RETURNING id, title, content, priority, is_hidden, created_at, updated_at',
      [nextValue, id],
    );
    return mapAnnouncement(result.rows[0]);
  }
  const result = sqlite.prepare('UPDATE announcements SET is_hidden = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(nextValue ? 1 : 0, id);
  if (result.changes === 0) return null;
  return mapAnnouncement(sqlite.prepare('SELECT id, title, content, priority, is_hidden, created_at, updated_at FROM announcements WHERE id = ?').get(id));
}

export async function deleteAnnouncement(id) {
  if (!id) return null;
  if (pool) {
    const result = await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
  return sqlite.prepare('DELETE FROM announcements WHERE id = ?').run(id).changes > 0;
}

export async function createContentReport(username, report) {
  const user = await findUserByUsername(username);
  const targetType = report.targetType === 'comment' ? 'comment' : 'post';
  const targetId = Number(report.targetId);
  const reason = String(report.reason || '').trim();
  if (!user || !targetId || reason.length < 2) return null;

  if (pool) {
    const result = await pool.query(
      'INSERT INTO content_reports (target_type, target_id, reporter, reason) VALUES ($1, $2, $3, $4) RETURNING id, target_type, target_id, reporter, reason, status, created_at',
      [targetType, targetId, user.username, reason],
    );
    return mapReport(result.rows[0]);
  }
  const result = sqlite.prepare('INSERT INTO content_reports (target_type, target_id, reporter, reason) VALUES (?, ?, ?, ?)').run(targetType, targetId, user.username, reason);
  return mapReport(sqlite.prepare('SELECT id, target_type, target_id, reporter, reason, status, created_at FROM content_reports WHERE id = ?').get(result.lastInsertRowid));
}

export async function getContentReports() {
  if (pool) {
    const result = await pool.query(`
      SELECT
        r.id,
        r.target_type,
        r.target_id,
        r.reporter,
        r.reason,
        r.status,
        r.created_at,
        COALESCE(p.title, '') AS target_title,
        COALESCE(c.content, p.content, '') AS target_content
      FROM content_reports r
      LEFT JOIN community_posts p ON r.target_type = 'post' AND p.id = r.target_id
      LEFT JOIN community_comments c ON r.target_type = 'comment' AND c.id = r.target_id
      ORDER BY CASE r.status WHEN 'open' THEN 0 ELSE 1 END, r.id DESC
    `);
    return result.rows.map(mapReport);
  }
  return sqlite.prepare(`
    SELECT
      r.id,
      r.target_type,
      r.target_id,
      r.reporter,
      r.reason,
      r.status,
      r.created_at,
      COALESCE(p.title, '') AS target_title,
      COALESCE(c.content, p.content, '') AS target_content,
      COALESCE(ru.name, r.reporter) AS reporter_name
    FROM content_reports r
    LEFT JOIN community_posts p ON r.target_type = 'post' AND p.id = r.target_id
    LEFT JOIN community_comments c ON r.target_type = 'comment' AND c.id = r.target_id
    LEFT JOIN users ru ON ru.username = r.reporter
    ORDER BY CASE r.status WHEN 'open' THEN 0 ELSE 1 END, r.id DESC
  `).all().map(mapReport);
}

export async function updateContentReportStatus(id, status) {
  if (!id) return null;
  const nextStatus = status === 'resolved' ? 'resolved' : 'open';
  if (pool) {
    const result = await pool.query(
      'UPDATE content_reports SET status = $1 WHERE id = $2 RETURNING id, target_type, target_id, reporter, reason, status, created_at',
      [nextStatus, id],
    );
    return mapReport(result.rows[0]);
  }
  const result = sqlite.prepare('UPDATE content_reports SET status = ? WHERE id = ?').run(nextStatus, id);
  if (result.changes === 0) return null;
  return mapReport(sqlite.prepare('SELECT id, target_type, target_id, reporter, reason, status, created_at FROM content_reports WHERE id = ?').get(id));
}

export async function deleteContentReport(id) {
  if (!id) return null;
  if (pool) {
    const result = await pool.query('DELETE FROM content_reports WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
  return sqlite.prepare('DELETE FROM content_reports WHERE id = ?').run(id).changes > 0;
}

export async function deleteCommunityCommentByAdmin(id) {
  if (!id) return null;
  if (pool) {
    const existing = await pool.query('SELECT post_id FROM community_comments WHERE id = $1', [id]);
    if (!existing.rows[0]) return false;
    await pool.query('DELETE FROM community_comments WHERE id = $1', [id]);
    await pool.query('UPDATE community_posts SET comments = GREATEST(comments - 1, 0) WHERE id = $1', [existing.rows[0].post_id]);
    return true;
  }
  const existing = sqlite.prepare('SELECT post_id FROM community_comments WHERE id = ?').get(id);
  if (!existing) return false;
  sqlite.prepare('DELETE FROM community_comments WHERE id = ?').run(id);
  sqlite.prepare('UPDATE community_posts SET comments = MAX(comments - 1, 0) WHERE id = ?').run(existing.post_id);
  return true;
}

const mapHolding = (holding) => holding && ({
  id: holding.id,
  itemKey: holding.item_key ?? holding.itemKey,
  assetType: holding.asset_type ?? holding.assetType,
  symbol: holding.symbol,
  name: holding.name,
  quantity: Number(holding.quantity),
  averagePrice: Number(holding.average_price ?? holding.averagePrice),
});

export async function getPortfolioHoldings(username) {
  const user = await findUserByUsername(username);
  if (!user) return null;
  const query = 'SELECT id, item_key, asset_type, symbol, name, quantity, average_price FROM portfolio_holdings WHERE user_id = $1 ORDER BY updated_at DESC, id DESC';
  if (pool) return (await pool.query(query, [user.id])).rows.map(mapHolding);
  return sqlite.prepare(query.replace('$1', '?')).all(user.id).map(mapHolding);
}

export async function savePortfolioHolding(username, holding) {
  const user = await findUserByUsername(username);
  const quantity = Number(holding.quantity);
  const averagePrice = Number(holding.averagePrice);
  if (!user || !holding.itemKey || !holding.assetType || !holding.symbol || !holding.name || quantity <= 0 || averagePrice < 0) return null;

  if (pool) {
    await pool.query(`
      INSERT INTO portfolio_holdings (user_id, item_key, asset_type, symbol, name, quantity, average_price, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id, item_key)
      DO UPDATE SET quantity = EXCLUDED.quantity, average_price = EXCLUDED.average_price, symbol = EXCLUDED.symbol, name = EXCLUDED.name, asset_type = EXCLUDED.asset_type, updated_at = NOW()
    `, [user.id, holding.itemKey, holding.assetType, holding.symbol, holding.name, quantity, averagePrice]);
    return getPortfolioHoldings(username);
  }

  sqlite.prepare(`
    INSERT INTO portfolio_holdings (user_id, item_key, asset_type, symbol, name, quantity, average_price, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, item_key)
    DO UPDATE SET quantity = excluded.quantity, average_price = excluded.average_price, symbol = excluded.symbol, name = excluded.name, asset_type = excluded.asset_type, updated_at = CURRENT_TIMESTAMP
  `).run(user.id, holding.itemKey, holding.assetType, holding.symbol, holding.name, quantity, averagePrice);
  return getPortfolioHoldings(username);
}

export async function deletePortfolioHolding(username, itemKey) {
  const user = await findUserByUsername(username);
  if (!user || !itemKey) return null;
  if (pool) {
    await pool.query('DELETE FROM portfolio_holdings WHERE user_id = $1 AND item_key = $2', [user.id, itemKey]);
    return getPortfolioHoldings(username);
  }
  sqlite.prepare('DELETE FROM portfolio_holdings WHERE user_id = ? AND item_key = ?').run(user.id, itemKey);
  return getPortfolioHoldings(username);
}

export async function closeDb() {
  if (pool) await pool.end();
  if (sqlite) sqlite.close();
}


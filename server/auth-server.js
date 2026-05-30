import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const PORT = Number(process.env.AUTH_PORT || 3001);
const currentDir = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(currentDir, '../data');
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(resolve(dataDir, 'money-platform.sqlite'));
db.exec(`
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

const findUserByUsername = db.prepare(`
  SELECT id, username, password_hash, name, email, phone, birth_date AS birthDate
  FROM users
  WHERE username = ?
`);
const findUserByEmail = db.prepare('SELECT id FROM users WHERE email = ?');
const insertUser = db.prepare(`
  INSERT INTO users (username, password_hash, name, email, phone, birth_date)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const json = (response, status, body) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
};

const publicUser = (user) => {
  const result = { ...user };
  delete result.password_hash;
  return result;
};

function passwordHash(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function passwordMatches(password, stored) {
  const [salt, hash] = stored.split(':');
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function tokenFor(user) {
  return Buffer.from(`${user.id}:${user.username}:${Date.now()}`).toString('base64url');
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function signup(request, response) {
  const { username, password, name, email, phone, birthDate = '', consent } = await readBody(request);
  if (!username || !password || !name || !email || !phone || !consent) {
    return json(response, 400, { message: '\uD544\uC218 \uD56D\uBAA9\uC744 \uBAA8\uB450 \uC785\uB825\uD574 \uC8FC\uC138\uC694.' });
  }
  if (username.length < 4) return json(response, 400, { message: '\uC544\uC774\uB514\uB294 4\uC790 \uC774\uC0C1 \uC785\uB825\uD574 \uC8FC\uC138\uC694.' });
  if (password.length < 8) return json(response, 400, { message: '\uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1 \uC785\uB825\uD574 \uC8FC\uC138\uC694.' });
  if (findUserByUsername.get(username)) return json(response, 409, { message: '\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uC544\uC774\uB514\uC785\uB2C8\uB2E4.' });
  if (findUserByEmail.get(email)) return json(response, 409, { message: '\uC774\uBBF8 \uAC00\uC785\uB41C \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4.' });

  const result = insertUser.run(username, passwordHash(password), name, email, phone, birthDate);
  const user = publicUser(findUserByUsername.get(username));
  return json(response, 201, { success: true, user, token: tokenFor({ ...user, id: result.lastInsertRowid }) });
}

async function login(request, response) {
  const { username, password } = await readBody(request);
  const user = username ? findUserByUsername.get(username) : null;
  if (!user || !password || !passwordMatches(password, user.password_hash)) {
    return json(response, 401, { message: '\uC544\uC774\uB514 \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.' });
  }
  return json(response, 200, { success: true, user: publicUser(user), token: tokenFor(user) });
}

export const server = createServer(async (request, response) => {
  try {
    if (request.method === 'GET' && request.url === '/api/auth/health') return json(response, 200, { ok: true });
    if (request.method === 'POST' && request.url === '/api/auth/signup') return await signup(request, response);
    if (request.method === 'POST' && request.url === '/api/auth/login') return await login(request, response);
    return json(response, 404, { message: 'Not found' });
  } catch (error) {
    console.error(error);
    return json(response, 500, { message: '\uC11C\uBC84 \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Auth API listening on http://127.0.0.1:${PORT}`);
});

server.on('close', () => db.close());

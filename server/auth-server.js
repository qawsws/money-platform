import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { closeDb, createUser, findUserByEmail, findUserByUsername, getCommunityPosts, getFavoriteKeys, incrementCommunityPostMetric, initDb, toggleFavoriteKey } from './db.js';
import { issueToken, verifyToken } from './token.js';
import { getCryptoPricesLive, getMarketIndicesLive, getNewsLive, getUsStocksLive } from './market-data.js';

const port = Number(process.env.PORT || process.env.AUTH_PORT || 3001);
const host = process.env.HOST || '0.0.0.0';
const dist = resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const json = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(body)); };
const publicUser = (user) => { const result = { ...user }; delete result.password_hash; return result; };
const hashPassword = (password) => { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`; };
const matches = (password, stored) => { const [salt, hash] = stored.split(':'); const expected = Buffer.from(hash, 'hex'); const actual = scryptSync(password, salt, 64); return expected.length === actual.length && timingSafeEqual(expected, actual); };
const body = async (request) => { const chunks = []; for await (const chunk of request) chunks.push(chunk); return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); };

async function signup(request, response) {
  const profile = await body(request);
  const { username, password, name, email, phone, birthDate = '', consent } = profile;
  if (!username || !password || !name || !email || !phone || !consent) return json(response, 400, { message: '\uD544\uC218 \uD56D\uBAA9\uC744 \uBAA8\uB450 \uC785\uB825\uD574 \uC8FC\uC138\uC694.' });
  if (username.length < 4) return json(response, 400, { message: '\uC544\uC774\uB514\uB294 4\uC790 \uC774\uC0C1 \uC785\uB825\uD574 \uC8FC\uC138\uC694.' });
  if (password.length < 8) return json(response, 400, { message: '\uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1 \uC785\uB825\uD574 \uC8FC\uC138\uC694.' });
  if (await findUserByUsername(username)) return json(response, 409, { message: '\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uC544\uC774\uB514\uC785\uB2C8\uB2E4.' });
  if (await findUserByEmail(email)) return json(response, 409, { message: '\uC774\uBBF8 \uAC00\uC785\uB41C \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4.' });
  const user = publicUser(await createUser({ ...profile, passwordHash: hashPassword(password), birthDate }));
  return json(response, 201, { success: true, user, token: issueToken(user) });
}

async function login(request, response) {
  const { username, password } = await body(request); const user = username && await findUserByUsername(username);
  if (!user || !password || !matches(password, user.password_hash)) return json(response, 401, { message: '\uC544\uC774\uB514 \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.' });
  const clean = publicUser(user); return json(response, 200, { success: true, user: clean, token: issueToken(clean) });
}

async function me(request, response) {
  const claims = verifyToken(request.headers.authorization?.replace(/^Bearer /, '')); const user = claims && await findUserByUsername(claims.username);
  return user ? json(response, 200, { success: true, user: publicUser(user) }) : json(response, 401, { message: '\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.' });
}

async function requireUser(request, response) {
  const claims = verifyToken(request.headers.authorization?.replace(/^Bearer /, ''));
  const user = claims && await findUserByUsername(claims.username);
  if (!user) {
    json(response, 401, { message: '\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.' });
    return null;
  }
  return user;
}

async function favorites(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  return json(response, 200, { success: true, favorites: await getFavoriteKeys(user.username) });
}

async function favoriteToggle(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const { id } = await body(request);
  const favorites = await toggleFavoriteKey(user.username, id);
  return favorites ? json(response, 200, { success: true, favorites }) : json(response, 400, { message: '\uC990\uACA8\uCC3E\uAE30 \uB300\uC0C1\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.' });
}

function serveFile(response, path) {
  const file = existsSync(path) && statSync(path).isFile() ? path : resolve(dist, 'index.html');
  if (!existsSync(file)) return json(response, 404, { message: 'Not found' });
  response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }); createReadStream(file).pipe(response);
}

export const server = createServer(async (request, response) => {
  try {
    const { pathname } = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (request.method === 'GET' && pathname === '/api/auth/health') return json(response, 200, { ok: true });
    if (request.method === 'POST' && pathname === '/api/auth/signup') return await signup(request, response);
    if (request.method === 'POST' && pathname === '/api/auth/login') return await login(request, response);
    if (request.method === 'GET' && pathname === '/api/auth/me') return await me(request, response);
    if (request.method === 'GET' && pathname === '/api/favorites') return await favorites(request, response);
    if (request.method === 'POST' && pathname === '/api/favorites/toggle') return await favoriteToggle(request, response);
    if (request.method === 'GET' && pathname === '/api/market/indices') return json(response, 200, await getMarketIndicesLive());
    if (request.method === 'GET' && pathname === '/api/crypto') return json(response, 200, await getCryptoPricesLive());
    if (request.method === 'GET' && pathname === '/api/stocks/us') return json(response, 200, await getUsStocksLive());
    if (request.method === 'GET' && pathname === '/api/news') return json(response, 200, await getNewsLive());
    if (request.method === 'GET' && pathname === '/api/community') return json(response, 200, await getCommunityPosts());
    if (request.method === 'POST' && pathname === '/api/community/like') { const { id } = await body(request); const post = await incrementCommunityPostMetric(id, 'likes'); return json(response, post ? 200 : 404, { success: Boolean(post), post }); }
    if (request.method === 'POST' && pathname === '/api/community/view') { const { id } = await body(request); const post = await incrementCommunityPostMetric(id, 'views'); return json(response, post ? 200 : 404, { success: Boolean(post), post }); }
    if (pathname.startsWith('/api/')) return json(response, 404, { message: 'Not found' });
    return serveFile(response, resolve(dist, `.${pathname}`));
  } catch (error) { console.error(error); return json(response, 500, { message: '\uC11C\uBC84 \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.' }); }
});

await initDb();
server.listen(port, host, () => console.log(`MoneyPlatform server listening on http://${host}:${port}`));

export async function shutdown() {
  await new Promise((done) => server.close(done));
  await closeDb();
}

process.on('SIGTERM', () => shutdown().then(() => process.exit(0)));
process.on('SIGINT', () => shutdown().then(() => process.exit(0)));

import './env.js';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { closeDb, createAnnouncement, createCommunityComment, createCommunityPost, createContentReport, createUser, decrementCommunityPostMetric, deleteAnnouncement, deleteCommunityComment, deleteCommunityCommentByAdmin, deleteCommunityPost, deleteCommunityPostByAdmin, deleteContentReport, deletePortfolioHolding, deleteSavedNews, deleteUser, deleteUserByAdmin, findUserByEmail, findUserByUsername, getAdminDashboard, getAnnouncements, getAssetNote, getCommunityComments, getCommunityPosts, getFavoriteKeys, getPortfolioHoldings, getSavedNews, getUserDashboard, incrementCommunityPostMetric, initDb, saveAdminUserNote, saveAssetNote, savePortfolioHolding, setAnnouncementHidden, setCommunityPostHidden, setUserAdmin, toggleFavoriteKey, toggleSavedNews, updateAnnouncement, updateContentReportStatus, updateUserPassword, updateUserProfile } from './db.js';
import { issueToken, verifyToken } from './token.js';
import { getCryptoPricesLive, getKoreanStocksLive, getMarketDataStatus, getMarketIndicesLive, getNewsLive, getUsStocksLive } from './market-data.js';
import { AiError, AI_MESSAGES } from './ai/ai-errors.js';
import { analyzePortfolio, assertAiAvailable, createInvestmentInsights, summarizeNews } from './ai/ai-service.js';

const port = Number(process.env.PORT || process.env.AUTH_PORT || 3001);
const host = process.env.HOST || '0.0.0.0';
const dist = resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const json = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(body)); };
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.publicMessage = message;
  }
}
const bodyLimitBytes = Number(process.env.BODY_LIMIT_BYTES || 128_000);
const authLimitWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 60_000);
const authLimitMax = Number(process.env.AUTH_RATE_LIMIT_MAX || 12);
const authAttempts = new Map();
const publicUser = (user) => { const result = { ...user }; delete result.password_hash; return result; };
const hashPassword = (password) => { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`; };
const matches = (password, stored) => { const [salt, hash] = stored.split(':'); const expected = Buffer.from(hash, 'hex'); const actual = scryptSync(password, salt, 64); return expected.length === actual.length && timingSafeEqual(expected, actual); };
const body = async (request, maxBytes = bodyLimitBytes) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new HttpError(413, 'Request body is too large.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw new HttpError(400, 'Invalid request body.');
  }
};
const clientKey = (request) => String(request.headers['x-forwarded-for'] || '').split(',')[0].trim() || request.socket.remoteAddress || 'anonymous';
function allowAuthAttempt(request, scope) {
  const now = Date.now();
  const key = `${scope}:${clientKey(request)}`;
  const bucket = authAttempts.get(key) || [];
  const recent = bucket.filter((time) => now - time < authLimitWindowMs);
  if (recent.length >= authLimitMax) {
    authAttempts.set(key, recent);
    return false;
  }
  recent.push(now);
  authAttempts.set(key, recent);
  return true;
}
const aiBody = async (request, maxBytes = 64_000) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new AiError('REQUEST_TOO_LARGE', AI_MESSAGES.requestTooLarge, 413);
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
};

async function signup(request, response) {
  if (!allowAuthAttempt(request, 'signup')) return json(response, 429, { message: 'Too many requests. Please try again later.' });
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
  if (!allowAuthAttempt(request, 'login')) return json(response, 429, { message: 'Too many requests. Please try again later.' });
  const { username, password } = await body(request); const user = username && await findUserByUsername(username);
  if (!user || !password || !matches(password, user.password_hash)) return json(response, 401, { message: '\uC544\uC774\uB514 \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.' });
  const clean = publicUser(user); return json(response, 200, { success: true, user: clean, token: issueToken(clean) });
}

async function me(request, response) {
  const claims = verifyToken(request.headers.authorization?.replace(/^Bearer /, '')); const user = claims && await findUserByUsername(claims.username);
  return user ? json(response, 200, { success: true, user: publicUser(user) }) : json(response, 401, { message: '\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.' });
}

async function dashboard(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  return json(response, 200, { success: true, dashboard: await getUserDashboard(user.username) });
}

async function profileUpdate(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const profile = await body(request);
  const emailOwner = await findUserByEmail(profile.email);
  if (emailOwner && emailOwner.username !== user.username) return json(response, 409, { message: '\uC774\uBBF8 \uAC00\uC785\uB41C \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4.' });
  const updated = await updateUserProfile(user.username, profile);
  if (!updated) return json(response, 400, { message: '\uD544\uC218 \uD56D\uBAA9\uC744 \uBAA8\uB450 \uC785\uB825\uD574 \uC8FC\uC138\uC694.' });
  const clean = publicUser(updated);
  return json(response, 200, { success: true, user: clean, token: issueToken(clean) });
}

async function passwordUpdate(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const { currentPassword, nextPassword } = await body(request);
  if (!currentPassword || !matches(currentPassword, user.password_hash)) return json(response, 401, { message: '\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.' });
  if (!nextPassword || nextPassword.length < 8) return json(response, 400, { message: '\uC0C8 \uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1 \uC785\uB825\uD574 \uC8FC\uC138\uC694.' });
  await updateUserPassword(user.username, hashPassword(nextPassword));
  return json(response, 200, { success: true });
}

async function accountDelete(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const { password } = await body(request);
  if (!password || !matches(password, user.password_hash)) return json(response, 401, { message: '\uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.' });
  await deleteUser(user.username);
  return json(response, 200, { success: true });
}

async function adminDashboard(request, response) {
  const user = await requireAdmin(request, response);
  if (!user) return;
  return json(response, 200, { success: true, dashboard: await getAdminDashboard() });
}

async function adminUserDelete(request, response) {
  const user = await requireAdmin(request, response);
  if (!user) return;
  const { id } = await body(request);
  if (Number(id) === Number(user.id)) return json(response, 400, { message: '\uC790\uC2E0\uC758 \uAD00\uB9AC\uC790 \uACC4\uC815\uC740 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
  const deleted = await deleteUserByAdmin(id);
  return deleted ? json(response, 200, { success: true }) : json(response, 404, { message: '\uD68C\uC6D0\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
}

async function adminUserRoleUpdate(request, response) {
  const user = await requireAdmin(request, response);
  if (!user) return;
  const { id, isAdmin } = await body(request);
  if (Number(id) === Number(user.id) && !isAdmin) return json(response, 400, { message: '\uC790\uC2E0\uC758 \uAD00\uB9AC\uC790 \uAD8C\uD55C\uC740 \uD574\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
  const updated = await setUserAdmin(id, Boolean(isAdmin));
  return updated ? json(response, 200, { success: true, user: publicUser(updated) }) : json(response, 404, { message: '\uD68C\uC6D0\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
}

async function adminUserNoteSave(request, response) {
  const user = await requireAdmin(request, response);
  if (!user) return;
  const { id, note } = await body(request);
  const updated = await saveAdminUserNote(id, note);
  return updated ? json(response, 200, { success: true, user: publicUser(updated) }) : json(response, 404, { message: '\uD68C\uC6D0\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
}

async function adminPostDelete(request, response) {
  const user = await requireAdmin(request, response);
  if (!user) return;
  const { id } = await body(request);
  const deleted = await deleteCommunityPostByAdmin(id);
  return deleted ? json(response, 200, { success: true }) : json(response, 404, { message: '\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
}

async function adminPostVisibilityUpdate(request, response) {
  const user = await requireAdmin(request, response);
  if (!user) return;
  const { id, isHidden } = await body(request);
  const post = await setCommunityPostHidden(id, Boolean(isHidden));
  return post ? json(response, 200, { success: true, post }) : json(response, 404, { message: '\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
}

async function adminAnnouncementCreate(request, response) {
  const user = await requireAdmin(request, response);
  if (!user) return;
  const notice = await createAnnouncement(await body(request));
  return notice ? json(response, 201, { success: true, notice }) : json(response, 400, { message: '\uACF5\uC9C0 \uC81C\uBAA9\uACFC \uB0B4\uC6A9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.' });
}

async function adminAnnouncementUpdate(request, response) {
  const user = await requireAdmin(request, response);
  if (!user) return;
  const { id, ...notice } = await body(request);
  const updated = await updateAnnouncement(id, notice);
  return updated ? json(response, 200, { success: true, notice: updated }) : json(response, 400, { message: '\uC218\uC815\uD560 \uACF5\uC9C0 \uC81C\uBAA9\uACFC \uB0B4\uC6A9\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694.' });
}

async function adminAnnouncementVisibilityUpdate(request, response) {
  const user = await requireAdmin(request, response);
  if (!user) return;
  const { id, isHidden } = await body(request);
  const notice = await setAnnouncementHidden(id, Boolean(isHidden));
  return notice ? json(response, 200, { success: true, notice }) : json(response, 404, { message: '\uACF5\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
}

async function adminAnnouncementDelete(request, response) {
  const user = await requireAdmin(request, response);
  if (!user) return;
  const { id } = await body(request);
  const deleted = await deleteAnnouncement(id);
  return deleted ? json(response, 200, { success: true }) : json(response, 404, { message: '\uACF5\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
}

async function adminCommentDelete(request, response) {
  const user = await requireAdmin(request, response);
  if (!user) return;
  const { id } = await body(request);
  const deleted = await deleteCommunityCommentByAdmin(id);
  return deleted ? json(response, 200, { success: true }) : json(response, 404, { message: '\uB313\uAE00\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
}

async function adminReportStatusUpdate(request, response) {
  const user = await requireAdmin(request, response);
  if (!user) return;
  const { id, status } = await body(request);
  const report = await updateContentReportStatus(id, status);
  return report ? json(response, 200, { success: true, report }) : json(response, 404, { message: '\uC2E0\uACE0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
}

async function adminReportDelete(request, response) {
  const user = await requireAdmin(request, response);
  if (!user) return;
  const { id } = await body(request);
  const deleted = await deleteContentReport(id);
  return deleted ? json(response, 200, { success: true }) : json(response, 404, { message: '\uC2E0\uACE0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
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

async function requireAdmin(request, response) {
  const user = await requireUser(request, response);
  if (!user) return null;
  if (!user.isAdmin) {
    json(response, 403, { message: '\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.' });
    return null;
  }
  return user;
}

async function adminBootstrap(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const dashboard = await getAdminDashboard();
  if (dashboard.users.some((item) => item.isAdmin)) {
    return json(response, 409, { message: '\uC774\uBBF8 \uAD00\uB9AC\uC790 \uACC4\uC815\uC774 \uC788\uC2B5\uB2C8\uB2E4.' });
  }
  const { username } = await body(request);
  if (username && username !== user.username) {
    return json(response, 403, { message: '\uB85C\uADF8\uC778\uD55C \uACC4\uC815\uB9CC \uCD5C\uCD08 \uAD00\uB9AC\uC790\uB85C \uB4F1\uB85D\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.' });
  }
  const cleanUser = publicUser(await setUserAdmin(user.id, true));
  return cleanUser
    ? json(response, 200, { success: true, message: '\uAD00\uB9AC\uC790 \uACC4\uC815 \uC124\uC815\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.', user: cleanUser, token: issueToken(cleanUser) })
    : json(response, 404, { message: '\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
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

async function portfolio(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  return json(response, 200, { success: true, holdings: await getPortfolioHoldings(user.username) });
}

async function portfolioSave(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const holdings = await savePortfolioHolding(user.username, await body(request));
  return holdings ? json(response, 200, { success: true, holdings }) : json(response, 400, { message: '\uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uC790\uC0B0 \uC815\uBCF4\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.' });
}

async function portfolioDelete(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const { itemKey } = await body(request);
  const holdings = await deletePortfolioHolding(user.username, itemKey);
  return holdings ? json(response, 200, { success: true, holdings }) : json(response, 400, { message: '\uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uC790\uC0B0\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
}

async function assetNoteGet(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const { searchParams } = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const note = await getAssetNote(user.username, searchParams.get('itemKey'));
  return note ? json(response, 200, { success: true, note }) : json(response, 400, { message: '\uBA54\uBAA8 \uB300\uC0C1\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.' });
}

async function assetNoteSave(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const { itemKey, note } = await body(request);
  const saved = await saveAssetNote(user.username, itemKey, note);
  return saved ? json(response, 200, { success: true, note: saved }) : json(response, 400, { message: '\uBA54\uBAA8\uB97C \uC800\uC7A5\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
}

async function savedNews(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  return json(response, 200, { success: true, news: await getSavedNews(user.username) });
}

async function savedNewsToggle(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const news = await toggleSavedNews(user.username, await body(request));
  return news ? json(response, 200, { success: true, news }) : json(response, 400, { message: '\uB274\uC2A4 \uC800\uC7A5 \uB300\uC0C1\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.' });
}

async function savedNewsDelete(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const { newsKey } = await body(request);
  const news = await deleteSavedNews(user.username, newsKey);
  return news ? json(response, 200, { success: true, news }) : json(response, 400, { message: '\uC800\uC7A5\uD55C \uB274\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
}

async function communityCreate(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const post = await createCommunityPost(user.username, await body(request));
  return post ? json(response, 201, { success: true, post }) : json(response, 400, { message: '\uC81C\uBAA9\uACFC \uBCF8\uBB38\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.' });
}

async function communityCommentCreate(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const { postId, content } = await body(request);
  const comment = await createCommunityComment(user.username, postId, content);
  return comment ? json(response, 201, { success: true, comment }) : json(response, 400, { message: '\uB313\uAE00 \uB0B4\uC6A9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.' });
}

async function communityDelete(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const { id } = await body(request);
  const posts = await deleteCommunityPost(user.username, id);
  if (posts === false) return json(response, 403, { message: '\uAE00\uC744 \uC0AD\uC81C\uD560 \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.' });
  return posts ? json(response, 200, { success: true, posts }) : json(response, 400, { message: '\uAE00\uC744 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
}

async function communityCommentDelete(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const { id } = await body(request);
  const deleted = await deleteCommunityComment(user.username, id);
  if (deleted === false) return json(response, 403, { message: '\uB313\uAE00\uC744 \uC0AD\uC81C\uD560 \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.' });
  return deleted ? json(response, 200, { success: true }) : json(response, 400, { message: '\uB313\uAE00\uC744 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.' });
}

async function contentReportCreate(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;
  const report = await createContentReport(user.username, await body(request));
  return report ? json(response, 201, { success: true, report }) : json(response, 400, { message: '\uC2E0\uACE0 \uB300\uC0C1\uACFC \uC0AC\uC720\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.' });
}

async function aiNewsSummary(request, response) {
  try {
    const forwardedFor = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const clientKey = forwardedFor || request.socket.remoteAddress || 'anonymous';
    const summary = await summarizeNews(await aiBody(request), { clientKey });
    return json(response, 200, { success: true, ...summary });
  } catch (error) {
    if (error instanceof AiError) return json(response, error.status, { message: error.publicMessage, error: { code: error.code, message: error.publicMessage } });
    return json(response, 500, { message: AI_MESSAGES.failed });
  }
}

async function aiPortfolioAnalysis(request, response) {
  const user = await requireUser(request, response);
  if (!user) return;

  try {
    const holdings = await getPortfolioHoldings(user.username);
    const ownedItemKeys = (holdings || []).map((holding) => holding.itemKey);
    const analysis = await analyzePortfolio(await aiBody(request), {
      clientKey: `user:${user.username}:portfolio-analysis`,
      ownedItemKeys,
    });
    return json(response, 200, { success: true, ...analysis });
  } catch (error) {
    if (error instanceof AiError) return json(response, error.status, { message: error.publicMessage, error: { code: error.code, message: error.publicMessage } });
    return json(response, 500, { message: AI_MESSAGES.portfolioFailed });
  }
}

const parsePrice = (value) => Number(String(value || '').replace(/[^0-9.-]/g, '')) || 0;
const round = (value) => Number(Number(value || 0).toFixed(4));
const safeUserHash = (username) => createHash('sha256').update(String(username || 'anonymous')).digest('hex').slice(0, 24);

function createAiTrace(feature) {
  const enabled = process.env.AI_TRACE === 'true';
  const startedAt = Date.now();
  const steps = [];
  const write = (entry) => {
    if (!enabled) return;
    console.error(JSON.stringify({ event: 'ai_timing', feature, ...entry }));
  };
  return {
    enabled,
    steps,
    startStep(step, extra = {}) {
      if (!enabled) return () => {};
      const start = Date.now();
      write({ step, phase: 'start', atMs: start - startedAt, ...extra });
      return (endExtra = {}) => {
        const end = Date.now();
        const record = { step, startMs: start - startedAt, endMs: end - startedAt, durationMs: end - start, ...endExtra };
        steps.push(record);
        write({ ...record, phase: 'end' });
      };
    },
  };
}

async function tracedStep(trace, step, action, extra = {}) {
  const end = trace?.startStep?.(step, extra);
  try {
    const value = await action();
    end?.();
    return value;
  } catch (error) {
    end?.({ error: error?.name || 'Error' });
    throw error;
  }
}

function selectRelatedNews(holdings, news) {
  const assets = holdings.map((holding) => ({
    symbol: String(holding.symbol || '').toLowerCase(),
    name: String(holding.name || '').toLowerCase(),
  }));
  const scored = (news || []).map((article) => {
    const textValue = `${article.title || ''} ${article.summary || ''}`.toLowerCase();
    const relatedAssets = assets
      .filter((asset) => (asset.symbol && textValue.includes(asset.symbol)) || (asset.name && textValue.includes(asset.name)))
      .map((asset) => asset.symbol.toUpperCase())
      .filter(Boolean);
    return { article, relatedAssets, score: relatedAssets.length };
  });

  const direct = scored.filter((item) => item.score > 0).slice(0, 8);
  const fallback = scored.slice(0, 8 - direct.length).filter((item) => !direct.includes(item));
  return [...direct, ...fallback].slice(0, 8).map(({ article, relatedAssets }) => ({
    id: article.id,
    title: article.title,
    summary: article.summary,
    source: article.provider || article.source,
    date: article.time,
    relatedAssets,
  }));
}

async function createInvestmentInsightPayload(username, trace) {
  const holdings = await tracedStep(trace, 'dbLookup', () => getPortfolioHoldings(username));
  if (!holdings || holdings.length === 0) throw new AiError('EMPTY_PORTFOLIO', AI_MESSAGES.emptyPortfolio, 400);

  const marketPromise = tracedStep(trace, 'marketDataLookup', () => Promise.all([
    getCryptoPricesLive(),
    getUsStocksLive(),
    getKoreanStocksLive(),
    getMarketIndicesLive(),
  ]));
  const newsPromise = tracedStep(trace, 'relatedNewsFetch', () => getNewsLive());
  const [[crypto, usStocks, koreanStocks, market], news] = await Promise.all([marketPromise, newsPromise]);

  const calculationEnd = trace?.startStep?.('portfolioCalculation');
  const marketAssets = [
    ...(crypto || []).map((item) => ({ ...item, itemKey: `crypto:${item.id}`, assetType: 'crypto' })),
    ...(usStocks || []).map((item) => ({ ...item, itemKey: `stock:${item.id}`, assetType: 'stock' })),
    ...(koreanStocks || []).map((item) => ({ ...item, itemKey: `korean-stock:${item.id}`, assetType: 'korean-stock' })),
  ];
  const rows = holdings.map((holding) => {
    const current = marketAssets.find((item) => item.itemKey === holding.itemKey);
    const currentPrice = parsePrice(current?.price);
    const investmentAmount = holding.quantity * holding.averagePrice;
    const evaluationAmount = holding.quantity * currentPrice;
    const profit = evaluationAmount - investmentAmount;
    const returnRate = investmentAmount > 0 ? (profit / investmentAmount) * 100 : 0;
    return { ...holding, currentPrice, investmentAmount, evaluationAmount, profit, returnRate };
  }).filter((item) => item.evaluationAmount > 0);

  if (rows.length === 0) {
    calculationEnd?.({ holdingsCount: holdings.length, rowsCount: rows.length });
    throw new AiError('INSUFFICIENT_DATA', AI_MESSAGES.insufficientData, 422);
  }

  const totalEvaluation = rows.reduce((sum, item) => sum + item.evaluationAmount, 0);
  const totalInvestment = rows.reduce((sum, item) => sum + item.investmentAmount, 0);
  const totalProfit = totalEvaluation - totalInvestment;
  const totalReturnRate = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
  const assets = rows
    .map((item) => ({ ...item, weight: totalEvaluation > 0 ? (item.evaluationAmount / totalEvaluation) * 100 : 0 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10);
  calculationEnd?.({ holdingsCount: holdings.length, rowsCount: rows.length, assetsCount: assets.length });

  const relatedNews = await tracedStep(trace, 'relatedNewsLookup', async () => selectRelatedNews(assets, news).slice(0, 8), { newsCount: (news || []).length });

  if (relatedNews.length === 0 && (!market || market.length === 0)) throw new AiError('INSUFFICIENT_DATA', AI_MESSAGES.insufficientData, 422);

  return {
    portfolioSummary: {
      totalEvaluation: round(totalEvaluation),
      totalProfit: round(totalProfit),
      totalReturnRate: round(totalReturnRate),
      assetsCount: rows.length,
      largestPositionWeight: round(assets[0]?.weight || 0),
    },
    assets: assets.map((item) => ({
      itemKey: item.itemKey,
      symbol: item.symbol,
      name: item.name,
      assetType: item.assetType,
      weight: round(item.weight),
      evaluationAmount: round(item.evaluationAmount),
      returnRate: round(item.returnRate),
    })),
    relatedNews,
    market: (market || []).slice(0, 5).map((item) => ({ name: item.name, value: item.value, change: item.change })),
  };
}
async function aiInvestmentInsights(request, response) {
  const trace = createAiTrace('investment-insights');
  const authEnd = trace.startStep('authentication');
  const user = await requireUser(request, response);
  authEnd({ authenticated: Boolean(user) });
  if (!user) return;

  try {
    assertAiAvailable();
    const payload = await createInvestmentInsightPayload(user.username, trace);
    const insights = await createInvestmentInsights(payload, {
      clientKey: `user:${user.username}:investment-insights`,
      userHash: safeUserHash(user.username),
      trace,
    });

    const responseBody = { success: true, ...insights };
    const serializationEnd = trace.startStep('responseSerialization');
    const serialized = JSON.stringify(responseBody);
    serializationEnd({ bytes: Buffer.byteLength(serialized) });

    const clientEnd = trace.startStep('clientResponse');
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(serialized);
    clientEnd();
    return;
  } catch (error) {
    if (error instanceof AiError) return json(response, error.status, { message: error.publicMessage, error: { code: error.code, message: error.publicMessage } });
    return json(response, 500, { message: AI_MESSAGES.investmentFailed });
  }
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
    if (request.method === 'GET' && pathname === '/api/me/dashboard') return await dashboard(request, response);
    if (request.method === 'PATCH' && pathname === '/api/me/profile') return await profileUpdate(request, response);
    if (request.method === 'PATCH' && pathname === '/api/me/password') return await passwordUpdate(request, response);
    if (request.method === 'DELETE' && pathname === '/api/me') return await accountDelete(request, response);
    if (request.method === 'POST' && pathname === '/api/admin/bootstrap') return await adminBootstrap(request, response);
    if (request.method === 'GET' && pathname === '/api/admin/dashboard') return await adminDashboard(request, response);
    if (request.method === 'PATCH' && pathname === '/api/admin/users/role') return await adminUserRoleUpdate(request, response);
    if (request.method === 'PATCH' && pathname === '/api/admin/users/note') return await adminUserNoteSave(request, response);
    if (request.method === 'PATCH' && pathname === '/api/admin/community/visibility') return await adminPostVisibilityUpdate(request, response);
    if (request.method === 'POST' && pathname === '/api/admin/announcements') return await adminAnnouncementCreate(request, response);
    if (request.method === 'PATCH' && pathname === '/api/admin/announcements') return await adminAnnouncementUpdate(request, response);
    if (request.method === 'PATCH' && pathname === '/api/admin/announcements/visibility') return await adminAnnouncementVisibilityUpdate(request, response);
    if (request.method === 'DELETE' && pathname === '/api/admin/announcements') return await adminAnnouncementDelete(request, response);
    if (request.method === 'PATCH' && pathname === '/api/admin/reports/status') return await adminReportStatusUpdate(request, response);
    if (request.method === 'DELETE' && pathname === '/api/admin/reports') return await adminReportDelete(request, response);
    if (request.method === 'DELETE' && pathname === '/api/admin/users') return await adminUserDelete(request, response);
    if (request.method === 'DELETE' && pathname === '/api/admin/community') return await adminPostDelete(request, response);
    if (request.method === 'DELETE' && pathname === '/api/admin/community/comment') return await adminCommentDelete(request, response);
    if (request.method === 'POST' && pathname === '/api/ai/news-summary') return await aiNewsSummary(request, response);
    if (request.method === 'POST' && pathname === '/api/ai/portfolio-analysis') return await aiPortfolioAnalysis(request, response);
    if (request.method === 'POST' && pathname === '/api/ai/investment-insights') return await aiInvestmentInsights(request, response);
    if (request.method === 'GET' && pathname === '/api/favorites') return await favorites(request, response);
    if (request.method === 'POST' && pathname === '/api/favorites/toggle') return await favoriteToggle(request, response);
    if (request.method === 'GET' && pathname === '/api/portfolio') return await portfolio(request, response);
    if (request.method === 'POST' && pathname === '/api/portfolio') return await portfolioSave(request, response);
    if (request.method === 'DELETE' && pathname === '/api/portfolio') return await portfolioDelete(request, response);
    if (request.method === 'GET' && pathname === '/api/asset-note') return await assetNoteGet(request, response);
    if (request.method === 'POST' && pathname === '/api/asset-note') return await assetNoteSave(request, response);
    if (request.method === 'GET' && pathname === '/api/saved-news') return await savedNews(request, response);
    if (request.method === 'POST' && pathname === '/api/saved-news/toggle') return await savedNewsToggle(request, response);
    if (request.method === 'DELETE' && pathname === '/api/saved-news') return await savedNewsDelete(request, response);
    if (request.method === 'GET' && pathname === '/api/market/indices') return json(response, 200, await getMarketIndicesLive());
    if (request.method === 'GET' && pathname === '/api/market/status') return json(response, 200, await getMarketDataStatus());
    if (request.method === 'GET' && pathname === '/api/crypto') return json(response, 200, await getCryptoPricesLive());
    if (request.method === 'GET' && pathname === '/api/stocks/us') return json(response, 200, await getUsStocksLive());
    if (request.method === 'GET' && pathname === '/api/stocks/kr') return json(response, 200, await getKoreanStocksLive());
    if (request.method === 'GET' && pathname === '/api/news') return json(response, 200, await getNewsLive());
    if (request.method === 'GET' && pathname === '/api/announcements') return json(response, 200, await getAnnouncements());
    if (request.method === 'GET' && pathname === '/api/community') return json(response, 200, await getCommunityPosts());
    if (request.method === 'POST' && pathname === '/api/community') return await communityCreate(request, response);
    if (request.method === 'DELETE' && pathname === '/api/community') return await communityDelete(request, response);
    if (request.method === 'GET' && pathname === '/api/community/comments') {
      const { searchParams } = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      return json(response, 200, { comments: await getCommunityComments(searchParams.get('postId')) });
    }
    if (request.method === 'POST' && pathname === '/api/community/comment') return await communityCommentCreate(request, response);
    if (request.method === 'DELETE' && pathname === '/api/community/comment') return await communityCommentDelete(request, response);
    if (request.method === 'POST' && pathname === '/api/reports') return await contentReportCreate(request, response);
    if (request.method === 'POST' && pathname === '/api/community/like') { const { id } = await body(request); const post = await incrementCommunityPostMetric(id, 'likes'); return json(response, post ? 200 : 404, { success: Boolean(post), post }); }
    if (request.method === 'POST' && pathname === '/api/community/unlike') { const { id } = await body(request); const post = await decrementCommunityPostMetric(id, 'likes'); return json(response, post ? 200 : 404, { success: Boolean(post), post }); }
    if (request.method === 'POST' && pathname === '/api/community/view') { const { id } = await body(request); const post = await incrementCommunityPostMetric(id, 'views'); return json(response, post ? 200 : 404, { success: Boolean(post), post }); }
    if (pathname.startsWith('/api/')) return json(response, 404, { message: 'Not found' });
    return serveFile(response, resolve(dist, `.${pathname}`));
  } catch (error) {
    if (error instanceof HttpError) return json(response, error.status, { message: error.publicMessage });
    console.error('Server request failed', { name: error?.name, code: error?.code });
    return json(response, 500, { message: '\uC11C\uBC84 \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.' });
  }
});

await initDb();
server.listen(port, host, () => console.log(`MoneyPlatform server listening on http://${host}:${port}`));

export async function shutdown() {
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  await new Promise((done) => server.close(done));
  await closeDb();
}

process.on('SIGTERM', () => shutdown().then(() => process.exit(0)));
process.on('SIGINT', () => shutdown().then(() => process.exit(0)));

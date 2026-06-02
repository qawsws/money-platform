import { createHmac, timingSafeEqual } from 'node:crypto';

const secret = process.env.JWT_SECRET || 'local-development-secret-change-before-deploy';
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const sign = (value) => createHmac('sha256', secret).update(value).digest('base64url');

export function issueToken(user) {
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({ sub: String(user.id), username: user.username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 });
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function verifyToken(token) {
  try {
    if (!token) return null;
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    const expected = Buffer.from(sign(`${header}.${payload}`));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return claims.exp > Date.now() / 1000 ? claims : null;
  } catch {
    return null;
  }
}

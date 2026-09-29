import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
export const SESSION_AGE = 7 * 24 * 60 * 60 * 1000;
export const sessionKey = token => createHash('sha256').update(token).digest('hex');
export function cookieToken(req) {
  return req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith('together_session='))?.slice(17) || '';
}
export function localRequest(req) {
  // Never trust Host, Origin, X-Forwarded-For, or a user-provided flag for locality.
  const address = req.socket.remoteAddress;
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}
export function publicUser(user) {
  const {id, name, color, username} = user;
  return {id, name, color, username};
}
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64, {N: 32768, maxmem: 64 * 1024 * 1024});
  return {salt, hash: hash.toString('hex')};
}
export async function checkPassword(password, record) {
  const actual = await derive(password, record?.salt || '00000000000000000000000000000000', 64, {N: 32768, maxmem: 64 * 1024 * 1024});
  const expected = Buffer.from(record?.hash || '00'.repeat(64), 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected) && !!record;
}
export function getSession(db, req) {
  const key = sessionKey(cookieToken(req));
  const session = db.sessions[key];
  if (!session || session.expiresAt <= Date.now()) return null;
  const user = db.users.find(u => u.id === session.userId && u.password && u.status === 'active');
  return user ? {user, key, expiresAt: session.expiresAt} : null;
}
export function issueSession(db, res, user) {
  for (const [key, session] of Object.entries(db.sessions)) {
    if (session.expiresAt <= Date.now()) delete db.sessions[key];
  }
  const token = randomBytes(32).toString('hex');
  db.sessions[sessionKey(token)] = {userId: user.id, expiresAt: Date.now() + SESSION_AGE};
  res.setHeader('Set-Cookie', `together_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_AGE / 1000}`);
}
// In-memory throttling is deliberately bounded, with expiry; no passwords are logged.
const attempts = new Map();
export function allowAuth(address, username) {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const keys = [[`ip:${address}`, 60], [`account:${username}`, 20]];
  for (const [key, limit] of keys) if ((attempts.get(key)?.count || 0) >= limit) return false;
  if (attempts.size > 10000) return false;
  for (const [key] of keys) {
    const value = attempts.get(key) || {count: 0, until: now + 10 * 60 * 1000};
    value.count += 1;
    attempts.set(key, value);
  }
  return true;
}

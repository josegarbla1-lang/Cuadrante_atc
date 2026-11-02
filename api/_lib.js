const crypto = require('crypto');
const DAYS = 7;

const secret = () => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
const sign = (v) => crypto.createHmac('sha256', secret()).update(v).digest('hex');
const sha = (v) => crypto.createHash('sha256').update(String(v)).digest();

function safeEq(a, b) {
  const A = Buffer.from(String(a)), B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}
function passwordOk(p) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real || typeof p !== 'string') return false;
  return crypto.timingSafeEqual(sha(p), sha(real));
}
function makeToken() {
  const exp = Date.now() + DAYS * 864e5;
  return exp + '.' + sign('s' + exp);
}
function cookieHeader(token, maxAge) {
  return 'session=' + token + '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=' + maxAge;
}
function parseCookies(h) {
  const out = {};
  String(h || '').split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
  return out;
}
function isEditor(req) {
  if (!secret()) return false;
  const t = parseCookies(req.headers.cookie).session;
  if (!t) return false;
  const i = t.indexOf('.');
  const exp = t.slice(0, i), sig = t.slice(i + 1);
  if (i < 1 || !sig || !(Number(exp) > Date.now())) return false;
  return safeEq(sig, sign('s' + exp));
}
async function redis(cmd) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('storage_not_configured');
  const r = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error('storage_error');
  return j.result;
}
module.exports = { passwordOk, makeToken, cookieHeader, isEditor, redis };

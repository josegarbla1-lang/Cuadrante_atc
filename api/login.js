const { passwordOk, makeToken, cookieHeader, redis } = require('./_lib');

const MAX_FALLOS = 5, VENTANA = 900; // 5 fallos cada 15 minutos por dirección

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'metodo' });
  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const key = 'fallos:' + ip;
  let fallos = 0;
  try { fallos = Number(await redis(['GET', key])) || 0; } catch (e) { /* sin contador: se sigue */ }
  if (fallos >= MAX_FALLOS) return res.status(429).json({ error: 'demasiados_intentos' });
  if (!passwordOk(body.password)) {
    try { await redis(['INCR', key]); await redis(['EXPIRE', key, VENTANA]); } catch (e) { /* idem */ }
    await new Promise((r) => setTimeout(r, 800));
    return res.status(401).json({ error: 'contrasena_incorrecta' });
  }
  try { await redis(['DEL', key]); } catch (e) { /* idem */ }
  res.setHeader('Set-Cookie', cookieHeader(makeToken(), 7 * 86400));
  return res.status(200).json({ ok: true });
};
function safeParse(s) { try { return JSON.parse(s); } catch (e) { return {}; } }

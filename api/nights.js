const { isEditor, redis } = require('./_lib');

function valid(id, d) {
  if (typeof id !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(id)) return false;
  if (!d || typeof d !== 'object' || JSON.stringify(d).length > 60000) return false;
  if (!Array.isArray(d.sectors) || d.sectors.length < 1 || d.sectors.length > 8) return false;
  if (!Array.isArray(d.people) || d.people.length < 1 || d.people.length > 40) return false;
  return d.people.every((p) => p && typeof p.name === 'string' && typeof p.row === 'string' && p.row.length === 18)
    && d.sectors.every((s) => s && typeof s.name === 'string' && Number.isInteger(s.from) && Number.isInteger(s.to));
}

const MAX = 30;

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const flat = (await redis(['HGETALL', 'noches'])) || [];
      const nights = [];
      for (let i = 0; i + 1 < flat.length; i += 2) {
        try { nights.push({ id: flat[i], data: JSON.parse(flat[i + 1]) }); } catch (e) { /* se ignora */ }
      }
      nights.sort((a, b) => (a.id < b.id ? 1 : -1));
      return res.status(200).json({ nights: nights.slice(0, 120) });
    }
    if (req.method === 'PUT') {
      if (!isEditor(req)) return res.status(401).json({ error: 'no_autorizado' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!valid(body.id, body.data)) return res.status(400).json({ error: 'datos_no_validos' });
      await redis(['HSET', 'noches', body.id, JSON.stringify(body.data)]);
      // solo se conservan los últimos 30: se borra lo más antiguo
      const keys = ((await redis(['HKEYS', 'noches'])) || []).slice().sort();
      const removed = keys.length > MAX ? keys.slice(0, keys.length - MAX) : [];
      if (removed.length) await redis(['HDEL', 'noches'].concat(removed));
      return res.status(200).json({ ok: true, removed });
    }
    if (req.method === 'DELETE') {
      if (!isEditor(req)) return res.status(401).json({ error: 'no_autorizado' });
      const id = (req.query && req.query.id) || new URL(req.url, 'http://x').searchParams.get('id');
      if (typeof id !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(id)) return res.status(400).json({ error: 'datos_no_validos' });
      await redis(['HDEL', 'noches', id]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'metodo' });
  } catch (e) {
    return res.status(500).json({ error: e && e.message === 'storage_not_configured' ? 'sin_almacenamiento' : 'error' });
  }
};

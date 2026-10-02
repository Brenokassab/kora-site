// GET /api/leads → leads e cadastros para o painel (protegido pela ADMIN_KEY)
const crypto = require('crypto');
const { sendJson, clientIp, rateLimit } = require('../lib/http');
const store = require('../lib/store');

function authorized(req) {
  const key = process.env.ADMIN_KEY;
  const got = req.headers['x-admin-key'];
  if (!key || !got) return false;
  const a = crypto.createHash('sha256').update(String(key)).digest();
  const b = crypto.createHash('sha256').update(String(got)).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' });
  if (!rateLimit('admin:' + clientIp(req), 30, 60000)) return sendJson(res, 429, { error: 'rate_limited' });
  if (!process.env.ADMIN_KEY) return sendJson(res, 503, { error: 'admin_off' });
  if (!authorized(req)) return sendJson(res, 401, { error: 'unauthorized' });
  const [leads, cadastros] = await Promise.all([store.list('leads', 500), store.list('cadastros', 200)]);
  return sendJson(res, 200, { persistent: store.persistent(), leads, cadastros });
};

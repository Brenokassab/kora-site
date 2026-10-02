// POST /api/chat  → conversa do chat do site
// GET  /api/chat  → diz ao site se a IA está ligada
const { runKora, cleanHistory } = require('../lib/kora');
const { load } = require('../lib/config');
const { readBody, sendJson, clientIp, rateLimit } = require('../lib/http');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return sendJson(res, 200, { ok: true, ai: !!process.env.ANTHROPIC_API_KEY, demo: process.env.KORA_DEMO === 'true' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, { error: 'method_not_allowed' });
  }

  const ip = clientIp(req);
  if (!rateLimit('chat:' + ip, 15, 60000) || !rateLimit('chatday:' + ip, 150, 86400000)) {
    return sendJson(res, 429, { error: 'rate_limited', reply: 'Recebi muitas mensagens seguidas. Tente de novo em um minuto 🙏' });
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(req, 32 * 1024));
  } catch (e) {
    return sendJson(res, e.status || 400, { error: 'invalid_body' });
  }

  const history = cleanHistory(payload && payload.messages, 20, 800);
  if (!history) return sendJson(res, 400, { error: 'invalid_messages' });
  if (!process.env.ANTHROPIC_API_KEY) return sendJson(res, 503, { error: 'ai_off' });

  try {
    const cfg = load(typeof payload.segmento === 'string' ? payload.segmento : '');
    const { reply, events } = await runKora({ cfg, history, channel: 'site' });
    return sendJson(res, 200, { reply, events });
  } catch (e) {
    console.error('[chat]', e.message);
    return sendJson(res, 502, { error: 'upstream' });
  }
};

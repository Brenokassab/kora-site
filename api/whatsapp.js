// Webhook do WhatsApp Cloud API
// GET  → verificação do webhook pela Meta
// POST → mensagens recebidas; a Kora responde pelo mesmo número
const { runKora } = require('../lib/kora');
const { whatsappProfile } = require('../lib/config');
const { readBody, sendJson } = require('../lib/http');
const whatsapp = require('../lib/whatsapp');
const store = require('../lib/store');

const HISTORY_TURNS = 16;
const HISTORY_TTL = 60 * 60 * 24 * 3; // 3 dias

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      return res.end(String(challenge || ''));
    }
    return sendJson(res, 403, { error: 'forbidden' });
  }
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' });

  let raw;
  try { raw = await readBody(req, 256 * 1024); } catch (e) { return sendJson(res, 413, { error: 'too_large' }); }
  if (!whatsapp.validSignature(raw, req.headers['x-hub-signature-256'])) {
    return sendJson(res, 401, { error: 'bad_signature' });
  }

  let body;
  try { body = JSON.parse(raw); } catch { return sendJson(res, 400, { error: 'invalid_json' }); }

  const jobs = [];
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const msg of value.messages || []) jobs.push(handleMessage(msg, value));
    }
  }
  await Promise.allSettled(jobs);
  return sendJson(res, 200, { ok: true });
};

async function handleMessage(msg, value) {
  const from = msg.from;
  if (!from || !msg.id) return;
  if (!(await store.once('wamid:' + msg.id, 3600))) return; // a Meta reenvia; responde uma vez só

  // mensagens muito antigas (reenvios após falha) não recebem resposta automática
  if (msg.timestamp && Date.now() / 1000 - Number(msg.timestamp) > 60 * 30) return;

  await whatsapp.markRead(msg.id);

  let text = '';
  if (msg.type === 'text') text = msg.text && msg.text.body;
  else if (msg.type === 'button') text = msg.button && msg.button.text;
  else if (msg.type === 'interactive') {
    const i = msg.interactive || {};
    text = (i.button_reply && i.button_reply.title) || (i.list_reply && i.list_reply.title);
  }
  if (!text) {
    await whatsapp.sendText(from, 'Por enquanto consigo ler apenas mensagens de texto 😊 Pode me escrever o que precisa?');
    return;
  }

  const key = 'hist:' + from;
  const history = ((await store.get(key)) || []).slice(-HISTORY_TURNS);
  const name = value.contacts && value.contacts[0] && value.contacts[0].profile && value.contacts[0].profile.name;
  const userTurn = { role: 'user', content: (history.length ? '' : (name ? `[Nome no WhatsApp: ${name}] ` : '')) + String(text).slice(0, 1500) };
  const turns = [...history, userTurn];
  while (turns.length && turns[0].role !== 'user') turns.shift();

  try {
    const { reply } = await runKora({ cfg: whatsappProfile(), history: turns, channel: 'whatsapp', phone: from });
    await whatsapp.sendText(from, reply);
    await store.set(key, [...turns, { role: 'assistant', content: reply }].slice(-HISTORY_TURNS), HISTORY_TTL);
  } catch (e) {
    console.error('[whatsapp]', e.message);
    await whatsapp.sendText(from, 'Tive uma instabilidade agora 😕 Já avisei a equipe, que vai te responder em breve.').catch(() => {});
  }
}

// WhatsApp Cloud API (oficial da Meta)
const crypto = require('crypto');

const GRAPH = 'https://graph.facebook.com/v21.0';

function enabled() {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

async function sendText(to, body) {
  if (!enabled()) return null;
  const r = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: String(to).replace(/\D/g, ''),
      type: 'text',
      text: { preview_url: false, body: String(body).slice(0, 4000) },
    }),
  });
  if (!r.ok) throw new Error(`whatsapp_send_${r.status}: ${await r.text()}`);
  return r.json();
}

async function markRead(messageId) {
  if (!enabled()) return;
  await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: messageId }),
  }).catch(() => {});
}

// Confere que o webhook veio mesmo da Meta (cabeçalho X-Hub-Signature-256)
function validSignature(raw, header) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(header));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { enabled, sendText, markRead, validSignature };

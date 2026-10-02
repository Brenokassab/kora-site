// Integração com o Google Agenda usando uma conta de serviço (sem dependências externas)
const crypto = require('crypto');

const SCOPE = 'https://www.googleapis.com/auth/calendar';
let cached = { token: null, exp: 0 };

function enabled() {
  return !!(process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CALENDAR_ID);
}

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

async function accessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cached.token && cached.exp - 60 > now) return cached.token;
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: process.env.GOOGLE_CLIENT_EMAIL,
    scope: SCOPE,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const key = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const signature = crypto.createSign('RSA-SHA256').update(`${header}.${claim}`).sign(key);
  const assertion = `${header}.${claim}.${b64url(signature)}`;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!r.ok) throw new Error(`google_token_${r.status}: ${await r.text()}`);
  const j = await r.json();
  cached = { token: j.access_token, exp: now + (j.expires_in || 3600) };
  return cached.token;
}

async function api(path, body) {
  const token = await accessToken();
  const r = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`google_api_${r.status}: ${await r.text()}`);
  return r.json();
}

// Retorna intervalos ocupados [{start: ms, end: ms}]
async function busy(timeMinISO, timeMaxISO) {
  const id = process.env.GOOGLE_CALENDAR_ID;
  const j = await api('/freeBusy', {
    timeMin: timeMinISO,
    timeMax: timeMaxISO,
    timeZone: 'America/Sao_Paulo',
    items: [{ id }],
  });
  const cal = (j.calendars && j.calendars[id]) || {};
  if (cal.errors && cal.errors.length) throw new Error('google_calendar_' + cal.errors[0].reason);
  return (cal.busy || []).map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }));
}

async function createEvent({ summary, description, startISO, endISO }) {
  const id = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID);
  return api(`/calendars/${id}/events`, {
    summary,
    description,
    start: { dateTime: startISO, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: endISO, timeZone: 'America/Sao_Paulo' },
  });
}

module.exports = { enabled, busy, createEvent };

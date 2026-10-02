// Armazenamento: Upstash Redis quando configurado; senão memória da instância
const mem = new Map();

function upstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function cmd(args) {
  const u = upstash();
  const r = await fetch(u.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${u.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error('upstash_' + r.status);
  return (await r.json()).result;
}

function memGet(key) {
  const v = mem.get(key);
  if (!v) return null;
  if (v.exp && v.exp < Date.now()) { mem.delete(key); return null; }
  return v.val;
}

async function get(key) {
  if (upstash()) {
    const v = await cmd(['GET', key]);
    return v == null ? null : JSON.parse(v);
  }
  return memGet(key);
}

async function set(key, value, ttlSec) {
  if (upstash()) return cmd(['SET', key, JSON.stringify(value), 'EX', ttlSec]);
  mem.set(key, { val: value, exp: Date.now() + ttlSec * 1000 });
  if (mem.size > 10000) mem.clear();
  return 'OK';
}

// Retorna true só na primeira vez que a chave aparece (evita responder 2x a mesma mensagem)
async function once(key, ttlSec) {
  if (upstash()) return (await cmd(['SET', key, '1', 'NX', 'EX', ttlSec])) === 'OK';
  if (memGet(key)) return false;
  mem.set(key, { val: 1, exp: Date.now() + ttlSec * 1000 });
  return true;
}

// Listas (mais novo primeiro), usadas para leads e cadastros
async function push(key, value, max = 1000) {
  if (upstash()) {
    await cmd(['LPUSH', key, JSON.stringify(value)]);
    await cmd(['LTRIM', key, 0, max - 1]);
    return;
  }
  const list = memGet(key) || [];
  list.unshift(value);
  mem.set(key, { val: list.slice(0, max), exp: 0 });
}

async function list(key, n = 500) {
  if (upstash()) return ((await cmd(['LRANGE', key, 0, n - 1])) || []).map((v) => JSON.parse(v));
  return (memGet(key) || []).slice(0, n);
}

function persistent() { return !!upstash(); }

module.exports = { get, set, once, push, list, persistent };

// Servidor local para testar sem instalar nada: node dev.js  →  http://localhost:3000
// Lê as chaves de um arquivo .env (opcional), serve a pasta public e as funções da pasta api.
const http = require('http');
const fs = require('fs');
const path = require('path');

try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
  });
} catch (_) { /* sem .env, tudo bem */ }

const TYPES = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json' };
const PUBLIC = path.join(__dirname, 'public');

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^a-z0-9-]/gi, '');
    const file = path.join(__dirname, 'api', name + '.js');
    if (!fs.existsSync(file)) { res.statusCode = 404; return res.end('not found'); }
    try { return await require(file)(req, res); } catch (e) { console.error(e); res.statusCode = 500; return res.end('erro'); }
  }
  let p = url.pathname === '/' ? '/index.html' : url.pathname;
  if (!path.extname(p)) p += '.html';
  const file = path.join(PUBLIC, path.normalize(p));
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file)) { res.statusCode = 404; return res.end('Página não encontrada'); }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(process.env.PORT || 3000, () => {
  console.log(`Kora rodando em http://localhost:${process.env.PORT || 3000}`);
  console.log(process.env.ANTHROPIC_API_KEY ? 'IA ligada ✔' : 'IA desligada: o chat funciona em modo demonstração (crie o arquivo .env com ANTHROPIC_API_KEY)');
});

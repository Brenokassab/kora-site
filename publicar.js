// Coloca a Kora no ar na Vercel com um comando só:  node publicar.js
// Pergunta as chaves, configura tudo e publica. Pode rodar de novo sempre que quiser atualizar.
const { spawnSync } = require('child_process');
const readline = require('readline');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const VERCEL = ['--yes', 'vercel@latest'];
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q, def = '') => new Promise((r) => rl.question(def ? `${q} [${def}]: ` : `${q}: `, (a) => r(a.trim() || def)));
const say = (t) => console.log(t);
const ok = (t) => console.log('  ✔ ' + t);
const fail = (t) => { console.error('\n  ✘ ' + t + '\n'); process.exit(1); };

function vercel(args, opts = {}) {
  return spawnSync(NPX, [...VERCEL, ...args], { stdio: opts.input !== undefined ? ['pipe', 'pipe', 'pipe'] : 'inherit', input: opts.input, encoding: 'utf8', shell: process.platform === 'win32' });
}

function setEnv(name, value) {
  if (!value) return;
  vercel(['env', 'rm', name, 'production', '--yes'], { input: '' });
  const r = vercel(['env', 'add', name, 'production'], { input: value });
  if (r.status !== 0) fail(`Não consegui salvar ${name} na Vercel.\n${r.stderr || r.stdout}`);
  ok(`${name} salva na Vercel`);
}

function replaceDomain(domain) {
  const files = ['public/index.html', 'public/privacidade.html', 'public/robots.txt', 'public/sitemap.xml'];
  for (const f of files) {
    const p = path.join(__dirname, f);
    const s = fs.readFileSync(p, 'utf8');
    if (s.includes('SEU-DOMINIO.com.br')) fs.writeFileSync(p, s.split('SEU-DOMINIO.com.br').join(domain));
  }
  ok(`Endereço ${domain} aplicado no site, sitemap e SEO`);
}

(async () => {
  say('\n  Kora · publicação automática na Vercel\n');
  const major = parseInt(process.versions.node, 10);
  if (major < 18) fail('Instale o Node.js 18 ou mais novo (nodejs.org) e rode de novo.');

  say('1) Chave da IA. Crie em console.anthropic.com → API Keys (começa com sk-ant-).');
  const anthropic = await ask('   Cole a chave');
  if (!/^sk-ant-/.test(anthropic)) fail('A chave precisa começar com sk-ant-.');

  say('\n2) Domínio. Se ainda não comprou, deixe em branco: o site sai num endereço .vercel.app.');
  const domain = (await ask('   Domínio (ex.: korabr.com.br)')).replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();

  say('\n3) Senha do painel de leads (/admin).');
  const adminKey = await ask('   Senha', crypto.randomBytes(9).toString('base64url'));

  say('\n4) Opcional: WhatsApp oficial (deixe em branco para configurar depois, pelo README).');
  const waToken = await ask('   WHATSAPP_TOKEN');
  const waPhone = waToken ? await ask('   WHATSAPP_PHONE_NUMBER_ID') : '';
  const waSecret = waToken ? await ask('   WHATSAPP_APP_SECRET') : '';
  const waVerify = waToken ? await ask('   WHATSAPP_VERIFY_TOKEN (invente uma senha)', crypto.randomBytes(8).toString('hex')) : '';
  const alert = await ask('   Seu WhatsApp para receber avisos de leads (só números, com 55 e DDD)', '5511996603491');
  const perfil = waToken ? await ask('   Esse número do WhatsApp é o SEU de vendas? (s/n)', 's') : 'n';

  say('\n5) Memória permanente (Upstash, grátis em upstash.com → Create Database).');
  say('   Sem ela, o painel /admin fica vazio: os leads chegam só pelos avisos no WhatsApp. Deixe em branco para configurar depois.');
  const upUrl = await ask('   UPSTASH_REDIS_REST_URL');
  const upToken = upUrl ? await ask('   UPSTASH_REDIS_REST_TOKEN') : '';

  rl.close();
  say('\nPreparando…');
  if (domain) replaceDomain(domain);

  say('\nEntrando na Vercel (se pedir, faça login no navegador ou pelo e-mail)…');
  if (vercel(['whoami'], { input: '' }).status !== 0 && vercel(['login']).status !== 0) fail('Login na Vercel não concluído.');
  ok('Conectado à Vercel');

  if (vercel(['link', '--yes']).status !== 0) fail('Não consegui criar ou ligar o projeto na Vercel.');
  ok('Projeto ligado');

  setEnv('ANTHROPIC_API_KEY', anthropic);
  setEnv('KORA_DEMO', 'true');
  setEnv('ADMIN_KEY', adminKey);
  setEnv('ALERT_WHATSAPP', alert.replace(/\D/g, ''));
  setEnv('WHATSAPP_TOKEN', waToken);
  setEnv('WHATSAPP_PHONE_NUMBER_ID', waPhone);
  setEnv('WHATSAPP_APP_SECRET', waSecret);
  setEnv('WHATSAPP_VERIFY_TOKEN', waVerify);
  if (waToken && /^s/i.test(perfil)) setEnv('KORA_WHATSAPP_PERFIL', 'kora');
  setEnv('UPSTASH_REDIS_REST_URL', upUrl);
  setEnv('UPSTASH_REDIS_REST_TOKEN', upToken);

  // arquivo .env local para testes com npm start
  fs.writeFileSync(path.join(__dirname, '.env'), `ANTHROPIC_API_KEY=${anthropic}\nKORA_DEMO=true\nADMIN_KEY=${adminKey}\n`);

  say('\nPublicando…');
  if (vercel(['deploy', '--prod', '--yes']).status !== 0) fail('A publicação falhou. Veja a mensagem acima.');
  ok('Site no ar');

  if (domain) {
    say('\nLigando o domínio…');
    vercel(['domains', 'add', domain]);
    say(`  → Crie no registro.br os registros de DNS que a Vercel mostrou acima (ou em vercel.com → projeto → Settings → Domains).`);
  }

  const base = domain ? `https://${domain}` : '(o endereço .vercel.app mostrado acima)';
  say(`
  Pronto! Guarde estas informações:

  • Site:              ${base}
  • Painel de leads:   ${base}/admin   senha: ${adminKey}
  • Cadastro cliente:  ${base}/cadastro
  ${waToken ? `• Webhook WhatsApp:  ${base}/api/whatsapp   token de verificação: ${waVerify}` : '• WhatsApp: siga o Passo 6 do README e rode este script de novo'}

  Teste agora: abra o site, clique em "Fale com a Kora" e confira se aparece "● IA ao vivo".
`);
})().catch((e) => fail(e.message));

// Teste rápido sem chaves reais: simula a API do Claude e confere agenda, chat e webhook.
// Rode com: npm test
const assert = require('assert');
const { Readable } = require('stream');
const crypto = require('crypto');

process.env.ANTHROPIC_API_KEY = 'teste';
process.env.WHATSAPP_VERIFY_TOKEN = 'segredo';
process.env.WHATSAPP_APP_SECRET = 'app-secret';
process.env.KORA_DEMO = 'true';

const agenda = require('../lib/agenda');
const { load } = require('../lib/config');
const clinica = load('clinica');
const loja = load('loja');
const { cleanHistory } = require('../lib/kora');

// ---- simulação da API do Claude: 1ª chamada pede horários, 2ª agenda, 3ª responde ----
let calls = 0;
let firstSlot = null;
global.fetch = async (url, opts) => {
  if (String(url).includes('anthropic.com')) {
    calls++;
    const body = JSON.parse(opts.body);
    assert.ok(body.system.includes('Kora'), 'prompt do sistema presente');
    let content, stop;
    if (calls === 1) {
      content = [{ type: 'tool_use', id: 't1', name: 'listar_horarios', input: { tipo: 'Limpeza' } }];
      stop = 'tool_use';
    } else if (calls === 2) {
      const res = JSON.parse(body.messages[body.messages.length - 1].content[0].content);
      firstSlot = { data: res.dias[0].data, horario: res.dias[0].livres[0] };
      content = [{ type: 'tool_use', id: 't2', name: 'agendar', input: { nome: 'Ana Souza', telefone: '11999990000', tipo: 'Limpeza', ...firstSlot } }];
      stop = 'tool_use';
    } else {
      const res = JSON.parse(body.messages[body.messages.length - 1].content[0].content);
      content = [{ type: 'text', text: `Prontinho, Ana! Protocolo ${res.protocolo}.` }];
      stop = 'end_turn';
    }
    return { ok: true, json: async () => ({ content, stop_reason: stop }) };
  }
  throw new Error('rede não esperada: ' + url);
};

function fakeReq(method, url, body, headers = {}) {
  const r = Readable.from(body ? [Buffer.from(body)] : []);
  Object.assign(r, { method, url, headers: { 'x-forwarded-for': '1.2.3.4', ...headers }, socket: {} });
  return r;
}
function fakeRes() {
  return {
    statusCode: 200, headers: {}, body: '',
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(b) { this.body = b || ''; this.done = true; },
  };
}

(async () => {
  // agenda
  assert.strictEqual(clinica.id, 'clinica');
  assert.strictEqual(load('xyz').id, 'empresa');
  const l = await agenda.listarHorarios(clinica, { tipo: 'Limpeza' });
  assert.ok(l.dias.length > 0, 'há dias livres');
  assert.ok(/^\d{2}:\d{2}$/.test(l.dias[0].livres[0]), 'formato de horário');
  await assert.rejects(agenda.agendar(clinica, { nome: 'Xis', tipo: 'Limpeza', data: '1999-01-01', horario: '09:00' }), /Data/);
  await assert.rejects(agenda.listarHorarios(loja, {}), /não faz agendamentos/);
  assert.strictEqual(agenda.consultarPedido(loja, { numero: '#4821' }).status, 'Em transporte');
  assert.strictEqual(agenda.consultarPedido(loja, { numero: '1' }).encontrado, false);
  const { toolsFor, systemPrompt } = require('../lib/kora');
  assert.deepStrictEqual(toolsFor(loja).map((t) => t.name), ['consultar_pedido', 'registrar_lead', 'chamar_atendente']);
  assert.ok(systemPrompt(load('restaurante'), 'site').includes('Para quantas pessoas'));

  // histórico
  assert.strictEqual(cleanHistory([{ role: 'assistant', content: 'oi' }]), null);
  assert.deepStrictEqual(cleanHistory([{ role: 'assistant', content: 'oi' }, { role: 'user', content: ' a ' }, { role: 'user', content: 'b' }]), [{ role: 'user', content: 'a\nb' }]);

  // chat do site
  const chat = require('../api/chat');
  let res = fakeRes();
  await chat(fakeReq('GET', '/api/chat'), res);
  assert.deepStrictEqual(JSON.parse(res.body), { ok: true, ai: true, demo: true });

  res = fakeRes();
  await chat(fakeReq('POST', '/api/chat', JSON.stringify({ segmento: 'clinica', messages: [{ role: 'user', content: 'quero marcar limpeza' }] })), res);
  const out = JSON.parse(res.body);
  assert.strictEqual(res.statusCode, 200, res.body);
  assert.ok(out.reply.includes('Protocolo'), 'resposta final');
  assert.strictEqual(out.events[0].type, 'booking');
  assert.strictEqual(out.events[0].data.horario, firstSlot.horario);

  // o mesmo horário não pode ser reservado duas vezes
  await assert.rejects(agenda.agendar(clinica, { nome: 'Beto', tipo: 'Limpeza', ...firstSlot }), /ocupado/);

  // webhook do WhatsApp
  const wa = require('../api/whatsapp');
  res = fakeRes();
  await wa(fakeReq('GET', '/api/whatsapp?hub.mode=subscribe&hub.verify_token=segredo&hub.challenge=123'), res);
  assert.strictEqual(res.body, '123');
  res = fakeRes();
  await wa(fakeReq('GET', '/api/whatsapp?hub.mode=subscribe&hub.verify_token=errado&hub.challenge=123'), res);
  assert.strictEqual(res.statusCode, 403);
  const payload = JSON.stringify({ entry: [] });
  res = fakeRes();
  await wa(fakeReq('POST', '/api/whatsapp', payload, { 'x-hub-signature-256': 'sha256=errada' }), res);
  assert.strictEqual(res.statusCode, 401);
  const sig = 'sha256=' + crypto.createHmac('sha256', 'app-secret').update(payload).digest('hex');
  res = fakeRes();
  await wa(fakeReq('POST', '/api/whatsapp', payload, { 'x-hub-signature-256': sig }), res);
  assert.strictEqual(res.statusCode, 200);


  // ---- perfis ----
  assert.strictEqual(load('kora').id, 'kora');
  assert.ok(toolsFor(load('kora')).some((t) => t.name === 'registrar_lead'));
  process.env.KORA_WHATSAPP_PERFIL = 'kora';
  assert.strictEqual(require('../lib/config').whatsappProfile().id, 'kora');
  delete process.env.KORA_WHATSAPP_PERFIL;

  // ---- lead via chat (IA simulada chama registrar_lead) ----
  calls = 0;
  global.fetch = async (url, opts) => {
    calls++;
    const body = JSON.parse(opts.body);
    if (calls === 1) return { ok: true, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 'l1', name: 'registrar_lead', input: { nome: 'Rita', empresa: 'Doces da Rita', ramo: 'confeitaria', whatsapp: '11988887777', interesse: 'Contratar a Kora', temperatura: 'quente' } }] }) };
    const res = body.messages[body.messages.length - 1].content[0];
    assert.ok(!res.is_error, res.content);
    return { ok: true, json: async () => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Anotado, Rita!' }] }) };
  };
  res = fakeRes();
  await chat(fakeReq('POST', '/api/chat', JSON.stringify({ segmento: 'loja', messages: [{ role: 'user', content: 'quero a kora pra minha confeitaria' }] }), { 'x-forwarded-for': '9.9.9.9' }), res);
  assert.strictEqual(res.statusCode, 200, res.body);
  assert.strictEqual(JSON.parse(res.body).events[0].type, 'lead');

  // ---- painel de leads ----
  const leadsApi = require('../api/leads');
  res = fakeRes(); await leadsApi(fakeReq('GET', '/api/leads'), res); assert.strictEqual(res.statusCode, 503);
  process.env.ADMIN_KEY = 'chave-teste';
  res = fakeRes(); await leadsApi(fakeReq('GET', '/api/leads', null, { 'x-admin-key': 'errada' }), res); assert.strictEqual(res.statusCode, 401);
  res = fakeRes(); await leadsApi(fakeReq('GET', '/api/leads', null, { 'x-admin-key': 'chave-teste' }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(JSON.parse(res.body).leads[0].nome, 'Rita');

  // ---- cadastro de cliente ----
  const cad = require('../api/cadastro');
  const form = {
    plano: 'Completo', responsavel: { nome: 'Paulo', whatsapp: '(19) 99999-1234', email: 'p@x.com' },
    nome: 'Pet Feliz', descricao: 'pet shop com banho e tosa', endereco: 'Rua A, 1', horarioTexto: 'seg a sáb, 9h às 18h',
    itens: [{ nome: 'Banho porte pequeno', preco: 'R$ 60' }, { nome: '', preco: '' }],
    informacoes: 'Leva e traz grátis até 3 km\n', faq: 'Aceita cartão? | Sim, em até 3x', regras: 'Usar emojis de pet',
    agenda: { ativo: true, rotulo: 'banho', tipos: [{ nome: 'Banho', duracaoMin: '60' }], dias: ['1', '2', '6'], faixas: [{ inicio: '09:00', fim: '12:00' }, { inicio: '25:00', fim: '26:00' }], intervaloMin: '30', antecedenciaMinHoras: '2' },
  };
  res = fakeRes(); await cad(fakeReq('POST', '/api/cadastro', JSON.stringify({ ...form, responsavel: { nome: '' } }), { 'x-forwarded-for': '7.7.7.7' }), res);
  assert.strictEqual(res.statusCode, 422);
  res = fakeRes(); await cad(fakeReq('POST', '/api/cadastro', JSON.stringify(form), { 'x-forwarded-for': '7.7.7.7' }), res);
  assert.strictEqual(res.statusCode, 200, res.body);
  const cfgNova = JSON.parse(res.body).config;
  assert.strictEqual(cfgNova.itens.length, 1);
  assert.deepStrictEqual(cfgNova.agendamento.horarios, { 1: ['09:00-12:00'], 2: ['09:00-12:00'], 6: ['09:00-12:00'] });
  assert.ok(cfgNova.informacoes.some((i) => i.includes('Aceita cartão')));
  const livres = await agenda.listarHorarios(cfgNova, {});
  assert.ok(Array.isArray(livres.dias));
  assert.ok(systemPrompt(cfgNova, 'whatsapp').includes('Pet Feliz'));
  console.log('✔ Todos os testes passaram');
})().catch((e) => { console.error('✘', e); process.exit(1); });

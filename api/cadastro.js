// POST /api/cadastro → o novo cliente envia os dados da empresa; a Kora gera a configuração e avisa você
const { readBody, sendJson, clientIp, rateLimit } = require('../lib/http');
const { buildConfig, validate } = require('../lib/cadastro');
const store = require('../lib/store');
const whatsapp = require('../lib/whatsapp');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' });
  if (!rateLimit('cadastro:' + clientIp(req), 5, 3600000)) return sendJson(res, 429, { error: 'rate_limited' });

  let f;
  try { f = JSON.parse(await readBody(req, 128 * 1024)); } catch (e) { return sendJson(res, e.status || 400, { error: 'invalid_body' }); }
  if (!f || typeof f !== 'object') return sendJson(res, 400, { error: 'invalid_body' });
  if (f.site_url) return sendJson(res, 200, { ok: true }); // campo invisível: robôs preenchem, pessoas não

  const erros = validate(f);
  if (erros.length) return sendJson(res, 422, { error: 'invalid', erros });

  const config = buildConfig(f);
  const r = f.responsavel || {};
  const registro = {
    quando: new Date().toISOString(),
    empresa: config.nome,
    responsavel: String(r.nome || '').slice(0, 80),
    whatsapp: String(r.whatsapp || '').replace(/[^\d+]/g, '').slice(0, 20),
    email: String(r.email || '').slice(0, 80),
    plano: String(f.plano || '').slice(0, 40),
    config,
  };
  await store.push('cadastros', registro, 200);

  const to = process.env.ALERT_WHATSAPP || process.env.CLINIC_ALERT_WHATSAPP;
  const aviso = `🆕 Novo cadastro de cliente\n${registro.empresa} · plano ${registro.plano || 'não escolhido'}\nResponsável: ${registro.responsavel} · ${registro.whatsapp}${registro.email ? ' · ' + registro.email : ''}\n${config.itens.length} itens · agenda ${config.agendamento ? 'sim' : 'não'}\nA configuração completa está no painel (/admin).`;
  console.log('[cadastro]', aviso);
  if (to && whatsapp.enabled()) await whatsapp.sendText(to, aviso).catch((e) => console.error('[cadastro:aviso]', e.message));

  return sendJson(res, 200, { ok: true, config });
};

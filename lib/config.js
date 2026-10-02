// Escolhe os dados da empresa que a Kora vai atender.
// - Cliente real: config/empresa.json (edite este arquivo).
// - Site de vendas com demonstração: KORA_DEMO=true libera os segmentos de config/demo/.
const empresa = require('../config/empresa.json');
let kora = null;
try { kora = require('../config/kora.json'); } catch (_) { /* perfil de vendas opcional */ }
const DEMO_IDS = ['loja', 'imobiliaria', 'restaurante', 'clinica', 'servicos'];
const demos = {};
for (const id of DEMO_IDS) {
  try { demos[id] = require(`../config/demo/${id}.json`); } catch (_) { /* pasta de demonstração removida */ }
}

// perfil: 'kora' (a Kora vendendo a Kora), um segmento de demonstração ou vazio (empresa do cliente)
function load(perfil) {
  if (perfil === 'kora' && kora) return kora;
  if (process.env.KORA_DEMO === 'true' && perfil && demos[perfil]) return demos[perfil];
  return empresa;
}

// perfil usado no WhatsApp: KORA_WHATSAPP_PERFIL=kora no seu número de vendas; vazio no número do cliente
function whatsappProfile() {
  return load(process.env.KORA_WHATSAPP_PERFIL || '');
}

module.exports = { load, whatsappProfile, DEMO_IDS };

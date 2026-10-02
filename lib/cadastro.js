// Transforma o formulário de cadastro de um novo cliente na configuração da Kora (config/empresa.json)
const clip = (v, n = 200) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const lines = (v, n = 30, len = 300) => String(v || '').split('\n').map((l) => clip(l, len)).filter(Boolean).slice(0, n);
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function buildConfig(f) {
  const itens = (Array.isArray(f.itens) ? f.itens : [])
    .map((i) => ({ nome: clip(i && i.nome, 120), preco: clip(i && i.preco, 120), detalhes: clip(i && i.detalhes, 200) }))
    .filter((i) => i.nome)
    .slice(0, 60)
    .map((i) => (i.detalhes ? i : { nome: i.nome, preco: i.preco }));

  const informacoes = lines(f.informacoes, 30);
  lines(f.faq, 30).forEach((l) => {
    const [q, a] = l.split('|').map((x) => clip(x, 280));
    if (q && a) informacoes.push(`Pergunta frequente: "${q}" Resposta: ${a}`);
  });

  let agendamento = null;
  if (f.agenda && f.agenda.ativo) {
    const a = f.agenda;
    const tipos = (Array.isArray(a.tipos) ? a.tipos : [])
      .map((t) => ({ nome: clip(t && t.nome, 80), duracaoMin: Math.min(480, Math.max(10, parseInt(t && t.duracaoMin, 10) || 60)) }))
      .filter((t) => t.nome)
      .slice(0, 12);
    const faixas = (Array.isArray(a.faixas) ? a.faixas : [])
      .filter((x) => x && HHMM.test(x.inicio) && HHMM.test(x.fim) && x.inicio < x.fim)
      .map((x) => `${x.inicio}-${x.fim}`)
      .slice(0, 3);
    const horarios = {};
    (Array.isArray(a.dias) ? a.dias : []).map(String).filter((d) => /^[0-6]$/.test(d)).forEach((d) => { if (faixas.length) horarios[d] = faixas; });
    if (tipos.length && Object.keys(horarios).length) {
      agendamento = {
        rotulo: clip(a.rotulo, 30) || 'agendamento',
        tipos,
        horarios,
        intervaloMin: [15, 20, 30, 45, 60].includes(+a.intervaloMin) ? +a.intervaloMin : 30,
        antecedenciaMinHoras: Math.min(72, Math.max(0, parseInt(a.antecedenciaMinHoras, 10) || 2)),
        diasAgenda: 14,
      };
      const det = clip(a.detalhe, 160);
      if (det) agendamento.detalhe = det;
    }
  }

  return {
    id: 'empresa',
    nome: clip(f.nome, 100),
    ficticia: false,
    assistente: clip(f.assistente, 40) || 'Kora',
    descricao: clip(f.descricao, 200),
    endereco: clip(f.endereco, 200),
    horarioTexto: clip(f.horarioTexto, 200),
    rotuloItens: clip(f.rotuloItens, 40) || 'Produtos e serviços',
    itens,
    informacoes,
    regras: lines(f.regras, 15, 250),
    agendamento,
    pedidos: null,
    leads: true,
    sobreKora: '',
  };
}

function validate(f) {
  const erros = [];
  if (!clip(f.nome)) erros.push('Informe o nome da empresa.');
  if (!clip(f.descricao)) erros.push('Descreva a empresa em uma frase.');
  if (!clip(f.responsavel && f.responsavel.nome)) erros.push('Informe o nome do responsável.');
  if (!/\d{10,13}/.test(String(f.responsavel && f.responsavel.whatsapp || '').replace(/\D/g, ''))) erros.push('Informe um WhatsApp com DDD.');
  return erros;
}

module.exports = { buildConfig, validate };

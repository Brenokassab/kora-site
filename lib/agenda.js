// Agenda: gera horários a partir do config da empresa e cruza com o Google Agenda (ou memória no modo demonstração)
const google = require('./google');

const OFFSET_MIN = -180; // America/Sao_Paulo (sem horário de verão desde 2019)
const OFFSET_STR = '-03:00';
const WD = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const spDate = (ms = Date.now()) => new Date(ms + OFFSET_MIN * 60000);
const ymd = (d) => d.toISOString().slice(0, 10);
const toMs = (date, hhmm) => Date.parse(`${date}T${hhmm}:00${OFFSET_STR}`);
const toISO = (ms) => { const d = spDate(ms); return `${ymd(d)}T${d.toISOString().slice(11, 19)}${OFFSET_STR}`; };
const hhmmOf = (ms) => spDate(ms).toISOString().slice(11, 16);
const minutes = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const fmt = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const dateLabel = (date) => { const d = new Date(`${date}T12:00:00Z`); return `${WD[d.getUTCDay()]} ${date.slice(8, 10)}/${date.slice(5, 7)}`; };

function days(n = 14) {
  const out = [], base = spDate();
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + i, 12));
    out.push({ date: ymd(d), weekday: d.getUTCDay(), label: dateLabel(ymd(d)) });
  }
  return out;
}

function findTipo(cfg, name) {
  const tipos = (cfg.agendamento && cfg.agendamento.tipos) || [];
  const n = norm(name);
  if (!n) return tipos[0] || null;
  return tipos.find((t) => norm(t.nome) === n)
    || tipos.find((t) => n.includes(norm(t.nome).split(' ')[0]) || norm(t.nome).includes(n))
    || null;
}

// ---------- ocupação ----------
const memBusy = {}; // por empresa, no modo sem Google Agenda
function demoBusy(cfg) {
  if (memBusy[cfg.id]) return memBusy[cfg.id];
  const list = (memBusy[cfg.id] = []);
  if (!cfg.ficticia) return list;
  days(cfg.agendamento.diasAgenda).forEach((d, i) => {
    (cfg.agendamento.horarios[String(d.weekday)] || []).forEach((r, j) => {
      const start = toMs(d.date, fmt(minutes(r.split('-')[0]) + ((i + j) % 3) * 60));
      list.push({ start, end: start + 60 * 60000 });
    });
  });
  return list;
}

let cache = { at: 0, list: [] };
async function busyIntervals(cfg, fresh = false) {
  if (google.enabled() && !cfg.ficticia) {
    if (!fresh && Date.now() - cache.at < 30000) return cache.list;
    const all = days(cfg.agendamento.diasAgenda);
    const list = await google.busy(toISO(toMs(all[0].date, '00:00')), toISO(toMs(all[all.length - 1].date, '23:59')));
    cache = { at: Date.now(), list };
    return list;
  }
  return demoBusy(cfg);
}

const overlaps = (s, e, busy) => busy.some((b) => s < b.end && e > b.start);

function candidates(cfg, day, durMin) {
  const A = cfg.agendamento;
  const step = A.intervaloMin || 30;
  const lead = Date.now() + (A.antecedenciaMinHoras || 0) * 3600000;
  const out = [];
  for (const r of A.horarios[String(day.weekday)] || []) {
    const [a, b] = r.split('-').map(minutes);
    for (let m = a; m + durMin <= b; m += step) {
      const start = toMs(day.date, fmt(m));
      if (start > lead) out.push({ start, end: start + durMin * 60000 });
    }
  }
  return out;
}

// ---------- ferramentas ----------
async function listarHorarios(cfg, { data, tipo } = {}) {
  if (!cfg.agendamento) throw new Error('Esta empresa não faz agendamentos.');
  const tp = findTipo(cfg, tipo) || cfg.agendamento.tipos[0];
  const dur = tp.duracaoMin || 60;
  const busy = await busyIntervals(cfg);
  const all = days(cfg.agendamento.diasAgenda);
  const free = (day) => candidates(cfg, day, dur).filter((c) => !overlaps(c.start, c.end, busy)).map((c) => hhmmOf(c.start));
  if (data) {
    const day = all.find((d) => d.date === String(data).slice(0, 10));
    if (!day) return { erro: 'Data fora da agenda aberta', agendaAte: all[all.length - 1].date };
    return { tipo: tp.nome, data: day.date, dia: day.label, livres: free(day).slice(0, 14), fechado: !(cfg.agendamento.horarios[String(day.weekday)] || []).length };
  }
  const res = [];
  for (const d of all) {
    const livres = free(d);
    if (livres.length) res.push({ data: d.date, dia: d.label, livres: livres.slice(0, 8) });
    if (res.length >= 5) break;
  }
  return { tipo: tp.nome, dias: res };
}

async function agendar(cfg, { nome, telefone, tipo, data, horario, detalhes }) {
  if (!cfg.agendamento) throw new Error('Esta empresa não faz agendamentos.');
  nome = String(nome || '').trim().slice(0, 80);
  if (nome.length < 2) throw new Error('Falta o nome do cliente.');
  const tp = findTipo(cfg, tipo);
  if (!tp) throw new Error('Tipo não encontrado. Opções: ' + cfg.agendamento.tipos.map((t) => t.nome).join(', '));
  const day = days(cfg.agendamento.diasAgenda).find((d) => d.date === String(data || '').slice(0, 10));
  if (!day) throw new Error('Data inválida ou fora da agenda. Use AAAA-MM-DD.');
  const m = String(horario || '').match(/(\d{1,2})[:h]?(\d{2})?/);
  if (!m) throw new Error('Horário inválido. Use HH:MM.');
  const hh = String(+m[1]).padStart(2, '0') + ':' + (m[2] || '00');
  const slot = candidates(cfg, day, tp.duracaoMin || 60).find((c) => hhmmOf(c.start) === hh);
  if (!slot) throw new Error(`O horário ${hh} não existe na agenda de ${day.label}.`);
  const busy = await busyIntervals(cfg, true);
  if (overlaps(slot.start, slot.end, busy)) throw new Error(`O horário ${hh} de ${day.label} acabou de ser ocupado. Ofereça outro.`);

  const protocolo = 'K' + Date.now().toString(36).slice(-5).toUpperCase();
  const tel = String(telefone || '').replace(/[^\d+]/g, '').slice(0, 20);
  const det = String(detalhes || '').slice(0, 200);
  if (google.enabled() && !cfg.ficticia) {
    await google.createEvent({
      summary: `${tp.nome} · ${nome}`,
      description: `Agendado pela ${cfg.assistente || 'Kora'}\nCliente: ${nome}\nTelefone: ${tel || 'não informado'}${det ? `\nDetalhes: ${det}` : ''}\nProtocolo: ${protocolo}`,
      startISO: toISO(slot.start),
      endISO: toISO(slot.end),
    });
    cache.at = 0;
  } else {
    busy.push({ start: slot.start, end: slot.end });
  }
  return { ok: true, protocolo, nome, telefone: tel, tipo: tp.nome, data: day.date, dia: day.label, horario: hh, detalhes: det, rotulo: cfg.agendamento.rotulo };
}

function consultarPedido(cfg, { numero }) {
  const n = String(numero || '').replace(/\D/g, '');
  const p = (cfg.pedidos || []).find((x) => x.numero === n);
  if (!p) return { encontrado: false, numero: n };
  return { encontrado: true, ...p };
}

module.exports = { listarHorarios, agendar, consultarPedido, days, dateLabel, spDate, ymd };

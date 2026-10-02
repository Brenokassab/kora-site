# Fonte única dos 5 segmentos de demonstração.
# Gera config/demo/*.json (servidor) e build/segments.json (chat do site).
import json, os, sys

SOBRE = ("Se perguntarem sobre a própria Kora (o produto, quem fez, quanto custa): explique que esta é uma demonstração; "
         "a Kora é uma atendente com IA para empresas, que atende no site e no WhatsApp, vende, agenda e tira dúvidas. "
         "Planos: Essencial R$ 149/mês + implantação R$ 790; Completo R$ 249/mês + implantação R$ 1.890. "
         "Contato: WhatsApp (11) 99660-3491 ou brenokojian0@gmail.com. "
         "Se a pessoa quiser a Kora para a empresa dela, peça nome, nome da empresa, ramo e WhatsApp e use registrar_lead com interesse 'Contratar a Kora'; depois diga que a equipe da Kora entra em contato.")

SEG = {
 "loja": {
  "aba": "Loja", "nome": "Passo Certo Calçados", "descricao": "loja de tênis e calçados, com site e loja física",
  "endereco": "Rua Augusta, 1200, Consolação, São Paulo - SP",
  "horarioTexto": "segunda a sábado, 10h às 20h; domingo, 12h às 18h",
  "rotuloItens": "Produtos",
  "itens": [
   {"nome": "Tênis Corrida Vento", "preco": "R$ 349,90", "detalhes": "numeração 34 a 44, preto ou azul; no 42 restam 3 pares"},
   {"nome": "Tênis Casual Urbano", "preco": "R$ 279,90", "detalhes": "numeração 35 a 43, branco ou bege"},
   {"nome": "Chuteira Society Arena", "preco": "R$ 229,90", "detalhes": "numeração 36 a 44"},
   {"nome": "Tênis Infantil Pulo", "preco": "R$ 169,90", "detalhes": "numeração 24 a 34, com luz de LED"},
   {"nome": "Kit 3 Meias Performance", "preco": "R$ 59,90", "detalhes": "tamanho único 38 a 44"}
  ],
  "informacoes": [
   "Frete grátis acima de R$ 299 para todo o Brasil; abaixo disso, frete fixo de R$ 19,90.",
   "Entrega em São Paulo capital em até 2 dias úteis; outras regiões, de 3 a 8 dias úteis.",
   "Troca grátis em até 30 dias, com o produto sem uso e na caixa.",
   "Pagamento: Pix com 5% de desconto, cartão em até 6x sem juros ou boleto.",
   "Retirada grátis na loja física no mesmo dia para compras feitas até 16h."
  ],
  "regras": ["Ajude a escolher: pergunte para que o cliente vai usar e o número antes de indicar.",
             "Para finalizar a compra, oriente a comprar pelo site ou ofereça chamar um vendedor."],
  "agendamento": None,
  "pedidos": [
   {"numero": "4821", "status": "Em transporte", "detalhe": "saiu para entrega hoje, previsão até 18h", "itens": "Tênis Corrida Vento 41"},
   {"numero": "4855", "status": "Pagamento aprovado", "detalhe": "será enviado em até 1 dia útil", "itens": "Tênis Casual Urbano 38"},
   {"numero": "4790", "status": "Entregue", "detalhe": "entregue em 26/09", "itens": "Chuteira Society Arena 40"}
  ],
  "saudacao": "Oi! Eu sou a Kora, da Passo Certo Calçados 👟\nPosso te ajudar a escolher um tênis, ver seu pedido ou explicar trocas e frete.",
  "atalhos": ["Quero um tênis de corrida", "Onde está meu pedido?", "Como funciona a troca?", "Frete e prazo", "Falar com vendedor"],
  "faq": [
   {"k": "frete|entrega|prazo|chega", "a": "Frete grátis acima de R$ 299 😉 Abaixo disso, R$ 19,90. Em São Paulo capital chega em até 2 dias úteis; nas outras regiões, de 3 a 8."},
   {"k": "troca|devolu|trocar|tamanho errado", "a": "A troca é grátis em até 30 dias, com o produto sem uso e na caixa. É só me dizer o número do pedido que eu te passo o passo a passo."},
   {"k": "pagamento|pix|cartao|parcel|boleto", "a": "Pix com 5% de desconto, cartão em até 6x sem juros ou boleto."},
   {"k": "corrida|correr", "a": "Para corrida, o mais pedido é o Tênis Corrida Vento, R$ 349,90, do 34 ao 44, preto ou azul. No 42 restam só 3 pares! Qual é o seu número?"},
   {"k": "retir", "a": "Comprando até 16h, você retira grátis na loja da Rua Augusta no mesmo dia."}
  ],
  "cartao": ["Vende e resolve pedidos", "Recomenda o produto certo, informa frete e troca e responde onde está o pedido."]
 },
 "imobiliaria": {
  "aba": "Imobiliária", "nome": "Morada Nova Imóveis", "descricao": "imobiliária de aluguel e venda em São Paulo",
  "endereco": "Av. Paulista, 1500, conjunto 32, Bela Vista, São Paulo - SP",
  "horarioTexto": "segunda a sexta, 9h às 18h; sábado, 9h às 13h",
  "rotuloItens": "Imóveis disponíveis",
  "itens": [
   {"nome": "MN-101 · Apartamento 2 dormitórios, 68 m², Vila Mariana", "preco": "aluguel R$ 3.200 + condomínio R$ 780", "detalhes": "1 vaga, a 400 m do metrô"},
   {"nome": "MN-102 · Studio mobiliado, 32 m², Pinheiros", "preco": "aluguel R$ 2.600 com condomínio incluso", "detalhes": "prédio com academia e lavanderia"},
   {"nome": "MN-103 · Apartamento 1 dormitório, 45 m², Bela Vista", "preco": "aluguel R$ 2.100 + condomínio R$ 520", "detalhes": "aceita pet"},
   {"nome": "MN-201 · Apartamento 3 dormitórios, 92 m², Moema", "preco": "venda R$ 1.150.000", "detalhes": "2 vagas, varanda gourmet"},
   {"nome": "MN-202 · Casa 3 dormitórios com quintal, 140 m², Santana", "preco": "venda R$ 890.000", "detalhes": "2 vagas, aceita financiamento"}
  ],
  "informacoes": [
   "Garantias para aluguel: seguro fiança, título de capitalização ou fiador.",
   "Documentos para alugar: RG, CPF e comprovante de renda de 3 vezes o valor do aluguel.",
   "Compra: fazemos simulação de financiamento gratuita com os principais bancos.",
   "Todas as visitas são acompanhadas por um corretor."
  ],
  "regras": ["Antes de indicar imóveis, descubra se a pessoa quer comprar ou alugar, a região e o orçamento.",
             "Ao agendar visita, registre o código do imóvel em detalhes."],
  "agendamento": {
   "rotulo": "visita", "tipos": [{"nome": "Visita ao imóvel", "duracaoMin": 45}],
   "horarios": {"1": ["09:00-18:00"], "2": ["09:00-18:00"], "3": ["09:00-18:00"], "4": ["09:00-18:00"], "5": ["09:00-18:00"], "6": ["09:00-13:00"]},
   "intervaloMin": 60, "antecedenciaMinHoras": 3, "diasAgenda": 14,
   "detalhe": "Qual imóvel você quer visitar? Pode mandar o código, como MN-101."
  },
  "saudacao": "Olá! Eu sou a Kora, da Morada Nova Imóveis 🏡\nVocê procura imóvel para comprar ou para alugar?",
  "atalhos": ["Quero alugar", "Quero comprar", "Agendar visita", "Documentos para alugar", "Falar com corretor"],
  "faq": [
   {"k": "document|papel|precis", "a": "Para alugar você precisa de RG, CPF e comprovante de renda de 3 vezes o valor do aluguel. Aceitamos seguro fiança, título de capitalização ou fiador."},
   {"k": "financ|banco|simula", "a": "Fazemos a simulação de financiamento gratuita com os principais bancos. Quer agendar uma visita e já conversar com o corretor sobre isso?"},
   {"k": "pet|cachorro|gato", "a": "O MN-103, na Bela Vista, aceita pet: 1 dormitório, 45 m², aluguel R$ 2.100 + condomínio R$ 520."},
   {"k": "alug", "a": "Para alugar, tenho:\n• MN-101 · 2 dorm., Vila Mariana · R$ 3.200 + cond.\n• MN-102 · Studio mobiliado, Pinheiros · R$ 2.600\n• MN-103 · 1 dorm., Bela Vista, aceita pet · R$ 2.100 + cond.\nQuer agendar uma visita?"},
   {"k": "compr|venda", "a": "À venda, tenho:\n• MN-201 · 3 dorm., 92 m², Moema · R$ 1.150.000\n• MN-202 · Casa 3 dorm., Santana · R$ 890.000\nQuer agendar uma visita?"}
  ],
  "cartao": ["Qualifica e agenda visitas", "Descobre o que o cliente procura, indica imóveis e marca a visita com o corretor."]
 },
 "restaurante": {
  "aba": "Restaurante", "nome": "Cantina Nonna Rosa", "descricao": "cantina italiana com salão e delivery",
  "endereco": "Rua Treze de Maio, 800, Bela Vista, São Paulo - SP",
  "horarioTexto": "terça a domingo, almoço 12h às 15h e jantar 19h às 23h; segunda fechado",
  "rotuloItens": "Cardápio",
  "itens": [
   {"nome": "Menu executivo (almoço, terça a sexta)", "preco": "R$ 49", "detalhes": "entrada, prato e sobremesa"},
   {"nome": "Lasanha à bolonhesa", "preco": "R$ 68"},
   {"nome": "Nhoque ao sugo", "preco": "R$ 59", "detalhes": "versão sem glúten sob encomenda"},
   {"nome": "Spaghetti à carbonara", "preco": "R$ 64"},
   {"nome": "Pizza margherita individual", "preco": "R$ 52", "detalhes": "opção vegetariana"},
   {"nome": "Tiramisù", "preco": "R$ 32"}
  ],
  "informacoes": [
   "Delivery pelo WhatsApp e pelos aplicativos de entrega, das 19h às 22h30, com taxa a partir de R$ 8.",
   "Mesas para até 12 pessoas; grupos maiores falam com o gerente.",
   "Manobrista: R$ 25.",
   "Aniversariante do dia ganha uma sobremesa.",
   "Opções vegetarianas e sem glúten indicadas no cardápio."
  ],
  "regras": ["Ao reservar, pergunte para quantas pessoas e registre em detalhes.",
             "Grupos com mais de 12 pessoas: chame o atendente."],
  "agendamento": {
   "rotulo": "reserva", "tipos": [{"nome": "Reserva de mesa", "duracaoMin": 120}],
   "horarios": {"2": ["12:00-15:00", "19:00-23:00"], "3": ["12:00-15:00", "19:00-23:00"], "4": ["12:00-15:00", "19:00-23:00"], "5": ["12:00-15:00", "19:00-23:00"], "6": ["12:00-15:00", "19:00-23:00"], "0": ["12:00-15:00", "19:00-23:00"]},
   "intervaloMin": 30, "antecedenciaMinHoras": 1, "diasAgenda": 14,
   "detalhe": "Para quantas pessoas é a reserva?"
  },
  "saudacao": "Buonasera! Eu sou a Kora, da Cantina Nonna Rosa 🍝\nPosso reservar sua mesa, mostrar o cardápio ou explicar o delivery.",
  "atalhos": ["Reservar mesa", "Ver cardápio", "Delivery", "Tem opção sem glúten?", "Falar com o gerente"],
  "faq": [
   {"k": "delivery|entrega|pedir em casa|ifood", "a": "Fazemos delivery pelo WhatsApp e pelos aplicativos, das 19h às 22h30, com taxa a partir de R$ 8 🛵"},
   {"k": "gluten|celiac", "a": "Temos nhoque sem glúten sob encomenda. Avise na reserva que a cozinha prepara com cuidado 💚"},
   {"k": "vegetar|vegan", "a": "Temos opções vegetarianas, como a pizza margherita e o nhoque ao sugo."},
   {"k": "aniversar", "a": "Aniversariante do dia ganha uma sobremesa 🎂 Quer reservar a mesa?"},
   {"k": "estacion|manobr", "a": "Temos manobrista por R$ 25."}
  ],
  "cartao": ["Reserva mesas e mostra o cardápio", "Faz reservas com número de pessoas, explica o delivery e indica pratos."]
 },
 "clinica": {
  "aba": "Clínica", "nome": "Clínica Sorriso Vivo", "descricao": "clínica odontológica",
  "endereco": "Rua das Acácias, 250, sala 12, Vila Mariana, São Paulo - SP",
  "horarioTexto": "segunda a sexta, 8h às 19h; sábado, 8h às 12h",
  "rotuloItens": "Serviços",
  "itens": [
   {"nome": "Avaliação", "preco": "R$ 120, abatido se fizer o tratamento"},
   {"nome": "Limpeza", "preco": "R$ 180"},
   {"nome": "Clareamento", "preco": "a partir de R$ 690"},
   {"nome": "Restauração", "preco": "a partir de R$ 220"},
   {"nome": "Tratamento de canal", "preco": "a partir de R$ 850"}
  ],
  "informacoes": [
   "Convênios: Amil Dental, Bradesco Dental e OdontoPrev; outros planos, reembolso com nota fiscal.",
   "Pagamento: Pix, débito e crédito em até 10x sem juros.",
   "Avaliação e limpeza não exigem preparo."
  ],
  "regras": ["Nunca dê diagnóstico, receita ou orientação clínica.",
             "Em dor forte, sangramento, inchaço ou trauma: acolha, oriente pronto-atendimento se for grave e chame o atendente como urgente."],
  "agendamento": {
   "rotulo": "consulta",
   "tipos": [{"nome": "Avaliação", "duracaoMin": 30}, {"nome": "Limpeza", "duracaoMin": 60}, {"nome": "Clareamento", "duracaoMin": 60},
             {"nome": "Restauração", "duracaoMin": 60}, {"nome": "Tratamento de canal", "duracaoMin": 90}],
   "horarios": {"1": ["08:00-12:00", "14:00-19:00"], "2": ["08:00-12:00", "14:00-19:00"], "3": ["08:00-12:00", "14:00-19:00"], "4": ["08:00-12:00", "14:00-19:00"], "5": ["08:00-12:00", "14:00-19:00"], "6": ["08:00-12:00"]},
   "intervaloMin": 30, "antecedenciaMinHoras": 2, "diasAgenda": 14
  },
  "saudacao": "Olá! Eu sou a Kora, da Clínica Sorriso Vivo 😁\nPosso agendar sua consulta, informar valores e convênios.",
  "atalhos": ["Agendar consulta", "Valores", "Convênios", "Endereço", "Falar com atendente"],
  "faq": [
   {"k": "conven|plano|amil|bradesco|odonto|unimed", "a": "Atendemos Amil Dental, Bradesco Dental e OdontoPrev. Outros planos: reembolso com nota fiscal."},
   {"k": "pagamento|pix|cartao|parcel", "a": "Aceitamos Pix, débito e crédito em até 10x sem juros."},
   {"k": "dor|sangr|inchad|urgen|quebr", "a": "!urgente"}
  ],
  "cartao": ["Agenda consultas e confirma presença", "Marca horários, informa convênios e chama a equipe em urgências."]
 },
 "servicos": {
  "aba": "Serviços", "nome": "Prisma Contabilidade", "descricao": "escritório de contabilidade digital para MEI e pequenas empresas",
  "endereco": "atendimento 100% online; sede na Rua Vergueiro, 3000, Vila Mariana, São Paulo - SP",
  "horarioTexto": "segunda a sexta, 9h às 18h",
  "rotuloItens": "Serviços e planos",
  "itens": [
   {"nome": "Contabilidade para MEI", "preco": "R$ 89/mês", "detalhes": "DAS, declaração anual e suporte"},
   {"nome": "Contabilidade Simples Nacional (serviços)", "preco": "a partir de R$ 390/mês", "detalhes": "depende do faturamento e do número de funcionários"},
   {"nome": "Abertura de empresa", "preco": "R$ 890, grátis ao contratar o plano anual"},
   {"nome": "Declaração de Imposto de Renda (pessoa física)", "preco": "a partir de R$ 250"},
   {"nome": "Troca de contador", "preco": "gratuita, cuidamos de toda a transição"}
  ],
  "informacoes": [
   "Primeira reunião de diagnóstico gratuita, por vídeo, com 30 minutos.",
   "Atendemos empresas de todo o Brasil.",
   "Pagamento por boleto ou Pix, todo mês."
  ],
  "regras": ["Não dê parecer tributário definitivo; para casos específicos, ofereça a reunião de diagnóstico.",
             "Qualifique: pergunte se a pessoa já tem empresa, o tipo (MEI, ME) e o ramo."],
  "agendamento": {
   "rotulo": "reunião", "tipos": [{"nome": "Reunião de diagnóstico (gratuita, por vídeo)", "duracaoMin": 30}],
   "horarios": {"1": ["09:00-12:00", "14:00-18:00"], "2": ["09:00-12:00", "14:00-18:00"], "3": ["09:00-12:00", "14:00-18:00"], "4": ["09:00-12:00", "14:00-18:00"], "5": ["09:00-12:00", "14:00-18:00"]},
   "intervaloMin": 30, "antecedenciaMinHoras": 2, "diasAgenda": 14
  },
  "saudacao": "Olá! Eu sou a Kora, da Prisma Contabilidade 📊\nVocê já tem empresa ou quer abrir uma?",
  "atalhos": ["Quero abrir uma empresa", "Sou MEI", "Trocar de contador", "Agendar reunião", "Falar com um contador"],
  "faq": [
   {"k": "abrir|abertura", "a": "A abertura custa R$ 890 e sai grátis se você contratar o plano anual. Quer agendar uma reunião de diagnóstico gratuita para ver o melhor formato para você?"},
   {"k": "\\bmei\\b|microempreendedor", "a": "Para MEI a contabilidade é R$ 89/mês, com DAS, declaração anual e suporte. Quer começar?"},
   {"k": "trocar|troca de contador|mudar de contador", "a": "A troca de contador é gratuita e a gente cuida de toda a transição com o contador atual. Quer agendar uma reunião rápida?"},
   {"k": "imposto de renda|irpf|declara", "a": "A declaração de Imposto de Renda de pessoa física sai a partir de R$ 250."}
  ],
  "cartao": ["Qualifica leads e marca reuniões", "Entende o cliente, explica os planos e agenda a reunião de diagnóstico."]
 }
}

ORDER = ["loja", "imobiliaria", "restaurante", "clinica", "servicos"]
root = sys.argv[1]
os.makedirs(os.path.join(root, 'config/demo'), exist_ok=True)
os.makedirs(os.path.join(root, 'build'), exist_ok=True)
out = []
for k in ORDER:
    s = dict(SEG[k]); s["id"] = k; s["ficticia"] = True; s["assistente"] = "Kora"; s["sobreKora"] = SOBRE; s["leads"] = True
    s.setdefault("pedidos", None)
    json.dump(s, open(os.path.join(root, f'config/demo/{k}.json'), 'w'), ensure_ascii=False, indent=2)
    out.append(s)
# modelo para cliente real: parte da loja, sem textos de demonstração
emp = dict(SEG["servicos"]); emp["id"] = "empresa"; emp["ficticia"] = False; emp["assistente"] = "Kora"; emp["sobreKora"] = ""; emp["pedidos"] = None; emp["leads"] = True
json.dump(emp, open(os.path.join(root, 'config/empresa.json'), 'w'), ensure_ascii=False, indent=2)
json.dump(out, open(os.path.join(root, 'build/segments.json'), 'w'), ensure_ascii=False)
print('ok', len(out))

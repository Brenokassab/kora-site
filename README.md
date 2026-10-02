# Kora · site + atendente virtual com IA

## Caminho rápido: no ar em 15 minutos

1. Crie a chave da IA em **console.anthropic.com** (Passo 1 abaixo) e instale o **Node.js** LTS (nodejs.org).
2. Descompacte este pacote, abra a pasta no terminal e rode:
   ```
   node publicar.js
   ```
3. Responda as perguntas (chave, domínio se tiver, senha do painel). O script faz login na Vercel pelo navegador, configura todas as chaves e publica.
4. No final ele mostra os três endereços que você vai usar:
   - **o site**, para mostrar aos clientes;
   - **/cadastro**, para o cliente que fechou preencher os dados da empresa;
   - **/admin**, o painel com os leads e os cadastros (senha que você escolheu).

Rode `node publicar.js` de novo sempre que quiser atualizar algo (domínio, WhatsApp, memória). Os passos manuais abaixo continuam valendo se preferir fazer à mão.

---

Este pacote tem tudo para colocar a Kora no ar de verdade:

- **Site** com a animação 3D, SEO completo (título, descrição, imagem de compartilhamento, dados estruturados), página de privacidade, `robots.txt` e `sitemap.xml`.
- **Chat do site** ligado à IA do Claude, com abas de demonstração para 5 tipos de empresa: loja, imobiliária, restaurante, clínica e escritório de serviços. Ele consulta a agenda, marca horários, consulta pedidos e chama a equipe. Se a IA estiver desligada, o chat funciona sozinho em modo demonstração.
- **WhatsApp oficial** (API da Meta): a mesma Kora responde pelo número da empresa.
- **Google Agenda** (opcional): os horários livres e os agendamentos saem e entram direto na agenda da empresa.
- **Avisos para a equipe**: cada agendamento, pedido de atendimento humano ou urgência chega no WhatsApp da empresa.
- **Captura de leads**: quando alguém mostra interesse em comprar ou contratar, a Kora anota nome, empresa e contato, avisa você no WhatsApp e guarda no painel `/admin` (com exportação para planilha).
- **A Kora vendendo a Kora**: com `KORA_WHATSAPP_PERFIL=kora`, ela atende o seu número de vendas, explica os planos, qualifica o interessado e marca a demonstração na sua agenda (`config/kora.json`).
- **Cadastro automático de clientes**: o cliente preenche `/cadastro` e a configuração da Kora dele fica pronta no painel, para copiar e colar.

Nenhuma dependência para instalar. Só precisa do Node 18 ou mais novo, se quiser testar no seu computador.

---

## Mapa dos arquivos

| Caminho | O que é |
|---|---|
| `public/index.html` | O site |
| `public/privacidade.html` | Política de privacidade (a Meta exige para o WhatsApp) |
| `public/og-image.png` | Imagem que aparece quando o link é compartilhado |
| `config/kora.json` | A Kora vendendo a própria Kora (seu WhatsApp de vendas): planos, regras e agenda de demonstrações |
| `config/empresa.json` | **Dados da empresa do cliente**: produtos, preços, políticas, horários, agenda. É aqui que você personaliza para cada cliente |
| `config/demo/` | As 5 empresas fictícias das abas de demonstração do seu site |
| `segmentos.py` | Gera os arquivos de demonstração (só se quiser mudar as empresas fictícias) |
| `api/chat.js` | Servidor do chat do site |
| `api/whatsapp.js` | Servidor do WhatsApp |
| `api/leads.js` · `public/admin.html` | Painel de leads e cadastros (protegido pela `ADMIN_KEY`) |
| `api/cadastro.js` · `public/cadastro.html` | Formulário de cadastro de novos clientes |
| `publicar.js` | Publica tudo na Vercel com um comando |
| `lib/kora.js` | O "cérebro": regras da atendente e ferramentas |
| `lib/agenda.js` | Horários livres e agendamento |
| `.env.example` | Lista das chaves que você vai configurar |
| `dev.js` | Servidor para testar no seu computador |
| `test/smoke.js` | Teste automático (rode com `npm test`) |

---

## Passo 1 · Chave da IA (Anthropic)

1. Crie uma conta em **console.anthropic.com**.
2. Em **Billing**, adicione créditos e defina um **limite de gasto mensal**, para nunca ter surpresa.
3. Em **API Keys**, clique em **Create Key** e copie a chave (começa com `sk-ant-`). Guarde num lugar seguro: ela só aparece uma vez.

O modelo padrão é o **Claude Haiku 4.5**, rápido e barato, ideal para atendimento. Para trocar, preencha `KORA_MODEL`.

## Passo 2 · Testar no seu computador (opcional)

1. Instale o **Node.js** (nodejs.org, versão LTS).
2. Descompacte este pacote, abra a pasta no terminal e crie um arquivo chamado `.env` com as linhas:
   `ANTHROPIC_API_KEY=sua-chave-aqui`
   `KORA_DEMO=true`
3. Rode `npm start` e abra **http://localhost:3000**.
4. Clique em **Fale com a Kora**, escolha uma aba (Loja, Imobiliária…) e converse. No topo do chat deve aparecer **● IA ao vivo**.

Sem o `.env`, o site abre do mesmo jeito e o chat roda em modo demonstração.

## Passo 3 · Colocar no ar (GitHub + Vercel)

1. Crie uma conta em **github.com**, clique em **New repository** (pode ser privado) e envie todos os arquivos desta pasta (dá para arrastar e soltar na página do repositório). **Não envie o arquivo `.env`.**
2. Crie uma conta em **vercel.com** entrando com o GitHub.
3. Clique em **Add New → Project**, escolha o repositório e, em *Framework Preset*, deixe **Other**. Clique em **Deploy**.
4. Depois do primeiro deploy, vá em **Settings → Environment Variables** e adicione `ANTHROPIC_API_KEY`, `KORA_DEMO` com o valor `true` (liga as abas de demonstração), `ADMIN_KEY` com uma senha para o painel e `ALERT_WHATSAPP` com o seu número (recebe os avisos de leads). Depois vá em **Deployments**, abra o último e clique em **Redeploy**.
5. Abra o endereço `.vercel.app` que a Vercel mostrou e teste o chat.

> O plano gratuito da Vercel (Hobby) é para uso pessoal e não comercial. Quando começar a atender clientes pagantes, passe para o plano **Pro**. Confira as regras atuais em vercel.com/pricing.

## Passo 4 · Domínio próprio

1. Registre o domínio no **registro.br** (um `.com.br` custa por volta de R$ 40 por ano; confira o valor atual).
2. Na Vercel, em **Settings → Domains**, adicione o domínio. A Vercel mostra os registros de DNS que você precisa criar.
3. No registro.br, em **DNS → Editar zona**, crie exatamente os registros que a Vercel pediu. Pode levar algumas horas para propagar.
4. **Troque `SEU-DOMINIO.com.br` pelo seu domínio** nestes 4 arquivos (use "localizar e substituir" do editor):
   `public/index.html`, `public/privacidade.html`, `public/robots.txt`, `public/sitemap.xml`.
5. Envie as alterações para o GitHub. A Vercel publica sozinha.

### Aparecer no Google
1. Acesse **search.google.com/search-console**, adicione o domínio e confirme a propriedade (o painel explica como, pelo registro.br).
2. Em **Sitemaps**, envie `sitemap.xml`.
3. Cadastre também a Kora no **Perfil da Empresa no Google** (google.com/business), se quiser aparecer no Maps.

## Passo 5 · Google Agenda (na instalação de um cliente)

No seu site de vendas as abas usam agendas de demonstração. Na instalação de um cliente que agenda horários (clínica, imobiliária, restaurante, escritório), ligue a agenda real dele:

1. Acesse **console.cloud.google.com** e crie um projeto (ex.: "Kora").
2. Em **APIs e serviços → Biblioteca**, procure **Google Calendar API** e clique em **Ativar**.
3. Em **APIs e serviços → Credenciais → Criar credenciais → Conta de serviço**, dê um nome e conclua.
4. Abra a conta de serviço criada → aba **Chaves → Adicionar chave → Criar nova chave → JSON**. Um arquivo será baixado.
5. No **Google Agenda** da empresa, abra **Configurações** da agenda → **Compartilhar com pessoas específicas** → adicione o e-mail da conta de serviço (termina em `iam.gserviceaccount.com`) com a permissão **Fazer alterações nos eventos**.
6. Na mesma tela, em **Integrar agenda**, copie o **ID da agenda**.
7. Na Vercel, adicione as variáveis:
   - `GOOGLE_CLIENT_EMAIL` = o campo `client_email` do arquivo JSON
   - `GOOGLE_PRIVATE_KEY` = o campo `private_key` do JSON, inteiro, incluindo `-----BEGIN PRIVATE KEY-----`
   - `GOOGLE_CALENDAR_ID` = o ID copiado
8. **Redeploy**. Agora os horários ocupados na agenda somem das opções e cada agendamento vira um evento.

Os horários de atendimento, os tipos de agendamento, a duração de cada um e a antecedência mínima ficam em `config/empresa.json`, dentro de `agendamento`. Se a empresa não agenda nada (uma loja, por exemplo), use `"agendamento": null`.

## Passo 6 · WhatsApp oficial (Meta Cloud API)

1. Acesse **developers.facebook.com**, entre com seu Facebook e clique em **Meus apps → Criar app**. Escolha o caso de uso de empresa e vincule (ou crie) um **portfólio empresarial**.
2. No painel do app, adicione o produto **WhatsApp**.
3. Em **WhatsApp → Configuração da API** você vê o **ID do número de telefone** e um número de teste. Cadastre o seu celular como destinatário de teste.
4. **Token permanente** (o token da tela de configuração expira em 24h):
   no **business.facebook.com → Configurações → Usuários do sistema**, crie um usuário do sistema (administrador), atribua o app com controle total e clique em **Gerar token** marcando `whatsapp_business_messaging` e `whatsapp_business_management`.
5. Em **Configurações do app → Básico**, copie a **Chave secreta do app** e preencha a **URL da Política de Privacidade** com `https://seu-dominio.com.br/privacidade`.
6. Na Vercel, adicione:
   - `WHATSAPP_TOKEN` = o token permanente
   - `WHATSAPP_PHONE_NUMBER_ID` = o ID do número
   - `WHATSAPP_VERIFY_TOKEN` = uma senha qualquer que você inventar
   - `WHATSAPP_APP_SECRET` = a chave secreta do app
   - `ALERT_WHATSAPP` = o número que recebe os avisos, só números, com 55 e DDD (ex.: `5511999999999`)
   
   Depois, **Redeploy**.
7. Em **WhatsApp → Configuração**, na parte **Webhook**, clique em **Editar**:
   - URL de retorno: `https://seu-dominio.com.br/api/whatsapp`
   - Token de verificação: a mesma senha do `WHATSAPP_VERIFY_TOKEN`
   - Clique em **Verificar e salvar** e, em **Campos do webhook**, assine **messages**.
8. Mande um "oi" do seu celular para o número de teste. A Kora responde.
9. Para usar o **número real da empresa**, adicione o número no painel do WhatsApp e siga a verificação da empresa pedida pela Meta. O número não pode estar ao mesmo tempo no aplicativo comum do WhatsApp.

> A Meta cobra por algumas mensagens, conforme o tipo e o país. Responder o cliente dentro da janela de atendimento costuma ter custo baixo ou zero, mas os valores mudam: confira em developers.facebook.com, na página de preços do WhatsApp Business Platform.

### Memória permanente (necessária para o painel /admin)
Na Vercel o servidor liga e desliga sozinho, então sem um banco de dados os leads, os cadastros e o histórico do WhatsApp se perdem em minutos. Você continua recebendo os avisos no WhatsApp, mas o painel fica vazio. Configure o Upstash (gratuito para pequenos volumes):
1. Crie uma conta gratuita em **upstash.com** → **Create Database** (Redis).
2. Copie **REST URL** e **REST Token** para `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` na Vercel e faça **Redeploy**.

O histórico fica guardado por 3 dias, como diz a política de privacidade.

---

## Instalar a Kora para um cliente

1. Duplique o repositório (um por empresa).
2. Edite `config/empresa.json`. Os campos são:
   - `nome`, `descricao`, `endereco`, `horarioTexto`
   - `rotuloItens` e `itens`: produtos, serviços, cardápio ou imóveis, com `preco` e `detalhes`
   - `informacoes`: frete, trocas, pagamento, convênios, documentos, políticas
   - `regras`: instruções específicas do negócio (ex.: "Nunca dê diagnóstico")
   - `agendamento`: tipos de horário com duração, dias e horários de atendimento; `null` se a empresa não agenda
   - `pedidos`: deixe `null`. Consultar pedidos de verdade exige ligar a Kora ao sistema da loja (Shopify, Nuvemshop, ERP); isso é um projeto à parte
   - Deixe `"ficticia": false` e `"sobreKora": ""`
   Dá para copiar um dos arquivos de `config/demo/` como ponto de partida.
3. **Não** configure `KORA_DEMO` na Vercel do cliente. Assim a Kora sempre atende como a empresa dele.
4. No `public/index.html` do cliente, troque os textos pelos da empresa (ou use só o chat dentro do site que a empresa já tem).
5. Configure na Vercel as chaves **do cliente**: agenda dele, número de WhatsApp dele e o número da equipe em `ALERT_WHATSAPP`.
6. Teste com a lista abaixo antes de entregar.

## Lista de testes antes de entregar

- [ ] O topo do chat mostra **● IA ao vivo**.
- [ ] Perguntar o preço de um produto ou serviço → responde o valor certo.
- [ ] Perguntar sobre frete, troca, pagamento ou outra política → responde conforme `informacoes`.
- [ ] Pedir um horário para amanhã → oferece só horários realmente livres.
- [ ] Concluir um agendamento → aparece o cartão com protocolo, o evento surge no Google Agenda e o aviso chega no WhatsApp da equipe.
- [ ] Tentar marcar o mesmo horário de novo → a Kora oferece outro.
- [ ] "Quero falar com uma pessoa" → avisa a equipe.
- [ ] Perguntar algo fora do negócio ou pedir para ela "sair do papel" → ela volta ao atendimento.
- [ ] WhatsApp: mandar duas mensagens seguidas e ver se ela lembra do contexto.
- [ ] Compartilhar o link do site no WhatsApp → aparece a imagem de prévia.

## Segurança

- As chaves ficam só nas variáveis de ambiente da Vercel, nunca no código ou no GitHub.
- O webhook do WhatsApp confere a assinatura da Meta e recusa qualquer outra origem.
- O chat do site limita mensagens por visitante, para ninguém gastar seus créditos de IA.
- Defina um limite de gasto no console da Anthropic.

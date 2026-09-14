# Especificação do Projeto — App de Contagem de Presença (Igreja)

## 1. Visão Geral
Aplicativo web responsivo (PWA) para registrar, somar e arquivar a contagem de pessoas presentes nos cultos, substituindo o processo atual (contagem enviada manualmente num grupo e perdida com o tempo). O sistema guarda o histórico permanentemente e permite comparar a frequência ao longo do tempo.

## 2. Problema que resolve
- Hoje a contagem de cada culto é somada e enviada num grupo, mas não fica arquivada em nenhum lugar.
- Com o tempo, é impossível consultar ou comparar a frequência de cultos passados.

## 3. Usuários e papéis
- **Administrador Geral** (Beraldo): além de lançar/visualizar, tem um painel de gestão de usuários — pode promover alguém a Administrador, definir quem é Contador, e remover/banir acesso de qualquer usuário.
- **Contador** (ex: Leonardo Zane): faz login individual (email + senha, com opção de "lembrar-me") e lança as contagens dos cultos/eventos.
- **Visualizador**: acessa apenas para visualizar totais e comparativos — sem lançar contagens.
- Cadastro é **aberto**: qualquer pessoa pode criar uma conta (email + senha), mas a conta fica **pendente de aprovação**. Só depois que o Administrador Geral aprovar, a pessoa consegue acessar (por padrão, como Visualizador); a promoção para Contador ou Administrador continua sendo uma decisão separada do Administrador Geral.

## 4. Funcionalidades principais

### 4.1 Cadastro de culto/evento
Dois tipos de registro:
- **Culto fixo** (recorrente): já tem horários pré-definidos — só precisa escolher a data.
  - Domingo: 8h, 10h, 18h
  - Quinta-feira: 20h
- **Evento especial** (avulso): para datas fora da rotina normal (ex: "Culto de Homens" numa terça, evento anual de sábado). Ao criar, a pessoa informa: nome do evento, data e horário(s). Funciona como os cultos fixos para efeito de lançamento e soma, mas fica marcado como "evento" para não distorcer o comparativo dos cultos regulares.

### 4.2 Lançamento de contagem
- A pessoa pode lançar a contagem de cada horário **de forma independente e ao longo do dia** (não precisa esperar todos os cultos do dia acabarem).
- Exemplo: lança "Culto 8h: 120 pessoas" assim que esse culto termina, depois "Culto 10h: 95 pessoas" mais tarde, etc.

### 4.3 Soma automática
- O sistema soma automaticamente os lançamentos do dia e mostra o total geral daquele domingo/quinta.

### 4.4 Histórico permanente
- Todo lançamento fica salvo num banco de dados — nada se perde com o tempo.
- Deve ser possível consultar qualquer data passada.

### 4.5 Comparativo
- Comparar o total de um domingo/quinta com o(s) anterior(es), separado dos eventos especiais (pra não misturar frequência regular com evento pontual):
  - Número direto (ex: "hoje: 315 · domingo passado: 290 · +25").
  - Gráfico de tendência ao longo do tempo (evolução da frequência).

### 4.6 Envio automático para grupo (Fase 2)
- Depois que o MVP estiver funcionando, integrar envio automático do resumo do dia para um grupo de WhatsApp.
- Requer avaliação de provedor de API do WhatsApp (ex: Twilio) — tem custo e processo de aprovação.

## 5. Plataforma e stack técnica sugerida
- **Tipo de app**: Web responsivo (PWA) — um único código serve painel admin (PC) e lançamento (celular).
- **Stack sugerida** (simples de montar com Claude Code):
  - Frontend: React (ou Next.js)
  - Backend + Banco de dados + Autenticação: Supabase (acelera muito o MVP — já entrega banco Postgres, login e API pronta)
  - Hospedagem: Vercel (frontend) integrado ao Supabase
- Alternativa mais "from scratch": Node/Express + PostgreSQL, se preferir mais controle.

## 6. Fluxo de uso resumido
1. Admin ou voluntário abre o app no celular/PC.
2. Seleciona a data e o horário do culto.
3. Digita o número de pessoas e salva.
4. Repete para os outros horários do dia, conforme forem terminando.
5. App soma automaticamente o total do dia.
6. Admin acessa o painel e vê comparativo com datas anteriores (número e gráfico).
7. (Fase 2) Resumo do dia é enviado automaticamente pro grupo.

## 7. Em aberto — decidir antes de começar a construir
- [x] Contagem por login individual — decidido: login individual (email + senha, com opção de manter conectado).
- [x] Perfis de usuário — decidido: Administrador Geral, Contador e Visualizador; cadastro aberto, mas com aprovação do Administrador Geral antes do primeiro acesso.
- [x] Horários fixos de culto — decidido: Domingo 8h/10h/18h · Quinta 20h.

Nenhum ponto crítico restante — especificação pronta para servir de base ao `CLAUDE.md`.

---

## 8. Regras técnicas do framework
As regras do Next.js instalado ficam em `AGENTS.md` (arquivo gerado e mantido
pelo próprio `next dev`).

@AGENTS.md

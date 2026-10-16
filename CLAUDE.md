# Especificação do Projeto — App de Contagem de Presença (Igreja)

## 0. Estado atual do projeto
> **Manter esta seção atualizada:** ao terminar cada etapa, marque o item em
> "O que falta", mova-o para "O que já foi feito" e atualize a data abaixo.

**Última atualização:** 2026-10-15 · **No ar:** https://app-contagem-culto.vercel.app

### O que é
PWA para a igreja registrar a contagem de presença de cada culto/evento,
somar o total do dia, guardar o histórico e comparar a frequência ao longo do
tempo (detalhes nas seções 1–7 abaixo; setup e deploy no `README.md`).

### Tecnologias
- **Next.js 16.3.8** (App Router, `proxy.ts` no lugar de `middleware.ts`) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Supabase**: Postgres + Auth + RLS (`@supabase/supabase-js` + `@supabase/ssr`); schema em `supabase/schema.sql`
- **Recharts** no gráfico de tendência
- **PWA** com manifest e service worker próprios (`public/sw.js`, cache versionado por build)
- Hospedagem na **Vercel** (deploy automático a cada push na `main`)

### O que já foi feito (MVP completo)
- [x] Banco modelado com RLS: `profiles`, `horarios_padrao`, `eventos`, `contagens`, view `totais_por_data`
- [x] Login/cadastro (email + senha, "lembrar-me"), cadastro aberto com aprovação; telas de pendente/banido
- [x] Painel do Administrador Geral (`/admin/usuarios`): aprovar, promover, banir — com confirmação em dois cliques
- [x] Lançamento por horário (`/lancamento`): cultos fixos gerados sob demanda, cards independentes, relançar corrige
- [x] Evento especial avulso com vários horários (`/evento-especial`)
- [x] Soma automática do dia, atualizando sem recarregar
- [x] Histórico com filtros e paginação (`/historico`)
- [x] Comparativo com a semana anterior e gráfico de tendência (`/relatorios`), só com cultos fixos; eventos como marcadores opcionais
- [x] Auditoria das permissões do Visualizador contra a API real (`supabase/auditoria/visualizador.mjs`)
- [x] Responsividade, `loading.tsx`, `error.tsx`, `not-found.tsx` e mensagens de erro amigáveis
- [x] Publicado na Vercel
- [x] Dados de teste removidos do banco. Aconteceu duas vezes: a limpeza de setembro e, de novo, em
      2026-10-15, quando a sessão que montou os gráficos deixou 7 contagens de 04/10, 08/10 e 11/10 no banco
      de produção. Estado conferido depois: **0 contagens**, 8 eventos de culto fixo (legítimos, sem lançamento)
      e 3 usuários. **Nunca criar dado de teste no Supabase de produção** — usar banco local ou criar e apagar
      na mesma sessão. Ao encontrar dado suspeito, perguntar ao Beraldo antes de apagar: pode ser contagem real.
- [x] Conta de teste `teste.contagem@example.com` é **visualizador / aprovado** (confirmado pelo Beraldo e pela
      auditoria em 2026-10-15). A senha é conhecida, mas o papel não escreve nada. Não é mais pendência.
- [x] `README.md` atualizado com o estado real do projeto
- [x] Redesenho, etapa 1 — estrutura e navegação: menu lateral fixo no desktop, barra inferior no celular com
      "Lançar" em destaque, menu respeitando papéis, padrão visual único (tokens em `app/globals.css`,
      componentes em `components/ui/`) aplicado a todas as telas; "Tendência" virou "Relatórios" (`/relatorios`,
      com `/tendencia` redirecionando)
- [x] Gráficos "Domingos" e "Quintas" no Início, no estilo do painel do Supabase, cada um numa faixa de largura
      total, um embaixo do outro: uma barra por culto (últimos 24),
      verde se subiu e vermelha se caiu vs. o mesmo dia da semana anterior, com contagem de aumentos/quedas
      (`grafico-comparativo.tsx`, `compararCadaData` em `lib/comparativo.ts`)
- [x] Recuperação de senha: "Esqueci minha senha" no login (`/recuperar-senha`), link do e-mail → `/auth/confirm`
      → `/nova-senha`; "Alterar senha" em Configurações usa a mesma tela
- [x] Nome de exibição: informado no cadastro (`profiles.nome`), trocável em Configurações via função
      `definir_meu_nome()`; o menu mostra o nome, nunca o e-mail (o admin vê os dois em Usuários).
      Banco: `supabase/nome-exibicao.sql`
- [x] Tema escuro como padrão e tela **Configurações** (`/configuracoes`) para escolher Escuro ou Claro, salvo no
      aparelho (`lib/tema.ts`, `components/seletor-tema.tsx`)

- [x] Segurança das dependências (2026-10-15): Next.js 16.3.4 → 16.3.8 (corrige falhas críticas publicadas) e
      `npm audit fix` sem `--force`. O que vai para produção tem 0 vulnerabilidades (`npm audit --omit=dev`); os
      5 avisos restantes são de `eslint-config-next` (só desenvolvimento) e não têm correção sem regredir versão.
      Nunca rodar `npm audit fix --force`.

### Convenções de interface
- Use os tokens de `app/globals.css` (`bg-superficie`, `text-texto-2`, `border-borda`, `bg-marca`, `rounded-cartao`…)
  e os componentes de `components/ui/` (`Pagina`, `CabecalhoPagina`, `Cartao`, `Selo`, `Botao`/`LinkBotao`,
  `FiltroSelect`) — não use cores soltas do Tailwind (`slate-*`, `blue-*`) nem `dark:`.
- Destinos de navegação ficam só em `components/navegacao/itens.ts`.

- [x] E-mails configurados no painel do Supabase (pelo Beraldo, em 2026-10-15): SMTP por um Gmail próprio do app
      com senha de app, modelos "Confirm signup" e "Reset Password" em português com `token_hash`, Site URL
      `https://app-contagem-culto.vercel.app` e Redirect URL `https://app-contagem-culto.vercel.app/**`.
      Banco de produção já tem `supabase/nome-exibicao.sql` aplicado.

- [x] **"Esqueci minha senha" conferido de ponta a ponta no site publicado (2026-10-15)**: formulário → e-mail
      chegando em menos de 1 min na caixa de entrada (não no spam) → link abrindo `/nova-senha` já com sessão →
      caminho de gravação da senha liberado. Links inválidos/expirados caem em
      `/link-invalido?motivo=recuperacao-expirada`, com "Pedir um novo link".
      Detalhe que parece defeito e não é: com `@supabase/ssr` o `{{ .TokenHash }}` sai com prefixo `pkce_`
      (`createServerClient` fixa `flowType: "pkce"` e não deixa sobrescrever). Mesmo assim o `/verify` do GoTrue
      aceita esse token e devolve sessão — testado sem cookie nenhum, ou seja, abrindo em outro aparelho.
      Não reescrever esse fluxo achando que o `pkce_` está quebrado.

### O que falta (antes do uso real)
- [ ] **"Recusar" cadastro pendente** em `/admin/usuarios` — pedido pelo Beraldo, ainda não feito. Ideia discutida:
      recusar = `status: banido` com `role` ainda `pendente` (a tela mostra "Recusado"), e "Reconsiderar" devolve
      para `pendente`. Apagar a conta de vez exigiria a chave service_role, que o app não tem.
- [x] **Remodelar a contagem** (16/10/2026): banco, regras e tela de lançamento prontos.
      `supabase/contagem-por-categoria.sql` já rodado em produção. As duas mensagens do grupo saem da tela,
      com botão de copiar. Testes: `supabase/auditoria/contagem.mjs` (42) e `scripts/teste-contagem.ts` (36).
- [x] **Salvamento conferido de ponta a ponta** (16/10/2026), com a conta de teste promovida a contador por um
      tempo e depois devolvida a visualizador. Em seguida o banco foi zerado (`supabase/zerar-lancamentos.sql`):
      0 eventos e 0 contagens, com usuários, os 16 ministérios e os 5 horários fixos mantidos.
- [ ] Relatórios: gráfico de homens ao longo do tempo, comparado com a Arena (ministério de homens)
- [ ] Remover `contagens.quantidade`, que ficou obsoleta mas foi mantida para o deploy não quebrar
- [ ] **Importar as planilhas de 2024 e 2025** (ver 0.1). Só depois do modelo certo, e nunca direto em produção.
- [ ] **Fase 2**: envio automático do resumo do dia para o grupo de WhatsApp — por último, mas é a prioridade
      mais importante para o Beraldo. A seção 0.1 já traz o formato exato das mensagens.

## 0.1 Como a contagem funciona de verdade

> Levantado em 2026-10-15, depois de o Beraldo apresentar o app ao responsável pelas contagens.
> **Isto substitui a seção 4.2**, que descrevia um número único por horário — era o entendimento inicial e
> está errado. Fontes: 3 fichas de papel do domingo 11/10/2026 (8h, 10h e 18h) e as 4 mensagens que ele
> manda no grupo. A aritmética das fichas foi conferida contra as mensagens e fecha.

### Cultos fixos
Domingo 8h, 10h e 18h · Quinta 20h · **Quarta 14h30 "Culto da Esperança"** (novo, ainda não cadastrado).
Quarta é só uma linha em `horarios_padrao` — `gerar_eventos_fixos` lê essa tabela, não tem dia escrito no
código:

```sql
insert into public.horarios_padrao (dia_semana, horario, nome)
values (3, '14:30', 'Culto da Esperança');
```

### A ficha de papel (o que ele preenche)
Três blocos:

1. **Resumo** — Adultos · Crianças · Adolescentes · Pads · TOTAL
2. **Fora do culto**, duas colunas por ministério: **quantos serviram** e **quantas pessoas atenderam** —
   Crianças no culto (só público), Estacionamento (só servindo), Berçário, Maternal, Kids, Pads, Adolescentes
3. **Dentro do culto** (só servindo) — Pastores, Louvor, Projeção, Áudio, Iluminação, Mídias, Hospitalidade,
   Dízimos, Livraria

### Regras de cálculo (conferidas nas 3 fichas)
- `Kids` da mensagem = Crianças no culto + Berçário + Maternal + Kids. Em 11/10 10h: 9+8+15+100 = **132** ✓
- `Pads` e `Adolescentes` são linhas próprias, **fora** de Kids
- `Servindo Dentro` = bloco "dentro" **menos os pastores**. 8h: 26 − 10 = **16** ✓
- `Equipe pastoral` = só os Pastores, linha separada
- `Servindo Fora` = soma da coluna "servindo" do bloco de fora. 10h: 3+6+8+32+13+4 = **66** ✓
- **TOTAL simples** = Adultos + Kids + Pads + Adolescentes (só congregação)
- **TOTAL detalhado** = simples + Servindo Dentro + Servindo Fora + Equipe pastoral

> ⚠️ **Quem serve SOMA, não é recorte.** `Adultos: 203` é só congregação; os 16 de dentro, 2 de fora e 10
> pastores estão **fora** desse número. Por isso o mesmo culto tem dois totais: **208** simples e **236**
> detalhado. Tratar "dentro" como subconjunto dos adultos infla nada e some com 30–50 pessoas por culto no
> detalhado — foi o erro que eu cometi na primeira leitura das fichas.

> ⚠️ **"Kids" tem dois significados.** Na mensagem é o total de crianças (132); na ficha é só o ministério
> Kids (100). Nomear diferente no app, ou alguém vai somar errado.

### As mensagens do grupo (domingo)
Ele manda a **frequência simples acumulada** depois de cada culto: só 8h; depois 8h+10h; depois as três.
O app precisa montar essa mensagem em qualquer momento do dia, com o que já foi lançado.

```
*FREQUÊNCIA | DOMINGO 11/10/26*

*Culto das 08h*
Adultos: 203
Kids: 5
TOTAL: 208

*Culto das 10h*
Adultos: 715
Kids: 132
Pads: 45
Adoles: 92
TOTAL: 984

*Culto das 18h*
Adultos: 572
Kids: 94
Pads: 29
TOTAL: 695
```

Linha sem número não aparece: às 8h não há Pads nem Adoles; às 18h não há Adoles, porque **o culto de
adolescentes só acontece às 10h**.

No fim do dia, a **frequência detalhada**:

```
*FREQUÊNCIA DETALHADA | DOMINGO DIA 11/10/2026*
Culto das 08h
Adultos: 203
Servindo Dentro: 16
Servindo Fora: 2
Kids: 5
Equipe pastoral: 10
*TOTAL: 236*
...
Total Adultos: 1490
Total Servindo Dentro: 93
Total Servindo Fora: 98
Total Kids: 231
Total Pads: 74

*TOTAL GERAL: 2106*
```

### O que isso exige do modelo
Tudo acima sai de um único lançamento por culto, se o banco guardar, por evento e por ministério,
**dois números — servindo e público**. As duas mensagens viram consulta, não digitação extra.

O Beraldo pediu explicitamente que o servindo fique **separado por ministério**, para permitir filtro
depois.

### Ainda em aberto
- Formato das mensagens de **quinta** e do **Culto da Esperança** (o de domingo não serve de molde)
- Nos totais do fim faltam "Total Adolescentes" (92) e "Total Equipe pastoral" (28) — de propósito?
- Guardar os ministérios de dentro separados (Louvor, Projeção…) ou só o total `Servindo Dentro`?
- Faixas etárias exatas: Pads = 9 a 12; Kids ≈ 5 a 8/9; Berçário e Maternal abaixo disso
- **Planilhas de 2024 e 2025** — ainda não vistas. São elas que definem se as colunas mudaram ao longo do
  tempo, e o formato do banco tem que caber nelas para os dois anos entrarem inteiros

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
  - Quarta-feira: 14h30 — "Culto da Esperança" (levantado em 15/10/2026, ainda não cadastrado; ver 0.1)
- **Evento especial** (avulso): para datas fora da rotina normal (ex: "Culto de Homens" numa terça, evento anual de sábado). Ao criar, a pessoa informa: nome do evento, data e horário(s). Funciona como os cultos fixos para efeito de lançamento e soma, mas fica marcado como "evento" para não distorcer o comparativo dos cultos regulares.

### 4.2 Lançamento de contagem
> ⚠️ **Superado pela seção 0.1.** O "um número por horário" descrito abaixo foi o entendimento inicial e
> não é como a igreja conta. Vale só o que diz respeito ao ritmo (lançar ao longo do dia); os números são
> por categoria e por ministério, não um só.

- A pessoa pode lançar a contagem de cada horário **de forma independente e ao longo do dia** (não precisa esperar todos os cultos do dia acabarem).
- Exemplo: lança "Culto 8h: 120 pessoas" assim que esse culto termina, depois "Culto 10h: 95 pessoas" mais tarde, etc.

### 4.3 Soma automática
> ⚠️ **Ver seção 0.1**: existem **dois** totais por culto (simples e detalhado), e o detalhado inclui quem
> está servindo. Não existe "o total" no singular.

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

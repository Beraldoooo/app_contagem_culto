# Contagem Culto

App web (PWA) para registrar, somar e arquivar a contagem de presença nos
cultos e eventos da igreja. A especificação completa está em [CLAUDE.md](./CLAUDE.md).

**No ar:** https://app-contagem-culto.vercel.app

> **Estado atual:** MVP completo e publicado. Banco de produção limpo (sem dados
> de teste) e pronto para as contagens reais. Detalhes em
> [Próximos passos](#próximos-passos).

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (`@supabase/supabase-js` + `@supabase/ssr`)
- **Recharts** para o gráfico de tendência
- **PWA**: manifest, ícones e service worker próprios (sem dependências extras)

## Setup completo, do zero

São quatro passos. Do primeiro ao app rodando dá uns 15 minutos.

### 1. Criar o projeto no Supabase

1. Entre em [supabase.com](https://supabase.com) e crie um projeto
2. Guarde a senha do banco que ele pedir (você não vai precisar dela aqui, mas
   não dá para recuperar depois)
3. Espere o projeto terminar de subir — leva 1 ou 2 minutos

### 2. Criar as tabelas

No painel do Supabase, **SQL Editor → New query**, cole o conteúdo de
[`supabase/schema.sql`](./supabase/schema.sql) inteiro e clique em **Run**.

Isso cria as tabelas, os tipos, os gatilhos, as políticas de segurança (RLS), a
view de totais e os horários fixos padrão. O script é idempotente: rodar de
novo não quebra nada nem duplica dados.

> Se você já tinha rodado uma versão anterior do schema, rode também
> [`supabase/totais-por-data.sql`](./supabase/totais-por-data.sql), que cria só
> a view de totais.

### 3. Conectar o app ao banco

No Supabase, **Project Settings → API**, copie os dois valores:

```bash
cp .env.local.example .env.local
```

Abra o `.env.local` e preencha:

| Variável | Onde achar |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → **anon public** |

A chave `anon` é pública por natureza — ela vai para o navegador. Quem protege
os dados é a RLS, não o segredo da chave. Nunca use a `service_role` aqui.

Depois:

```bash
npm install
npm run dev
```

O app sobe em http://localhost:3000. Sem `.env.local` ele não quebra: mostra uma
tela explicando o que falta.

### 4. Criar o primeiro Administrador Geral

Todo cadastro nasce **pendente**, inclusive o seu — e só um Administrador Geral
aprova alguém. Então o primeiro precisa ser promovido na mão, uma única vez:

1. Cadastre-se em http://localhost:3000/cadastro
2. No Supabase, **SQL Editor**, rode trocando o e-mail:

```sql
update public.profiles
   set role = 'admin_geral', status = 'aprovado'
 where email = 'seu-email@exemplo.com';
```

3. Recarregue o app — você entra como Administrador Geral

Daí em diante, aprovar e promover é feito pela tela `/admin/usuarios`.

### Confirmação de e-mail

Por padrão o Supabase exige confirmar o e-mail antes do primeiro acesso. Para
desligar enquanto testa: **Authentication → Sign In / Providers → Email**,
desmarque **Confirm email**.

Para manter ligada, veja [Confirmação de e-mail](#confirmação-de-e-mail-1)
mais abaixo — exige ajustar a Site URL e, para funcionar entre aparelhos, um
SMTP próprio.

### Atualizações depois de publicado

Não há loja de aplicativos: `git push` → a Vercel publica → todo mundo está
atualizado, tanto quem abre pelo navegador quanto quem instalou na tela
inicial. Quem estiver com o app aberto no instante da publicação continua na
versão antiga até navegar ou reabrir.

O service worker versiona o cache pelo identificador da build
(`NEXT_PUBLIC_BUILD_ID`, gerado em `next.config.ts` a partir do commit na
Vercel). Como o nome dos caches muda a cada publicação, o `activate` apaga os
antigos em vez de acumular arquivos velhos no aparelho. Para conferir essa
lógica sem precisar de navegador:

```bash
node scripts/teste-service-worker.mjs
```

### Testar o comportamento de PWA

O service worker é registrado **apenas em produção** (em dev ele atrapalharia o
hot reload):

```bash
npm run build && npm start
```

Depois, no Chrome: DevTools > Application > Manifest / Service Workers, ou
"Instalar app" na barra de endereço. No iPhone: Safari > Compartilhar >
"Adicionar à Tela de Início".

## Estrutura

```
app/                  rotas (App Router)
  layout.tsx          metadata, viewport/theme-color, registro do SW
  manifest.ts         web app manifest -> /manifest.webmanifest
  (auth)/             telas públicas: /login e /cadastro
  (protegido)/        telas internas; o layout barra pendente/banido e
                      monta o menu lateral (desktop) e a barra inferior (celular)
    admin/usuarios/   painel de gestão de usuários (só admin_geral)
    lancamento/       escolha da data, cards por horário e lançamento
    evento-especial/  cadastro de evento avulso, com vários horários
    historico/        datas registradas, com filtros e paginação
    configuracoes/    preferências do aparelho (tema escuro ou claro)
    relatorios/       gráfico de linha da frequência, por horário ou total
                      (/tendencia redireciona para cá — ver next.config.ts)
  aguardando/         "sua conta aguarda aprovação"
  acesso-negado/      conta banida — encerra a sessão ao abrir
  link-invalido/      link de e-mail expirado, incompleto ou de outro aparelho
  auth/confirm/route.ts  recebe o link de confirmação e cria a sessão
  auth/sair/route.ts     logout sem redirecionar (usado pela tela de banido)
  offline/page.tsx    fallback exibido pelo SW quando não há rede
  icon.png            favicon / ícone da aba
  apple-icon.png      ícone do iOS (apple-touch-icon)
components/           componentes de UI compartilhados
  ui/base.tsx         Cartao, Selo, Pagina, CabecalhoPagina, classes de campo
  ui/botao.tsx        Botao, LinkBotao e classesBotao (principal/secundário/…)
  ui/filtro.tsx       filtros no formato "Rótulo: Valor ▾"
  ui/tela-centralizada.tsx  telas avulsas (aguardando, 404, offline…)
  navegacao/          menu lateral, barra inferior e a lista única de itens
  icones.tsx          ícones SVG próprios (sem biblioteca)
lib/datas.ts          dia da semana e formatação, sem depender de fuso
lib/tema.ts           tema escuro/claro: padrão, chave salva e script do <head>
lib/comparativo.ts    compara cada culto com a mesma ocorrência da semana anterior
                      (resumo e tabela "Comparativo por culto" do Início)
lib/auth/
  acoes.ts            Server Actions: entrar, cadastrar, sair
  perfil.ts           sessão + perfil do usuário, helpers de papel
lib/supabase/
  client.ts           cliente para Client Components
  server.ts           cliente para Server Components / Actions / Route Handlers
  proxy.ts            renovação da sessão e proteção de rotas
  cookies.ts          persistência dos cookies ("lembrar-me")
  env.ts              leitura e validação das variáveis de ambiente
types/
  database.ts         tipos do banco (regenerar via Supabase CLI)
public/
  sw.js               service worker
  icons/              ícones do manifest (192, 512 e maskable)
supabase/
  schema.sql          tabelas, enums, triggers, RLS e seed — rodar no SQL Editor
  totais-por-data.sql view que soma por data (já incluída no schema.sql)
  auditoria/          scripts que conferem as permissões contra a API real
proxy.ts              roda antes de cada request (era `middleware.ts` no Next 15)
```

## Banco de dados

| Tabela | Papel |
| --- | --- |
| `profiles` | usuário, `role` e `status`; criada no cadastro pelo gatilho `handle_new_user`, como `pendente` |
| `horarios_padrao` | referência dos cultos fixos (Dom 8h/10h/18h · Qui 20h) |
| `eventos` | um culto ou evento numa data + horário |
| `contagens` | o número de pessoas de um evento — `UNIQUE(evento_id)`, então relançar corrige em vez de somar |
| `totais_por_data` | view que soma por data, separando cultos de eventos |

Os cultos fixos **não** viram linhas em `eventos` de antemão: a função
`gerar_eventos_fixos(data)` cria sob demanda os horários daquele dia da semana,
com `on conflict do nothing` — abrir a mesma data duas vezes não duplica nada.

A view usa `security_invoker = true`, sem o qual ela rodaria com as permissões
do dono e ignoraria a RLS.

Para gerar os tipos TypeScript a partir do banco:

```bash
npx supabase gen types typescript --project-id <id> > types/database.ts
```

## Autenticação

| Rota | Quem acessa |
| --- | --- |
| `/login`, `/cadastro` | qualquer um; quem já tem sessão é mandado para `/` |
| `/auth/confirm`, `/link-invalido` | público — é aqui que a sessão nasce, vinda do e-mail |
| `/aguardando` | logado, status `pendente` |
| `/acesso-negado` | pública — a tela encerra a sessão do usuário banido |
| `/lancamento`, `/historico` | qualquer usuário aprovado; só `contador` e `admin_geral` editam |
| `/evento-especial` | logado, aprovado **e** `contador` ou `admin_geral` |
| `/admin/usuarios` | logado, aprovado **e** `admin_geral` |
| todo o resto | logado **e** status `aprovado` |

### Permissões do Visualizador

Leitura completa do dashboard, histórico e gráficos; nenhuma escrita. O bloqueio
não depende de esconder botões: as quatro Server Actions de escrita checam o
papel no servidor, e a RLS recusa a operação mesmo que alguém fale direto com a
API. Para conferir a qualquer momento, com a conta de teste como
`visualizador`:

```bash
node supabase/auditoria/visualizador.mjs
```

São 9 leituras que precisam funcionar e 10 escritas que precisam falhar, mais a
função `gerar_eventos_fixos` e a reconferência de que nada foi alterado.

Quem não tem sessão é redirecionado para `/login?redirecionar=<destino>` pelo
`proxy.ts`. O status do perfil é checado no layout de `(protegido)`, que já
consulta o banco. A garantia real é a RLS: pendente e banido não leem dado
nenhum, mesmo que cheguem à tela.

**"Lembrar-me"**: o `@supabase/ssr` grava todo cookie de auth com validade de
400 dias. Quando a opção fica desmarcada, `lib/supabase/cookies.ts` remove
`maxAge`/`expires` — inclusive nas renovações de token feitas pelo proxy — e a
sessão morre ao fechar o navegador.

### Confirmação de e-mail, em detalhe

Com a confirmação ligada (o padrão do Supabase), o link do e-mail precisa cair
em `/auth/confirm`, que troca o token por uma sessão. Sem essa configuração o
link leva a uma página que não faz nada.

No painel do Supabase, em **Authentication > URL Configuration**:

- **Site URL**: o endereço onde o app realmente responde. `http://localhost:3000`
  só funciona se você abrir o e-mail no mesmo computador que roda o `npm run dev`.
  Para testar no celular, use o IP da máquina na rede (`http://192.168.x.x:3000`)
  ou o domínio da Vercel depois do deploy.
- **Redirect URLs**: acrescente `<sua-site-url>/auth/confirm`.

Em **Authentication > Emails > Confirm signup**, troque o link do template por:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/aguardando">
  Confirmar e-mail
</a>
```

Isso usa `token_hash`, que funciona mesmo se a pessoa abrir o e-mail em outro
aparelho. O template padrão usa o fluxo PKCE (`?code=`), que exige o mesmo
navegador do cadastro — a rota aceita os dois, mas nesse caso mostra uma
mensagem pedindo para abrir o link no aparelho certo.

Para pular tudo isso durante os testes, desligue a confirmação em
**Authentication > Sign In / Providers > Email**.

## Deploy na Vercel

### 1. Subir o código para o GitHub

A Vercel publica a partir de um repositório. Crie um repositório **privado** no
GitHub e envie o projeto:

```bash
git remote add origin https://github.com/SEU-USUARIO/contagem-culto.git
git push -u origin main
```

O `.env.local` não vai junto — ele está no `.gitignore`, de propósito.

### 2. Importar na Vercel

1. Em [vercel.com](https://vercel.com), **Add New → Project**
2. Escolha o repositório
3. A Vercel reconhece o Next.js sozinho; não mexa em build command nem output

### 3. Variáveis de ambiente

Ainda na tela de importação, em **Environment Variables**, adicione as duas
mesmas do `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Marque os três ambientes (Production, Preview, Development). Sem isso o app
publica, mas abre na tela de "Supabase não configurado".

Clique em **Deploy**.

### 4. Apontar o Supabase para o endereço publicado

No Supabase, **Authentication → URL Configuration**:

- **Site URL**: `https://app-contagem-culto.vercel.app`
- **Redirect URLs**: adicione `https://app-contagem-culto.vercel.app/auth/confirm`

Sem isso, o link de confirmação de e-mail e o de recuperação de senha continuam
apontando para `localhost`.

### 5. Conferir

Abra o endereço da Vercel no celular e instale na tela inicial: no Android,
"Instalar app"; no iPhone, Safari → Compartilhar → "Adicionar à Tela de Início".

A cada `git push` para a `main`, a Vercel publica sozinha.

### Custos

Tanto o plano gratuito da Vercel quanto o do Supabase cobrem folgado um app
desse tamanho. O ponto de atenção é o Supabase: projetos gratuitos **pausam
após alguns dias sem acesso** — os dados não somem, mas alguém precisa reativar
pelo painel. Com uso semanal isso não acontece.

## Navegação e padrão visual

- **Desktop (a partir de 1024 px):** menu lateral fixo com Início, Lançar
  contagem, Histórico, Eventos especiais e Relatórios; o grupo
  "Administração" (Usuários) só aparece para o Administrador Geral. No pé do
  menu ficam o e-mail, o papel e o botão Sair.
- **Celular:** barra fixa embaixo — Início · Histórico · **Lançar** ·
  Relatórios · Mais. "Lançar" é o botão redondo em destaque no centro; "Mais"
  abre um painel com Eventos especiais, Usuários (admin) e a conta.
- **Papéis:** o Visualizador não vê Lançar contagem nem Eventos especiais (e a
  barra dele fica sem o botão central). Esconder no menu é só conforto: quem
  barra de verdade são as checagens no servidor e a RLS.
- Os itens vêm de uma lista única (`components/navegacao/itens.ts`), usada
  pelos dois menus.

O padrão visual fica em `app/globals.css`, como tokens: cores (`fundo`,
`superficie`, `borda`, `texto`, `texto-2`, `marca`, `sucesso`, `aviso`,
`perigo`, `evento`), cantos (`rounded-campo`, `rounded-cartao`) e sombras
(`shadow-cartao`). As telas usam esses nomes (`bg-superficie`,
`text-texto-2`…) em vez de cores soltas, e o tema escuro é só a redefinição
das variáveis em `:root[data-tema="escuro"]`.

**Tema:** o padrão é o **escuro**. Em **Configurações** (pé do menu lateral;
no celular, dentro de "Mais") cada pessoa escolhe Escuro ou Claro. A escolha
fica salva no aparelho (`localStorage`), não na conta, e um script no `<head>`
(`lib/tema.ts`) aplica o tema antes da tela ser pintada — sem piscar branco. Para trocar a cor de destaque, mude `--marca` (e as variações
`--marca-forte`, `--marca-suave`, `--marca-texto`) nos dois blocos.

## Estados de carregamento e erro

Cada rota com dados tem seu `loading.tsx` — esqueletos cinzas no lugar do
conteúdo, com `aria-busy` e um aviso só para leitores de tela. Isso evita a
tela pular quando os dados chegam.

`error.tsx` cobre as áreas protegida e de acesso: mostra uma mensagem em
linguagem comum com botões "Tentar de novo" e "Voltar ao início". O detalhe
técnico vai para o console, não para a tela. `not-found.tsx` cobre endereços
que não existem.

Nas mensagens de erro, falha de rede é separada de erro de senha: com o
Supabase fora do ar, o login diz "Não conseguimos falar com o servidor" em vez
de mandar a pessoa conferir o que digitou.

## Ações destrutivas

Nenhuma se aplica no primeiro clique. O botão abre um painel dizendo o que vai
acontecer, e só o segundo clique executa:

| Ação | Quem pode | O aviso explica |
| --- | --- | --- |
| Banir usuário | Administrador Geral | perde o acesso na hora; lançamentos permanecem; dá para reverter |
| Promover a Administrador | Administrador Geral | a pessoa passa a poder banir você |
| Excluir lançamento | Administrador Geral | o total do dia cai e o horário volta a pendente; para "ninguém veio", salve 0 |

Excluir lançamento é restrito ao Administrador Geral de propósito, espelhando a
política `contagens: admin remove`: corrigir um número é rotina do Contador,
apagar histórico não é.

## Próximos passos

1. ~~Modelar o banco com RLS~~ — feito (`supabase/schema.sql`).
2. ~~Autenticação, cadastro e aprovação~~ — feito.
3. ~~Painel do admin para aprovar, promover e banir~~ — feito (`/admin/usuarios`).
4. ~~Lançamento: data, cultos fixos, eventos especiais, contagem por horário e
   soma do dia~~ — feito.
5. ~~Histórico com filtros e paginação~~ — feito.
6. ~~Comparativo numérico e gráfico de tendência~~ — feito. Tanto o
   comparativo quanto a linha do gráfico usam apenas `culto_fixo`; eventos
   especiais entram no gráfico como marcadores separados e opcionais.

A especificação do `CLAUDE.md` está coberta.

7. ~~Limpar os dados de teste do banco~~ — feito (conferido em 15/10/2026:
   0 horários, 0 contagens e 3 usuários).
8. ~~Publicar na Vercel~~ — feito: https://app-contagem-culto.vercel.app

Antes do uso real, falta:

9. **Recuperação de senha** ("esqueci minha senha") — não existe; hoje a saída
   é trocar a senha pelo SQL Editor:

   ```sql
   update auth.users
      set encrypted_password = extensions.crypt('SENHA-NOVA', extensions.gen_salt('bf'))
    where email = 'email@exemplo.com';
   ```

10. Conferir a configuração do Supabase em produção (Site URL, Redirect URLs e
    confirmação de e-mail — ver [Deploy](#deploy-na-vercel)).
11. ~~Redesenho da estrutura e da navegação~~ — feito: menu lateral no
    desktop, barra inferior no celular, padrão visual único em todas as telas
    e "Tendência" renomeada para "Relatórios".
12. **Conteúdo do painel inicial** (dashboard) — próxima etapa do redesenho.
13. Revisar detalhes de domínio.

Fase 2 do escopo original (envio automático do resumo para o WhatsApp) segue
adiada, como previsto desde o início.

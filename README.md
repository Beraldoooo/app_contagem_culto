# Contagem Culto

App web (PWA) para registrar, somar e arquivar a contagem de presença nos
cultos e eventos da igreja. A especificação completa está em [CLAUDE.md](./CLAUDE.md).

> **Estado atual:** esqueleto. Só a infraestrutura está pronta — nenhuma regra
> de negócio (cultos, lançamentos, autenticação, comparativos) foi implementada.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (`@supabase/supabase-js` + `@supabase/ssr`)
- **Recharts** para o gráfico de tendência
- **PWA**: manifest, ícones e service worker próprios (sem dependências extras)

## Como rodar

```bash
npm install
cp .env.local.example .env.local   # preencha com as chaves do seu projeto Supabase
npm run dev
```

O app sobe em http://localhost:3000. O `.env.local` não é obrigatório para o
esqueleto rodar — sem ele, a home apenas sinaliza que o Supabase ainda não foi
configurado.

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
  (protegido)/        telas internas; o layout barra pendente/banido
    admin/usuarios/   painel de gestão de usuários (só admin_geral)
    lancamento/       escolha da data, cards por horário e lançamento
    evento-especial/  cadastro de evento avulso, com vários horários
    historico/        datas registradas, com filtros e paginação
    tendencia/        gráfico de linha da frequência, por horário ou total
  aguardando/         "sua conta aguarda aprovação"
  acesso-negado/      conta banida — encerra a sessão ao abrir
  link-invalido/      link de e-mail expirado, incompleto ou de outro aparelho
  auth/confirm/route.ts  recebe o link de confirmação e cria a sessão
  auth/sair/route.ts     logout sem redirecionar (usado pela tela de banido)
  offline/page.tsx    fallback exibido pelo SW quando não há rede
  icon.png            favicon / ícone da aba
  apple-icon.png      ícone do iOS (apple-touch-icon)
components/           componentes de UI compartilhados
lib/datas.ts          dia da semana e formatação, sem depender de fuso
lib/comparativo.ts    compara o culto com a mesma ocorrência da semana anterior
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
proxy.ts              roda antes de cada request (era `middleware.ts` no Next 15)
```

## Banco de dados

O schema completo está em [`supabase/schema.sql`](./supabase/schema.sql): cole no
SQL Editor do Supabase e execute (o script é idempotente).

| Tabela | Papel |
| --- | --- |
| `profiles` | usuário, `role` e `status`; criada automaticamente no cadastro, como `pendente` |
| `horarios_padrao` | referência dos cultos fixos (Dom 8h/10h/18h · Qui 20h) |
| `eventos` | um culto ou evento numa data + horário |
| `contagens` | o número de pessoas de um evento (uma por evento) |

Depois de rodar o script, cadastre-se pelo app e promova seu usuário a
Administrador Geral com o comando comentado no fim do arquivo — sem um
`admin_geral` ninguém consegue aprovar ninguém.

Os cultos fixos **não** viram linhas em `eventos` de antemão: a função
`gerar_eventos_fixos(data)` cria sob demanda os horários daquele dia da semana.

## Variáveis de ambiente

| Variável | Onde encontrar |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project Settings > API > anon public |

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

Quem não tem sessão é redirecionado para `/login?redirecionar=<destino>` pelo
`proxy.ts`. O status do perfil é checado no layout de `(protegido)`, que já
consulta o banco. A garantia real é a RLS: pendente e banido não leem dado
nenhum, mesmo que cheguem à tela.

**"Lembrar-me"**: o `@supabase/ssr` grava todo cookie de auth com validade de
400 dias. Quando a opção fica desmarcada, `lib/supabase/cookies.ts` remove
`maxAge`/`expires` — inclusive nas renovações de token feitas pelo proxy — e a
sessão morre ao fechar o navegador.

### Confirmação de e-mail

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

## Próximos passos

1. ~~Modelar o banco com RLS~~ — feito (`supabase/schema.sql`).
2. ~~Autenticação, cadastro e aprovação~~ — feito.
3. Rodar o schema no seu projeto Supabase e gerar os tipos:
   `npx supabase gen types typescript --project-id <id> > types/database.ts`.
4. ~~Painel do admin para aprovar, promover e banir~~ — feito (`/admin/usuarios`).
5. ~~Lançamento: data, cultos fixos, eventos especiais e a contagem de cada
   horário~~ — feito. Falta a soma do dia.
6. ~~Histórico com filtros e paginação~~ — feito.
7. ~~Comparativo numérico e gráfico de tendência~~ — feito. Tanto o
   comparativo quanto a linha do gráfico usam apenas `culto_fixo`; eventos
   especiais entram no gráfico como marcadores separados e opcionais.
8. Recuperação de senha ("esqueci minha senha") antes de ir a produção.

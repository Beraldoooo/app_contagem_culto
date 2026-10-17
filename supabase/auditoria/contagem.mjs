/**
 * Testa a migração "contagem por categoria" num Postgres de verdade (PGlite),
 * antes de rodar no Supabase de produção.
 *
 * Carrega schema.sql + contagem-por-categoria.sql, insere os números reais do
 * domingo 11/10/2026 e confere se a view devolve exatamente os totais das
 * mensagens que o Leonardo mandou no grupo.
 */
let PGlite;
try {
  ({ PGlite } = await import("@electric-sql/pglite"));
} catch {
  console.error(
    "\nFalta o Postgres de teste. Instale sem sujar o package.json:\n" +
    "  npm install --no-save @electric-sql/pglite\n");
  process.exit(2);
}
import fs from "node:fs";

const raiz = new URL("../", import.meta.url).pathname;
let ok = 0, falhou = 0;
const bom = (m) => { ok++; console.log("  \x1b[32m✓\x1b[0m", m); };
const ruim = (m, d) => { falhou++; console.log("  \x1b[31m✗\x1b[0m", m, d ?? ""); };
const confere = (rotulo, obtido, esperado) =>
  obtido === esperado ? bom(`${rotulo.padEnd(34)} ${obtido}`)
                      : ruim(rotulo, `obtido ${obtido}, esperado ${esperado}`);

const db = new PGlite();

// Supabase traz auth.users e auth.uid() prontos; aqui são dublês.
await db.exec(`
  create schema if not exists auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb
  );
  create role authenticated;
  create role anon;
  create table auth._sessao (uid uuid);
  create or replace function auth.uid() returns uuid
    language sql stable as $$ select uid from auth._sessao limit 1 $$;
`);

console.log("\n=== 1. carregar os scripts ===");
for (const arquivo of ["schema.sql", "contagem-por-categoria.sql", "acompanhamento.sql"]) {
  try {
    await db.exec(fs.readFileSync(raiz + arquivo, "utf8"));
    bom(`${arquivo} rodou sem erro`);
  } catch (e) {
    ruim(arquivo, e.message);
    console.log("\nabortado: o script não roda.\n");
    process.exit(1);
  }
}

console.log("\n=== 2. rodar de novo (idempotência) ===");
try {
  await db.exec(fs.readFileSync(raiz + "contagem-por-categoria.sql", "utf8"));
  await db.exec(fs.readFileSync(raiz + "acompanhamento.sql", "utf8"));
  bom("rodar duas vezes não quebra");
} catch (e) {
  ruim("segunda execução", e.message);
}

const itens = await db.query("select count(*)::int n from public.itens_contagem");
confere("itens cadastrados", itens.rows[0].n, 16);
const horarios = await db.query("select count(*)::int n from public.horarios_padrao");
confere("horários fixos (com a quarta)", horarios.rows[0].n, 5);
const quarta = await db.query(
  "select nome from public.horarios_padrao where dia_semana = 3 and horario = '14:30'");
if (quarta.rows[0]?.nome === "Culto da Esperança") bom("Culto da Esperança cadastrado");
else ruim("Culto da Esperança", JSON.stringify(quarta.rows));

console.log("\n=== 3. lançar o domingo 11/10/2026 ===");

// RLS fica de lado aqui: o que está em teste é a aritmética da view.
// As permissões já têm auditoria própria (supabase/auditoria/visualizador.mjs).
await db.exec(`
  alter table public.eventos          disable row level security;
  alter table public.contagens        disable row level security;
  alter table public.contagens_itens  disable row level security;
  alter table public.itens_contagem   disable row level security;
  alter table public.tipos_evento     disable row level security;
`);

const CULTOS = {
  "08:00": {
    adultos: 203, homens: 100,
    itens: { criancas_no_culto: [null, 5], estacionamento: [2, null],
             pastores: [10, null], louvor: [3, null], projecao: [1, null],
             audio: [1, null], iluminacao: [0, null], hospitalidade: [4, null],
             dizimos: [5, null], livraria: [2, null] },
    simples: 208, detalhado: 236, criancas: 5, pads: null, volts: null,
    fora: 2, dentro: 16, pastoral: 10,
  },
  "10:00": {
    adultos: 715, homens: 262,
    itens: { criancas_no_culto: [null, 9], estacionamento: [3, null],
             bercario: [6, 8], maternal: [8, 15], kids: [32, 100],
             pads: [13, 45], volts: [4, 92],
             pastores: [8, null], louvor: [8, null], projecao: [8, null],
             audio: [2, null], iluminacao: [1, null], midias: [2, null],
             hospitalidade: [13, null], dizimos: [10, null], livraria: [3, null] },
    simples: 984, detalhado: 1105, criancas: 132, pads: 45, volts: 92,
    fora: 66, dentro: 47, pastoral: 8,
  },
  "18:00": {
    adultos: 572, homens: 215,
    itens: { criancas_no_culto: [null, 20], estacionamento: [1, null],
             bercario: [4, 7], maternal: [3, 9], kids: [15, 58], pads: [7, 29],
             pastores: [10, null], louvor: [8, null], projecao: [4, null],
             audio: [1, null], iluminacao: [2, null], midias: [2, null],
             hospitalidade: [4, null], dizimos: [7, null], livraria: [2, null] },
    simples: 695, detalhado: 765, criancas: 94, pads: 29, volts: null,
    fora: 30, dentro: 30, pastoral: 10,
  },
};

for (const [horario, c] of Object.entries(CULTOS)) {
  const ev = await db.query(
    `insert into public.eventos (tipo, nome, data, horario)
     values ('culto_fixo', $1, '2026-10-11', $2) returning id`,
    [`Culto Domingo ${horario.slice(0, 2)}h`, horario]);
  const ct = await db.query(
    `insert into public.contagens (evento_id, adultos, homens)
     values ($1, $2, $3) returning id`,
    [ev.rows[0].id, c.adultos, c.homens]);
  for (const [codigo, [servindo, publico]] of Object.entries(c.itens)) {
    await db.query(
      `insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
       select $1, id, $2, $3 from public.itens_contagem where codigo = $4`,
      [ct.rows[0].id, servindo, publico, codigo]);
  }
}
bom("3 cultos lançados");

console.log("\n=== 4. a view bate com as mensagens do grupo? ===");
const r = await db.query(
  `select horario::text h, adultos, homens, criancas, pads, volts,
          servindo_fora, servindo_dentro, pastoral, total_simples, total_detalhado, lancado
     from public.resumo_por_evento where data = '2026-10-11' order by horario`);

const n = (v) => (v === null || v === undefined ? null : Number(v));
for (const linha of r.rows) {
  const nome = linha.h.slice(0, 5);          // "08:00:00" -> "08:00"
  const esp = CULTOS[nome];
  if (!esp) { ruim(`culto inesperado ${linha.h}`); continue; }
  confere(`${nome} crianças`,        n(linha.criancas), esp.criancas);
  confere(`${nome} PADS`,            n(linha.pads),     esp.pads);
  confere(`${nome} Volts`,           n(linha.volts),    esp.volts);
  confere(`${nome} servindo fora`,   Number(linha.servindo_fora),   esp.fora);
  confere(`${nome} servindo dentro`, Number(linha.servindo_dentro), esp.dentro);
  confere(`${nome} equipe pastoral`, Number(linha.pastoral),        esp.pastoral);
  confere(`${nome} TOTAL simples`,   linha.total_simples,   esp.simples);
  confere(`${nome} TOTAL detalhado`, linha.total_detalhado, esp.detalhado);
}

console.log("\n=== 5. totais do dia ===");
const d = await db.query(
  `select horarios, horarios_lancados, total, total_detalhado, homens_cultos
     from public.totais_por_data where data = '2026-10-11'`);
confere("horários do dia",     d.rows[0].horarios, 3);
confere("lançados",            d.rows[0].horarios_lancados, 3);
confere("soma simples do dia", d.rows[0].total, 208 + 984 + 695);
confere("soma detalhada",      d.rows[0].total_detalhado, 236 + 1105 + 765);
confere("homens no dia",       d.rows[0].homens_cultos, 100 + 262 + 215);

console.log("\n=== 6. regras de integridade ===");
const recusa = async (rotulo, sql, params) => {
  try { await db.query(sql, params); ruim(`${rotulo} PASSOU (devia recusar)`); }
  catch { bom(`${rotulo} recusado`); }
};
const ev2 = await db.query(
  `insert into public.eventos (tipo, nome, data, horario)
   values ('culto_fixo','Culto Quinta 20h','2026-10-15','20:00') returning id`);
await recusa("homens > adultos",
  `insert into public.contagens (evento_id, adultos, homens) values ($1, 10, 11)`,
  [ev2.rows[0].id]);
await recusa("adultos negativo",
  `insert into public.contagens (evento_id, adultos) values ($1, -1)`,
  [ev2.rows[0].id]);

const ct2 = await db.query(
  `insert into public.contagens (evento_id, adultos) values ($1, 400) returning id`,
  [ev2.rows[0].id]);
await recusa("item sem número nenhum",
  `insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
   select $1, id, null, null from public.itens_contagem where codigo = 'kids'`,
  [ct2.rows[0].id]);
await recusa("mesmo item duas vezes",
  `insert into public.contagens_itens (contagem_id, item_id, servindo)
   select $1, id, 1 from public.itens_contagem where codigo = 'kids'
   union all
   select $1, id, 2 from public.itens_contagem where codigo = 'kids'`,
  [ct2.rows[0].id]);

console.log("\n=== 7. 'não contado' continua diferente de zero ===");
const semItens = await db.query(
  `select criancas, pads, volts, total_simples
     from public.resumo_por_evento where evento_id = $1`, [ev2.rows[0].id]);
if (semItens.rows[0].criancas === null) bom("sem lançar crianças, o campo fica NULL (não 0)");
else ruim("crianças virou", JSON.stringify(semItens.rows[0].criancas));
confere("total simples só com adultos", semItens.rows[0].total_simples, 400);


console.log("\n=== 8. tipos de evento ===");
const tipos = await db.query("select nome from public.tipos_evento order by nome");
confere("tipos cadastrados", tipos.rows.map((r) => r.nome).join(", "), "Culto Arena, Culto Belas");
await recusa("tipo repetido com outra caixa",
  "insert into public.tipos_evento (nome) values ('culto arena')");
await recusa("tipo em culto fixo",
  `update public.eventos set tipo_evento_id = (select id from public.tipos_evento limit 1)
    where id = $1`, [ev2.rows[0].id]);
const arena = await db.query(
  `insert into public.eventos (tipo, nome, data, horario, tipo_evento_id)
   select 'evento_especial', 'Arena de agosto', '2026-08-18', '20:00', id
     from public.tipos_evento where nome = 'Culto Arena' returning id`);
const tipoArena = await db.query(
  "select tipo_evento from public.resumo_por_evento where evento_id = $1", [arena.rows[0].id]);
confere("resumo traz o tipo", tipoArena.rows[0].tipo_evento, "Culto Arena");

console.log("\n=== 9. não teve culto ===");
const natal = await db.query(
  `insert into public.eventos (tipo, nome, data, horario)
   values ('culto_fixo','Culto Quinta 20h','2026-12-24','20:00') returning id`);
await db.query("update public.eventos set sem_culto = true where id = $1", [natal.rows[0].id]);
const sit = await db.query(
  "select situacao, lancado from public.resumo_por_evento where evento_id = $1", [natal.rows[0].id]);
confere("situação", sit.rows[0].situacao, "sem_culto");
confere("não conta como lançado", sit.rows[0].lancado, false);
await recusa("lançar contagem num culto que não houve",
  "insert into public.contagens (evento_id, adultos) values ($1, 300)", [natal.rows[0].id]);
await recusa("marcar 'não teve' num culto já lançado",
  "update public.eventos set sem_culto = true where id = $1", [ev2.rows[0].id]);
const dia = await db.query(
  "select horarios, horarios_sem_culto from public.totais_por_data where data = '2026-12-24'");
confere("dia sem culto não fica devendo", dia.rows[0].horarios, 0);
confere("e aparece como sem culto", dia.rows[0].horarios_sem_culto, 1);
const pend = await db.query(
  "select situacao from public.resumo_por_evento where data = '2026-10-11' and horario = '08:00'");
confere("culto lançado continua lançado", pend.rows[0].situacao, "lancado");

console.log(`\n${ok} passaram, ${falhou} falharam\n`);
process.exit(falhou ? 1 : 0);

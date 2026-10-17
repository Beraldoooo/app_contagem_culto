/**
 * Confere lib/crescimento.ts com números feitos à mão, incluindo as três
 * armadilhas que motivaram as regras (seção 0.2 do CLAUDE.md).
 *
 *   node --experimental-strip-types scripts/teste-crescimento.ts
 */
import {
  eventosPorTipo,
  mesesEntre,
  segundaDaSemana,
  semanasEntre,
  type CultoFixo,
} from "../lib/crescimento.ts";

let ok = 0, falhou = 0;
const confere = (r: string, obtido: unknown, esperado: unknown) => {
  if (obtido === esperado) { ok++; console.log(`  \x1b[32m✓\x1b[0m ${r.padEnd(46)} ${obtido}`); }
  else { falhou++; console.log(`  \x1b[31m✗\x1b[0m ${r} — obtido ${obtido}, esperado ${esperado}`); }
};
const L = (data: string, horario: string, total: number): CultoFixo =>
  ({ data, horario: `${horario}:00`, situacao: "lancado", total });
const S = (data: string, horario: string): CultoFixo =>
  ({ data, horario: `${horario}:00`, situacao: "sem_culto", total: 0 });
const P = (data: string, horario: string): CultoFixo =>
  ({ data, horario: `${horario}:00`, situacao: "pendente", total: 0 });

console.log("\n=== semana de segunda a domingo ===");
confere("domingo 11/10 → segunda 05/10", segundaDaSemana("2026-10-11"), "2026-10-05");
confere("segunda 05/10 → ela mesma", segundaDaSemana("2026-10-05"), "2026-10-05");
confere("quinta 08/10 → segunda 05/10", segundaDaSemana("2026-10-08"), "2026-10-05");

// Semana A completa; semana B sem a quarta; semana C em andamento.
const cultos: CultoFixo[] = [
  L("2026-09-30", "14:30", 70), L("2026-10-01", "20:00", 400),
  L("2026-10-04", "08:00", 200), L("2026-10-04", "10:00", 950), L("2026-10-04", "18:00", 650),

  S("2026-10-07", "14:30"), L("2026-10-08", "20:00", 410),
  L("2026-10-11", "08:00", 208), L("2026-10-11", "10:00", 984), L("2026-10-11", "18:00", 695),

  L("2026-10-14", "14:30", 72), P("2026-10-15", "20:00"),
];
const hoje = "2026-10-15";
const semanas = semanasEntre("2026-09-28", "2026-10-18", cultos, hoje);
const [a, b, c] = semanas;

console.log("\n=== armadilha 1: semana sem quarta ===");
confere("semana B: total lançado", b.total, 2297);
confere("semana B: cultos comparados (sem a quarta)", b.cultosComparados, 4);
// quinta + domingos: 2297 contra 2200 da semana A → +4,4%.
// Dividir pelo número de cultos daria 2270/5=454 contra 2297/4=574: +26%.
confere("semana B: variação culto com culto", b.variacao, 4.4);
confere("semana B: 1 sem culto", b.semCulto, 1);

console.log("\n=== armadilha 2: semana em andamento ===");
confere("semana C em andamento", c.emAndamento, true);
confere("semana C não é comparada", c.variacao, null);
confere("semana C tem 1 pendente", c.pendentes, 1);
confere("semana A fechada", a.emAndamento, false);

console.log("\n=== semana sem nenhum lançamento é vão, não zero ===");
const vazias = semanasEntre("2026-08-03", "2026-08-16", cultos, hoje);
confere("total null", vazias[0].total, null);
confere("variação null", vazias[0].variacao, null);

console.log("\n=== armadilha 3: mês com 5 domingos ===");
const mensal: CultoFixo[] = [];
// Outubro: 4 domingos; novembro: 5. Mesmo público em todos.
for (const d of ["04", "11", "18", "25"]) mensal.push(L(`2026-10-${d}`, "10:00", 1000));
for (const d of ["01", "08", "15", "22", "29"]) mensal.push(L(`2026-11-${d}`, "10:00", 1000));
// Quartas: em outubro uma não teve culto — divide por 3, não por 4.
mensal.push(L("2026-10-07", "14:30", 70), S("2026-10-14", "14:30"),
            L("2026-10-21", "14:30", 70), L("2026-10-28", "14:30", 70));
for (const d of ["04", "11", "18", "25"]) mensal.push(L(`2026-11-${d}`, "14:30", 70));

const meses = mesesEntre("2026-10-01", "2026-11-30", mensal, "2026-12-15");
confere("outubro: semana típica", meses[0].semanaTipica, 1070);
confere("novembro: semana típica (5 domingos)", meses[1].semanaTipica, 1070);
// Somando o mês: 4280 contra 5280, um "crescimento" de 23% que não existe.
confere("novembro × outubro: variação", meses[1].variacao, 0);

console.log("\n=== eventos: só mês com mês, cada tipo com ele mesmo ===");
const ev = eventosPorTipo("2026-08-01", "2026-11-30", [
  { data: "2026-08-18", tipoEvento: "Culto Arena", situacao: "lancado", total: 229 },
  { data: "2026-10-20", tipoEvento: "Culto Arena", situacao: "lancado", total: 250 },
  { data: "2026-11-17", tipoEvento: "Culto Arena", situacao: "lancado", total: 275 },
  { data: "2026-10-10", tipoEvento: "Culto Belas", situacao: "lancado", total: 180 },
], );
const arena = ev.find((s) => s.tipo === "Culto Arena")!.meses;
confere("tipos encontrados", ev.map((s) => s.tipo).join(", "), "Culto Arena, Culto Belas");
confere("Arena agosto", arena[0].valor, 229);
confere("Arena setembro: sem evento (null, não zero)", arena[1].valor, null);
confere("Arena outubro: sem mês anterior para comparar", arena[2].variacao, null);
confere("Arena novembro × outubro", arena[3].variacao, 10);

console.log(`\n${ok} passaram, ${falhou} falharam\n`);
process.exit(falhou ? 1 : 0);

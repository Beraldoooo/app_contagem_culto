/** Confere lib/contagem.ts contra as mensagens reais de 11/10 e 08/10/2026. */
import {
  resumir, mensagemSimples, mensagemDetalhada, validar,
  type Item, type Lancamento,
} from "../lib/contagem.ts";

let ok = 0, falhou = 0;
const bom = (m: string) => { ok++; console.log("  \x1b[32m✓\x1b[0m", m); };
const ruim = (m: string, d = "") => { falhou++; console.log("  \x1b[31m✗\x1b[0m", m, d); };
const confere = (r: string, obtido: unknown, esperado: unknown) =>
  obtido === esperado ? bom(`${r.padEnd(30)} ${obtido}`)
                      : ruim(r, `\n     obtido:   ${obtido}\n     esperado: ${esperado}`);

const ITENS: Item[] = [
  { codigo: "criancas_no_culto", grupo: "fora", soma_em: "criancas", tem_servindo: false, tem_publico: true, ordem: 1 },
  { codigo: "estacionamento",    grupo: "fora", soma_em: null,       tem_servindo: true,  tem_publico: false, ordem: 2 },
  { codigo: "bercario",          grupo: "fora", soma_em: "criancas", tem_servindo: true,  tem_publico: true, ordem: 3 },
  { codigo: "maternal",          grupo: "fora", soma_em: "criancas", tem_servindo: true,  tem_publico: true, ordem: 4 },
  { codigo: "kids",              grupo: "fora", soma_em: "criancas", tem_servindo: true,  tem_publico: true, ordem: 5 },
  { codigo: "pads",              grupo: "fora", soma_em: "pads",     tem_servindo: true,  tem_publico: true, ordem: 6 },
  { codigo: "volts",             grupo: "fora", soma_em: "volts",    tem_servindo: true,  tem_publico: true, ordem: 7 },
  { codigo: "pastores",          grupo: "pastoral", soma_em: null,   tem_servindo: true,  tem_publico: false, ordem: 1 },
  ...["louvor", "projecao", "audio", "iluminacao", "midias", "hospitalidade", "dizimos", "livraria"]
    .map((codigo, i) => ({ codigo, grupo: "dentro" as const, soma_em: null, tem_servindo: true, tem_publico: false, ordem: i + 1 })),
].map((i) => ({ ...i, id: i.codigo, nome: i.codigo })) as Item[];

const lanc = (
  adultos: number | null, homens: number | null,
  pares: Record<string, [number | null, number | null]>,
): Lancamento => ({
  adultos, homens, observacao: "",
  itens: Object.fromEntries(
    Object.entries(pares).map(([k, [s, p]]) => [k, { servindo: s, publico: p }]),
  ),
});

const C08 = lanc(203, 100, {
  criancas_no_culto: [null, 5], estacionamento: [2, null], pastores: [10, null],
  louvor: [3, null], projecao: [1, null], audio: [1, null], iluminacao: [0, null],
  hospitalidade: [4, null], dizimos: [5, null], livraria: [2, null],
});
const C10 = lanc(715, 262, {
  criancas_no_culto: [null, 9], estacionamento: [3, null], bercario: [6, 8],
  maternal: [8, 15], kids: [32, 100], pads: [13, 45], volts: [4, 92],
  pastores: [8, null], louvor: [8, null], projecao: [8, null], audio: [2, null],
  iluminacao: [1, null], midias: [2, null], hospitalidade: [13, null],
  dizimos: [10, null], livraria: [3, null],
});
const C18 = lanc(572, 215, {
  criancas_no_culto: [null, 20], estacionamento: [1, null], bercario: [4, 7],
  maternal: [3, 9], kids: [15, 58], pads: [7, 29],
  pastores: [10, null], louvor: [8, null], projecao: [4, null], audio: [1, null],
  iluminacao: [2, null], midias: [2, null], hospitalidade: [4, null],
  dizimos: [7, null], livraria: [2, null],
});

console.log("\n=== totais de cada culto ===");
for (const [nome, l, simples, detalhado] of [
  ["08h", C08, 208, 236], ["10h", C10, 984, 1105], ["18h", C18, 695, 765],
] as const) {
  const r = resumir(ITENS, l);
  confere(`${nome} simples`, r.totalSimples, simples);
  confere(`${nome} detalhado`, r.totalDetalhado, detalhado);
}

console.log("\n=== categorias não contadas ficam null ===");
const r08 = resumir(ITENS, C08);
confere("08h crianças", r08.criancas, 5);
confere("08h PADS (não teve)", r08.pads, null);
confere("08h Volts (não teve)", r08.volts, null);
confere("18h Volts (não teve)", resumir(ITENS, C18).volts, null);

console.log("\n=== mensagem simples, palavra por palavra ===");
const cultos = [
  { rotulo: "08h", resumo: resumir(ITENS, C08) },
  { rotulo: "10h", resumo: resumir(ITENS, C10) },
  { rotulo: "18h", resumo: resumir(ITENS, C18) },
];
const ESPERADA = `*FREQUÊNCIA | DOMINGO 11/10/26*

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
TOTAL: 695`;
const obtida = mensagemSimples("2026-10-11", 0, cultos);
if (obtida === ESPERADA) bom("idêntica à mensagem real do Leonardo");
else ruim("difere", `\n--- obtida ---\n${obtida}\n--- esperada ---\n${ESPERADA}`);

console.log("\n=== acumulada: só o que já foi lançado ===");
const soDuas = mensagemSimples("2026-10-11", 0, [
  cultos[0], cultos[1],
  { rotulo: "18h", resumo: resumir(ITENS, lanc(null, null, {})) },
]);
confere("18h não aparece", soDuas.includes("18h"), false);
confere("10h aparece", soDuas.includes("Culto das 10h"), true);
confere("nada lançado = vazio",
  mensagemSimples("2026-10-11", 0, [{ rotulo: "08h", resumo: resumir(ITENS, lanc(null, null, {})) }]), "");

console.log("\n=== mensagem detalhada ===");
const det = mensagemDetalhada("2026-10-11", 0, cultos);
for (const t of ["*TOTAL: 236*", "*TOTAL: 1105*", "*TOTAL: 765*",
                 "Total Adultos: 1490", "Total Servindo Dentro: 93",
                 "Total Servindo Fora: 98", "Total Kids: 231",
                 "Total Pads: 74", "*TOTAL GERAL: 2106*"]) {
  if (det.includes(t)) bom(t); else ruim("faltou", t);
}

console.log("\n=== quinta 08/10: quarta e quinta também batem ===");
const QUI = lanc(401, null, {
  criancas_no_culto: [null, 7], estacionamento: [6, null], bercario: [4, 4],
  maternal: [10, 9], kids: [20, 40], pads: [14, 38],
  pastores: [10, null], louvor: [7, null], projecao: [5, null], audio: [1, null],
  iluminacao: [1, null], midias: [2, null], hospitalidade: [8, null],
  dizimos: [12, null], livraria: [3, null],
});
const rq = resumir(ITENS, QUI);
confere("quinta Kids", rq.criancas, 60);
confere("quinta PADS", rq.pads, 38);
confere("quinta servindo fora", rq.servindoFora, 54);
confere("quinta servindo dentro", rq.servindoDentro, 39);
confere("quinta simples", rq.totalSimples, 499);
confere("quinta detalhado", rq.totalDetalhado, 602);

const QUA = lanc(74, null, {
  criancas_no_culto: [null, 1],
  pastores: [4, null], louvor: [5, null], projecao: [2, null], audio: [1, null],
  hospitalidade: [2, null], dizimos: [2, null], livraria: [1, null],
});
const rqa = resumir(ITENS, QUA);
confere("quarta Kids", rqa.criancas, 1);
confere("quarta servindo dentro", rqa.servindoDentro, 13);
confere("quarta detalhado", rqa.totalDetalhado, 92);

console.log("\n=== validação ===");
confere("homens > adultos", validar(lanc(10, 11, {})), "Homens não pode ser maior que Adultos.");
confere("sem adultos", validar(lanc(null, null, {})), "Informe quantos adultos vieram.");
confere("negativo", validar(lanc(10, null, { kids: [-1, null] })), "Use apenas números inteiros, sem negativos.");
confere("válido", validar(C10), null);

console.log(`\n${ok} passaram, ${falhou} falharam\n`);
process.exit(falhou ? 1 : 0);

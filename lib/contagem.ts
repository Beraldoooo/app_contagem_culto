/**
 * As regras de contagem da igreja, num lugar só.
 *
 * Levantadas em 15/10/2026 a partir das fichas de papel do Leonardo e das
 * mensagens que ele manda no grupo (ver seção 0.1 do CLAUDE.md). Conferidas
 * contra o domingo 11/10/2026 em `supabase/auditoria/contagem.mjs`.
 *
 * Duas coisas aqui são contra-intuitivas e custam caro se forem lidas errado:
 *
 * 1. Quem está servindo NÃO entra em "Adultos" — soma por fora. Por isso o
 *    mesmo culto tem dois totais: 208 simples e 236 detalhado.
 * 2. `null` não é zero. Vazio quer dizer "não foi contado"; zero quer dizer
 *    "ninguém veio". Tratar os dois igual inventa quedas no gráfico.
 */
import type { ItemGrupo, SomaEm } from "@/types/database";

/** Um item da ficha, como vem de `itens_contagem`. */
export type Item = {
  id: string;
  codigo: string;
  nome: string;
  grupo: ItemGrupo;
  tem_servindo: boolean;
  tem_publico: boolean;
  soma_em: SomaEm | null;
  ordem: number;
};

/** O que foi digitado para um item: os dois números da ficha. */
export type ValorItem = {
  servindo: number | null;
  publico: number | null;
};

/** Tudo que a pessoa preenche para um culto. */
export type Lancamento = {
  adultos: number | null;
  homens: number | null;
  observacao: string;
  /** Por código do item (`kids`, `bercario`…). */
  itens: Record<string, ValorItem>;
};

/** O que o app calcula a partir do lançamento. */
export type Resumo = {
  adultos: number | null;
  homens: number | null;
  criancas: number | null;
  pads: number | null;
  volts: number | null;
  servindoFora: number;
  servindoDentro: number;
  pastoral: number;
  totalSimples: number;
  totalDetalhado: number;
  lancado: boolean;
};

const zero = (n: number | null) => n ?? 0;

/**
 * Soma o público dos itens que caem numa mesma linha do resumo.
 *
 * Devolve `null` quando nenhum item daquela linha foi preenchido — é o que
 * faz "Kids" sumir da mensagem das 8h em vez de aparecer como zero.
 */
function somaPublico(
  itens: Item[],
  valores: Lancamento["itens"],
  linha: SomaEm,
): number | null {
  let total: number | null = null;
  for (const item of itens) {
    if (item.soma_em !== linha) continue;
    const v = valores[item.codigo]?.publico;
    if (v === null || v === undefined) continue;
    total = (total ?? 0) + v;
  }
  return total;
}

function somaServindo(
  itens: Item[],
  valores: Lancamento["itens"],
  grupo: ItemGrupo,
): number {
  let total = 0;
  for (const item of itens) {
    if (item.grupo !== grupo) continue;
    total += valores[item.codigo]?.servindo ?? 0;
  }
  return total;
}

export function resumir(itens: Item[], lancamento: Lancamento): Resumo {
  const criancas = somaPublico(itens, lancamento.itens, "criancas");
  const pads = somaPublico(itens, lancamento.itens, "pads");
  const volts = somaPublico(itens, lancamento.itens, "volts");

  const servindoFora = somaServindo(itens, lancamento.itens, "fora");
  const servindoDentro = somaServindo(itens, lancamento.itens, "dentro");
  const pastoral = somaServindo(itens, lancamento.itens, "pastoral");

  // Só congregação. Quem serviu entra apenas no detalhado.
  const totalSimples =
    zero(lancamento.adultos) + zero(criancas) + zero(pads) + zero(volts);

  return {
    adultos: lancamento.adultos,
    homens: lancamento.homens,
    criancas,
    pads,
    volts,
    servindoFora,
    servindoDentro,
    pastoral,
    totalSimples,
    totalDetalhado: totalSimples + servindoFora + servindoDentro + pastoral,
    // O culto entra nas mensagens quando tem adultos lançados.
    lancado: lancamento.adultos !== null,
  };
}

/* -------------------------------------------------------------------------- */
/* As mensagens do grupo                                                      */
/* -------------------------------------------------------------------------- */

/** Um culto já lançado, pronto para virar texto. */
export type CultoResumido = {
  /** "08h", "10h", "14h30"… como aparece na mensagem. */
  rotulo: string;
  resumo: Resumo;
};

const DIAS = [
  "DOMINGO",
  "SEGUNDA-FEIRA",
  "TERÇA-FEIRA",
  "QUARTA-FEIRA",
  "QUINTA-FEIRA",
  "SEXTA-FEIRA",
  "SÁBADO",
];

/** "2026-10-11" → "11/10/26" */
function curta(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano.slice(2)}`;
}
/** "2026-10-11" → "11/10/2026" */
function longa(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/**
 * A mensagem que ele manda depois de cada culto, com o dia inteiro até ali.
 *
 * É repetida de propósito: no domingo ele manda três vezes, cada uma com um
 * culto a mais. Decisão do Beraldo em 16/10/2026 — manter o hábito dele até
 * o Leonardo dizer que prefere diferente.
 */
export function mensagemSimples(
  data: string,
  diaSemana: number,
  cultos: CultoResumido[],
): string {
  const lancados = cultos.filter((c) => c.resumo.lancado);
  if (lancados.length === 0) return "";

  const linhas = [`*FREQUÊNCIA | ${DIAS[diaSemana]} ${curta(data)}*`];

  for (const { rotulo, resumo } of lancados) {
    linhas.push("", `*Culto das ${rotulo}*`, `Adultos: ${zero(resumo.adultos)}`);
    if (resumo.criancas !== null) linhas.push(`Kids: ${resumo.criancas}`);
    if (resumo.pads !== null) linhas.push(`Pads: ${resumo.pads}`);
    if (resumo.volts !== null) linhas.push(`Adoles: ${resumo.volts}`);
    linhas.push(`TOTAL: ${resumo.totalSimples}`);
  }

  return linhas.join("\n");
}

/**
 * A mensagem detalhada, com quem serviu. No domingo sai no fim do dia, com os
 * três cultos e os totais; na quarta é a única que ele manda.
 */
export function mensagemDetalhada(
  data: string,
  diaSemana: number,
  cultos: CultoResumido[],
): string {
  const lancados = cultos.filter((c) => c.resumo.lancado);
  if (lancados.length === 0) return "";

  const linhas = [
    `*FREQUÊNCIA DETALHADA | ${DIAS[diaSemana]} ${longa(data)}*`,
  ];

  for (const { rotulo, resumo } of lancados) {
    linhas.push(
      "",
      `Culto das ${rotulo}`,
      `Adultos: ${zero(resumo.adultos)}`,
      `Servindo Dentro: ${resumo.servindoDentro}`,
      `Servindo Fora: ${resumo.servindoFora}`,
    );
    if (resumo.criancas !== null) linhas.push(`Kids: ${resumo.criancas}`);
    if (resumo.pads !== null) linhas.push(`PADS: ${resumo.pads}`);
    linhas.push(`Equipe pastoral: ${resumo.pastoral}`);
    if (resumo.volts !== null) linhas.push(`Adolescentes: ${resumo.volts}`);
    linhas.push(`*TOTAL: ${resumo.totalDetalhado}*`);
  }

  // Os totais do dia só fazem sentido com mais de um culto.
  if (lancados.length > 1) {
    const soma = (f: (r: Resumo) => number | null) =>
      lancados.reduce((t, c) => t + zero(f(c.resumo)), 0);
    const temAlgum = (f: (r: Resumo) => number | null) =>
      lancados.some((c) => f(c.resumo) !== null);

    linhas.push("", `Total Adultos: ${soma((r) => r.adultos)}`);
    linhas.push(`Total Servindo Dentro: ${soma((r) => r.servindoDentro)}`);
    linhas.push(`Total Servindo Fora: ${soma((r) => r.servindoFora)}`);
    if (temAlgum((r) => r.criancas)) linhas.push(`Total Kids: ${soma((r) => r.criancas)}`);
    if (temAlgum((r) => r.pads)) linhas.push(`Total Pads: ${soma((r) => r.pads)}`);
    if (temAlgum((r) => r.volts)) linhas.push(`Total Adolescentes: ${soma((r) => r.volts)}`);
    linhas.push(`Total Equipe pastoral: ${soma((r) => r.pastoral)}`);
    linhas.push("", `*TOTAL GERAL: ${soma((r) => r.totalDetalhado)}*`);
  }

  return linhas.join("\n");
}

/* -------------------------------------------------------------------------- */
/* Validação                                                                  */
/* -------------------------------------------------------------------------- */

/** Teto de sanidade: acima disso é quase certo erro de digitação. */
export const MAXIMO_POR_CAMPO = 100_000;

/**
 * Devolve a mensagem de erro, ou `null` se estiver tudo certo.
 * As mesmas regras valem no banco (checks em `contagens`), então burlar o
 * front não adianta.
 */
export function validar(lancamento: Lancamento): string | null {
  const { adultos, homens } = lancamento;

  if (adultos === null) return "Informe quantos adultos vieram.";
  if (homens !== null && homens > adultos) {
    return "Homens não pode ser maior que Adultos.";
  }

  const numeros: (number | null)[] = [adultos, homens];
  for (const valor of Object.values(lancamento.itens)) {
    numeros.push(valor.servindo, valor.publico);
  }
  for (const n of numeros) {
    if (n === null) continue;
    if (!Number.isInteger(n) || n < 0) return "Use apenas números inteiros, sem negativos.";
    if (n > MAXIMO_POR_CAMPO) return "Algum número está alto demais. Confira o que foi digitado.";
  }

  if (lancamento.observacao.length > 500) {
    return "A observação pode ter no máximo 500 caracteres.";
  }
  return null;
}

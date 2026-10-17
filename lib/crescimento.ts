/**
 * Contas do Acompanhamento: a igreja está crescendo ou caindo?
 *
 * Regras decididas com o Beraldo em 17/10/2026 (seção 0.2 do CLAUDE.md).
 * Testadas em `scripts/teste-crescimento.ts`.
 *
 * Três armadilhas que estas funções existem para evitar — cada uma faria o
 * número mentir sem ninguém perceber:
 *
 * 1. CULTOS DE TAMANHOS DIFERENTES. A quarta tem ~70 pessoas e o domingo das
 *    10h ~950. Dividir a semana pelo número de cultos que houve faria uma
 *    semana sem quarta "crescer" ~20% sem ninguém a mais ter vindo. Por isso a
 *    comparação é culto com o mesmo culto, só os que aconteceram nos dois
 *    períodos.
 * 2. SEMANA QUE NÃO FECHOU. Na quinta, a semana ainda não tem o domingo;
 *    comparada com a anterior inteira, sempre pareceria uma queda enorme.
 *    Semana em andamento não entra na comparação.
 * 3. MÊS COM 5 DOMINGOS. Somar o mês faria outubro (5 domingos) parecer maior
 *    que setembro (4). O mês vira "semana típica": a média de cada culto no
 *    mês, somadas.
 *
 * `null` sempre quer dizer "não há como saber" — nunca zero.
 */
import type { SituacaoCulto } from "@/types/database";

import { dataLocal, diaDaSemana } from "./datas.ts";

/** Um culto fixo, como vem de resumo_por_evento. */
export type CultoFixo = {
  data: string;
  /** "10:00:00" */
  horario: string;
  situacao: SituacaoCulto;
  /** Total simples (só congregação). */
  total: number;
};

/** Um evento especial lançado. */
export type EventoLancado = {
  data: string;
  tipoEvento: string | null;
  situacao: SituacaoCulto;
  total: number;
};

/* -------------------------------------------------------------------------- */
/* Datas                                                                      */
/* -------------------------------------------------------------------------- */

const p2 = (n: number) => String(n).padStart(2, "0");
function iso(d: Date) {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

export function somarDias(data: string, dias: number): string {
  const d = dataLocal(data);
  d.setDate(d.getDate() + dias);
  return iso(d);
}

/** A segunda-feira da semana da data. A semana vai de segunda a domingo. */
export function segundaDaSemana(data: string): string {
  const dia = diaDaSemana(data); // 0 = domingo
  return somarDias(data, dia === 0 ? -6 : 1 - dia);
}

/** "2026-10-11" → "2026-10" */
export const mesDe = (data: string) => data.slice(0, 7);

/** "2026-10" → "2026-11" */
export function proximoMes(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return m === 12 ? `${a + 1}-01` : `${a}-${p2(m + 1)}`;
}

/** Cada culto é identificado pelo dia da semana e o horário: "0|10:00". */
function chaveCulto(c: CultoFixo) {
  return `${diaDaSemana(c.data)}|${c.horario.slice(0, 5)}`;
}

/**
 * "↑ 4,4%" · "↓ 2%" · "0%". Fica aqui, e não no componente do gráfico, porque
 * a página (servidor) e o gráfico (navegador) usam a mesma: função exportada de
 * um arquivo "use client" não pode ser chamada no servidor.
 */
export function formatarVariacao(v: number | null) {
  if (v === null) return null;
  const sinal = v > 0 ? "↑ " : v < 0 ? "↓ " : "";
  return `${sinal}${Math.abs(v).toLocaleString("pt-BR")}%`;
}

/** Variação em %, com uma casa. `null` quando não há base para comparar. */
export function variacao(atual: number, anterior: number): number | null {
  if (anterior <= 0) return null;
  return Math.round(((atual - anterior) / anterior) * 1000) / 10;
}

/**
 * Compara dois conjuntos de cultos, só pelos que existem nos dois.
 * É a regra 1: se esta semana não teve quarta, a quarta sai das duas.
 */
function compararPorCulto(
  atual: Map<string, number>,
  anterior: Map<string, number>,
): { atual: number; anterior: number; variacao: number | null; cultos: number } | null {
  let somaAtual = 0;
  let somaAnterior = 0;
  let cultos = 0;
  for (const [chave, valor] of atual) {
    const antes = anterior.get(chave);
    if (antes === undefined) continue;
    somaAtual += valor;
    somaAnterior += antes;
    cultos++;
  }
  if (cultos === 0) return null;
  return {
    atual: somaAtual,
    anterior: somaAnterior,
    variacao: variacao(somaAtual, somaAnterior),
    cultos,
  };
}

/* -------------------------------------------------------------------------- */
/* Semanas                                                                    */
/* -------------------------------------------------------------------------- */

export type Semana = {
  /** Segunda-feira. */
  inicio: string;
  /** Domingo. */
  fim: string;
  /** O domingo ainda não passou: fica fora da comparação. */
  emAndamento: boolean;
  /** Soma dos cultos lançados. `null` se nenhum foi lançado. */
  total: number | null;
  lancados: number;
  pendentes: number;
  semCulto: number;
  /** Contra a semana anterior, culto com culto. `null` se não dá para comparar. */
  variacao: number | null;
  /** Quantos cultos entraram na comparação. */
  cultosComparados: number;
  porCulto: Map<string, number>;
};

function montarSemana(inicio: string, cultos: CultoFixo[], hoje: string): Semana {
  const fim = somarDias(inicio, 6);
  const porCulto = new Map<string, number>();
  let lancados = 0;
  let pendentes = 0;
  let semCulto = 0;
  for (const c of cultos) {
    if (c.situacao === "lancado") {
      porCulto.set(chaveCulto(c), (porCulto.get(chaveCulto(c)) ?? 0) + c.total);
      lancados++;
    } else if (c.situacao === "pendente") pendentes++;
    else semCulto++;
  }
  const total = lancados ? [...porCulto.values()].reduce((a, b) => a + b, 0) : null;
  return {
    inicio,
    fim,
    emAndamento: fim >= hoje,
    total,
    lancados,
    pendentes,
    semCulto,
    variacao: null,
    cultosComparados: 0,
    porCulto,
  };
}

/**
 * Todas as semanas entre duas datas, sem buraco: semana sem lançamento
 * aparece com total `null`, e o gráfico desenha um vão em vez de cair a zero.
 */
export function semanasEntre(
  de: string,
  ate: string,
  cultos: CultoFixo[],
  hoje: string,
): Semana[] {
  const porSemana = new Map<string, CultoFixo[]>();
  for (const c of cultos) {
    const s = segundaDaSemana(c.data);
    porSemana.set(s, [...(porSemana.get(s) ?? []), c]);
  }

  // Uma semana antes do início, só para a primeira ter com quem comparar.
  const semanas: Semana[] = [];
  for (let s = somarDias(segundaDaSemana(de), -7); s <= ate; s = somarDias(s, 7)) {
    semanas.push(montarSemana(s, porSemana.get(s) ?? [], hoje));
  }

  for (let i = 1; i < semanas.length; i++) {
    const atual = semanas[i];
    const anterior = semanas[i - 1];
    // Regra 2: semana em andamento não é comparada.
    if (atual.emAndamento || anterior.emAndamento) continue;
    const c = compararPorCulto(atual.porCulto, anterior.porCulto);
    if (!c) continue;
    atual.variacao = c.variacao;
    atual.cultosComparados = c.cultos;
  }
  return semanas.slice(1);
}

/* -------------------------------------------------------------------------- */
/* Meses: a "semana típica"                                                   */
/* -------------------------------------------------------------------------- */

export type Mes = {
  /** "2026-10" */
  mes: string;
  /** Mês corrente: as médias ainda podem mudar. */
  emAndamento: boolean;
  /** Soma das médias de cada culto no mês. `null` sem nenhum lançamento. */
  semanaTipica: number | null;
  variacao: number | null;
  porCulto: Map<string, number>;
};

/**
 * Regra 3: cada culto é dividido pelas vezes que ACONTECEU no mês (o que foi
 * lançado). Cinco domingos dividem por 5; uma quarta sem culto divide por 3.
 */
export function semanaTipica(cultos: CultoFixo[]): Map<string, number> {
  const soma = new Map<string, number>();
  const vezes = new Map<string, number>();
  for (const c of cultos) {
    if (c.situacao !== "lancado") continue;
    const k = chaveCulto(c);
    soma.set(k, (soma.get(k) ?? 0) + c.total);
    vezes.set(k, (vezes.get(k) ?? 0) + 1);
  }
  const medias = new Map<string, number>();
  for (const [k, s] of soma) medias.set(k, s / vezes.get(k)!);
  return medias;
}

export function mesesEntre(
  de: string,
  ate: string,
  cultos: CultoFixo[],
  hoje: string,
): Mes[] {
  const porMes = new Map<string, CultoFixo[]>();
  for (const c of cultos) {
    const m = mesDe(c.data);
    porMes.set(m, [...(porMes.get(m) ?? []), c]);
  }

  const meses: Mes[] = [];
  const primeiro = mesDe(de);
  // Um mês antes, só para o primeiro ter com quem comparar.
  const [a, m] = primeiro.split("-").map(Number);
  let mes = m === 1 ? `${a - 1}-12` : `${a}-${p2(m - 1)}`;
  for (; mes <= mesDe(ate); mes = proximoMes(mes)) {
    const porCulto = semanaTipica(porMes.get(mes) ?? []);
    const valores = [...porCulto.values()];
    meses.push({
      mes,
      emAndamento: mes === mesDe(hoje),
      semanaTipica: valores.length ? Math.round(valores.reduce((x, y) => x + y, 0)) : null,
      variacao: null,
      porCulto,
    });
  }

  for (let i = 1; i < meses.length; i++) {
    const c = compararPorCulto(meses[i].porCulto, meses[i - 1].porCulto);
    if (c) meses[i].variacao = c.variacao;
  }
  return meses.slice(1);
}

/* -------------------------------------------------------------------------- */
/* Eventos especiais: só mês com mês, cada tipo com ele mesmo                 */
/* -------------------------------------------------------------------------- */

export type MesDeEvento = {
  mes: string;
  /** Média dos eventos do tipo no mês (normalmente um só). `null` = sem evento. */
  valor: number | null;
  /** Contra o mês anterior DO MESMO TIPO. `null` se um dos dois não teve. */
  variacao: number | null;
};

export type SerieDeEvento = { tipo: string; meses: MesDeEvento[] };

export function eventosPorTipo(
  de: string,
  ate: string,
  eventos: EventoLancado[],
): SerieDeEvento[] {
  const porTipo = new Map<string, Map<string, number[]>>();
  for (const e of eventos) {
    if (e.situacao !== "lancado" || !e.tipoEvento) continue;
    const meses = porTipo.get(e.tipoEvento) ?? new Map<string, number[]>();
    const m = mesDe(e.data);
    meses.set(m, [...(meses.get(m) ?? []), e.total]);
    porTipo.set(e.tipoEvento, meses);
  }

  const series: SerieDeEvento[] = [];
  for (const [tipo, porMes] of [...porTipo].sort(([a], [b]) => a.localeCompare(b))) {
    const meses: MesDeEvento[] = [];
    let anterior: number | null = null;
    for (let mes = mesDe(de); mes <= mesDe(ate); mes = proximoMes(mes)) {
      const totais = porMes.get(mes);
      // Dois do mesmo tipo no mês não deveria acontecer; se acontecer, média.
      const valor = totais ? Math.round(totais.reduce((x, y) => x + y, 0) / totais.length) : null;
      meses.push({
        mes,
        valor,
        variacao: valor !== null && anterior !== null ? variacao(valor, anterior) : null,
      });
      anterior = valor;
    }
    series.push({ tipo, meses });
  }
  return series;
}

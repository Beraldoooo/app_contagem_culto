import { diaDaSemana } from "./datas";

export type LinhaCulto = {
  data: string;
  total_cultos: number;
  horarios_cultos: number;
  lancados_cultos: number;
};

export type Comparativo = {
  /** Data mais recente que tem culto fixo (hoje, se hoje for domingo ou quinta). */
  atual: LinhaCulto;
  /** Mesmo dia da semana, a ocorrência anterior que tem contagem. */
  anterior: LinhaCulto | null;
  diferenca: number | null;
  /** `null` quando não dá para calcular (anterior zerado). */
  percentual: number | null;
};

/**
 * Compara o culto mais recente com a ocorrência anterior do MESMO dia da
 * semana — domingo com domingo, quinta com quinta.
 *
 * Só entra `culto_fixo`: os campos recebidos já vêm separados por tipo, então
 * evento especial não influencia nem o total nem a variação. Era a distorção
 * que a especificação pede para evitar.
 *
 * @param linhas datas com culto fixo, da mais recente para a mais antiga.
 */
export function compararComSemanaAnterior(
  linhas: LinhaCulto[],
): Comparativo | null {
  const comCulto = linhas.filter((l) => l.horarios_cultos > 0);
  if (comCulto.length === 0) return null;

  const atual = comCulto[0];
  const diaAtual = diaDaSemana(atual.data);

  // Pula datas do mesmo dia da semana que ficaram sem contagem: comparar com um
  // domingo que ninguém contou daria "-100%" e não significaria nada.
  const anterior =
    comCulto.find(
      (l, i) =>
        i > 0 && diaDaSemana(l.data) === diaAtual && l.lancados_cultos > 0,
    ) ?? null;

  if (!anterior || atual.lancados_cultos === 0) {
    return { atual, anterior, diferenca: null, percentual: null };
  }

  return { atual, anterior, ...variacao(atual, anterior) };
}

function variacao(atual: LinhaCulto, anterior: LinhaCulto) {
  const diferenca = atual.total_cultos - anterior.total_cultos;
  const percentual =
    anterior.total_cultos > 0
      ? (diferenca / anterior.total_cultos) * 100
      : null;
  return { diferenca, percentual };
}

/** "+129" · "-42" · "0" */
export function formatarDiferenca(diferenca: number): string {
  return diferenca > 0 ? `+${diferenca}` : String(diferenca);
}

/** "+39,6%" · "-12,8%" */
export function formatarPercentual(percentual: number): string {
  const formatado = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(percentual));
  const sinal = percentual > 0 ? "+" : percentual < 0 ? "−" : "";
  return `${sinal}${formatado}%`;
}

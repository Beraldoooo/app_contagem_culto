import Link from "next/link";

import {
  compararComSemanaAnterior,
  formatarDiferenca,
  formatarPercentual,
  type LinhaCulto,
} from "@/lib/comparativo";
import { DIAS_SEMANA, diaDaSemana, formatarDataLonga, hojeISO } from "@/lib/datas";
import { createClient } from "@/lib/supabase/server";

export async function ResumoDoDia() {
  const supabase = await createClient();

  // Só datas com culto fixo e que já aconteceram. 30 linhas cobrem ~15 semanas
  // de domingos e quintas — folga de sobra para achar o mesmo dia da semana.
  const { data, error } = await supabase
    .from("totais_por_data")
    .select("data, total_cultos, horarios_cultos, lancados_cultos")
    .eq("tem_culto_fixo", true)
    .lte("data", hojeISO())
    .order("data", { ascending: false })
    .limit(30);

  if (error || !data?.length) return null;

  const comparativo = compararComSemanaAnterior(data as LinhaCulto[]);
  if (!comparativo) return null;

  const { atual, anterior, diferenca, percentual } = comparativo;
  const ehHoje = atual.data === hojeISO();
  const diaSemana = DIAS_SEMANA[diaDaSemana(atual.data)];
  const pendentes = atual.horarios_cultos - atual.lancados_cultos;

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {ehHoje ? "Hoje" : "Último culto"}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatarDataLonga(atual.data)}
        </span>
      </div>

      <p className="flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tabular-nums tracking-tight">
          {atual.total_cultos}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {atual.total_cultos === 1 ? "pessoa" : "pessoas"}
        </span>
      </p>

      {atual.lancados_cultos === 0 ? (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Nenhum horário lançado ainda.
        </p>
      ) : anterior && diferenca !== null ? (
        <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-3 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              {diaSemana} anterior
            </span>
            <span className="font-medium tabular-nums">
              {anterior.total_cultos}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Variacao diferenca={diferenca} percentual={percentual} />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              em {formatarDataLonga(anterior.data)}
            </span>
          </div>
        </div>
      ) : (
        <p className="border-t border-slate-200 pt-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Ainda não há {diaSemana} anterior com contagem para comparar.
        </p>
      )}

      {pendentes > 0 && atual.lancados_cultos > 0 ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Faltam {pendentes} {pendentes === 1 ? "horário" : "horários"} deste
          dia — o total ainda vai subir.
        </p>
      ) : null}

      <p className="text-xs text-slate-500 dark:text-slate-500">
        A comparação usa apenas cultos fixos. Eventos especiais ficam de fora.
      </p>

      <Link
        href={`/lancamento?data=${atual.data}`}
        className="text-sm font-medium text-blue-700 underline underline-offset-4 dark:text-blue-400"
      >
        Ver os horários deste dia
      </Link>
    </section>
  );
}

function Variacao({
  diferenca,
  percentual,
}: {
  diferenca: number;
  percentual: number | null;
}) {
  const estilo =
    diferenca > 0
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
      : diferenca < 0
        ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-medium tabular-nums ${estilo}`}
    >
      {diferenca > 0 ? "▲" : diferenca < 0 ? "▼" : "="}{" "}
      {formatarDiferenca(diferenca)}
      {percentual !== null ? ` · ${formatarPercentual(percentual)}` : ""}
    </span>
  );
}

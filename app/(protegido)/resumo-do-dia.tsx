import Link from "next/link";

import { Cartao, RotuloCartao } from "@/components/ui/base";
import { Variacao } from "@/components/variacao";
import { compararComSemanaAnterior, type LinhaCulto } from "@/lib/comparativo";
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

  if (error) return null;

  const comparativo = data?.length
    ? compararComSemanaAnterior(data as LinhaCulto[])
    : null;

  if (!comparativo) {
    return (
      <Cartao as="section" className="flex flex-col gap-2">
        <RotuloCartao>Último culto</RotuloCartao>
        <p className="text-sm text-texto-2">
          Nenhuma contagem registrada ainda. O total do dia e o comparativo com
          a semana anterior aparecem aqui assim que o primeiro culto for lançado.
        </p>
      </Cartao>
    );
  }

  const { atual, anterior, diferenca, percentual } = comparativo;
  const ehHoje = atual.data === hojeISO();
  const diaSemana = DIAS_SEMANA[diaDaSemana(atual.data)];
  const pendentes = atual.horarios_cultos - atual.lancados_cultos;

  return (
    <Cartao as="section" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <RotuloCartao>{ehHoje ? "Hoje" : "Último culto"}</RotuloCartao>
        <span className="text-xs text-texto-3 first-letter:uppercase">
          {formatarDataLonga(atual.data)}
        </span>
      </div>

      <p className="flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tabular-nums tracking-tight">
          {atual.total_cultos}
        </span>
        <span className="text-sm text-texto-3">
          {atual.total_cultos === 1 ? "pessoa" : "pessoas"}
        </span>
      </p>

      {atual.lancados_cultos === 0 ? (
        <p className="text-sm text-aviso-texto">
          Nenhum horário lançado ainda.
        </p>
      ) : anterior && diferenca !== null ? (
        <div className="flex flex-col gap-1.5 border-t border-borda pt-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-texto-2">
              {diaSemana} anterior
            </span>
            <span className="font-medium tabular-nums">
              {anterior.total_cultos}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Variacao
              diferenca={diferenca}
              percentual={percentual}
              className="px-3 py-1 text-sm"
            />
            <span className="text-xs text-texto-3">
              em {formatarDataLonga(anterior.data)}
            </span>
          </div>
        </div>
      ) : (
        <p className="border-t border-borda pt-4 text-sm text-texto-2">
          Ainda não há {diaSemana} anterior com contagem para comparar.
        </p>
      )}

      {pendentes > 0 && atual.lancados_cultos > 0 ? (
        <p className="text-xs text-aviso-texto">
          Faltam {pendentes} {pendentes === 1 ? "horário" : "horários"} deste
          dia — o total ainda vai subir.
        </p>
      ) : null}

      <p className="text-xs text-texto-3">
        A comparação usa apenas cultos fixos. Eventos especiais ficam de fora.
      </p>

      <Link
        href={`/lancamento?data=${atual.data}`}
        className="text-sm font-medium text-marca-texto hover:underline underline-offset-4"
      >
        Ver os horários deste dia
      </Link>
    </Cartao>
  );
}

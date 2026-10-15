import Link from "next/link";

import { Cartao, RotuloCartao } from "@/components/ui/base";
import { Variacao } from "@/components/variacao";
import {
  compararCadaData,
  type Comparativo,
  type LinhaCulto,
} from "@/lib/comparativo";
import {
  comInicialMaiuscula,
  DIAS_SEMANA,
  diaDaSemana,
  formatarDataCurta,
  hojeISO,
} from "@/lib/datas";
import { createClient } from "@/lib/supabase/server";

/** Quantos cultos a tabela mostra. */
const LINHAS = 10;

/**
 * Tabela dos últimos cultos fixos, cada um comparado com o mesmo dia da
 * semana anterior (domingo com domingo, quinta com quinta): quantas pessoas
 * vieram e se houve aumento ou queda. Eventos especiais ficam de fora.
 */
export async function TabelaComparativo() {
  const supabase = await createClient();

  // Busca mais linhas do que mostra: a última da tabela também precisa achar
  // a sua semana anterior.
  const { data, error } = await supabase
    .from("totais_por_data")
    .select("data, total_cultos, horarios_cultos, lancados_cultos")
    .eq("tem_culto_fixo", true)
    .gt("lancados_cultos", 0)
    .lte("data", hojeISO())
    .order("data", { ascending: false })
    .limit(LINHAS * 2 + 4);

  if (error) return null;

  return (
    <QuadroComparativo
      linhas={compararCadaData((data ?? []) as LinhaCulto[]).slice(0, LINHAS)}
    />
  );
}

/** A tabela em si, separada da consulta. */
export function QuadroComparativo({ linhas }: { linhas: Comparativo[] }) {
  return (
    <Cartao as="section" className="flex flex-col gap-4 p-0!">
      <div className="flex flex-col gap-1 px-5 pt-5">
        <RotuloCartao>Comparativo por culto</RotuloCartao>
        <p className="text-xs text-texto-3">
          Cada culto comparado com o mesmo dia da semana anterior. Só cultos
          fixos.
        </p>
      </div>

      {linhas.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-texto-2">
          Nenhuma contagem registrada ainda. A tabela se preenche conforme os
          cultos forem lançados.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-borda bg-superficie-suave text-left text-xs font-medium text-texto-2">
                <th scope="col" className="py-2.5 pr-2 pl-5 font-medium">Culto</th>
                <th scope="col" className="px-2 py-2.5 text-right font-medium sm:px-3">Pessoas</th>
                <th scope="col" className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">
                  Semana anterior
                </th>
                <th scope="col" className="py-2.5 pr-5 pl-2 text-right font-medium">Variação</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ atual, anterior, diferenca, percentual }) => {
                const parcial = atual.lancados_cultos < atual.horarios_cultos;
                return (
                  <tr
                    key={atual.data}
                    className="border-b border-borda last:border-b-0 hover:bg-superficie-suave"
                  >
                    <td className="py-3 pr-2 pl-5">
                      <Link
                        href={`/lancamento?data=${atual.data}`}
                        className="flex flex-col whitespace-nowrap font-medium hover:text-marca-texto"
                      >
                        {comInicialMaiuscula(DIAS_SEMANA[diaDaSemana(atual.data)])}
                        <span className="text-xs font-normal text-texto-3">
                          {formatarDataCurta(atual.data).slice(0, 5)}
                          {parcial ? " · parcial" : ""}
                        </span>
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-right text-base font-semibold tabular-nums sm:px-3">
                      {atual.total_cultos}
                    </td>
                    <td className="hidden px-3 py-3 text-right tabular-nums text-texto-2 sm:table-cell">
                      {anterior ? anterior.total_cultos : "—"}
                    </td>
                    <td className="py-3 pr-5 pl-2 text-right">
                      {diferenca !== null ? (
                        <Variacao diferenca={diferenca} percentual={percentual} />
                      ) : (
                        <span className="text-xs text-texto-3">sem anterior</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Cartao>
  );
}

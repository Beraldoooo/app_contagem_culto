import Link from "next/link";

import { Cartao } from "@/components/ui/base";
import {
  compararCadaData,
  formatarDiferenca,
  formatarPercentual,
  type Comparativo,
  type LinhaCulto,
} from "@/lib/comparativo";
import { DIAS_SEMANA, diaDaSemana, formatarDataCurta, hojeISO } from "@/lib/datas";
import { createClient } from "@/lib/supabase/server";

/** Barras por cartão: ~6 meses de domingos (ou de quintas). */
const BARRAS = 24;

/** Um cartão por dia de culto fixo, na ordem em que aparecem. */
const CARTOES = [
  { dia: 0, titulo: "Domingos" },
  { dia: 4, titulo: "Quintas" },
];

/**
 * Cartões de frequência no estilo de painel: o último total em destaque e uma
 * barra por culto — verde quando subiu e vermelha quando caiu em relação ao
 * mesmo dia da semana anterior. Só cultos fixos.
 */
export async function GraficoComparativo() {
  const supabase = await createClient();

  // Domingos e quintas intercalados, com folga para a barra mais antiga de
  // cada cartão também achar a sua semana anterior.
  const { data, error } = await supabase
    .from("totais_por_data")
    .select("data, total_cultos, horarios_cultos, lancados_cultos")
    .eq("tem_culto_fixo", true)
    .gt("lancados_cultos", 0)
    .lte("data", hojeISO())
    .order("data", { ascending: false })
    .limit(BARRAS * 2 + 4);

  if (error) return null;

  return <CartoesComparativo comparativos={compararCadaData((data ?? []) as LinhaCulto[])} />;
}

/** Os cartões em si, separados da consulta. */
export function CartoesComparativo({ comparativos }: { comparativos: Comparativo[] }) {
  return (
    <>
      {CARTOES.map(({ dia, titulo }) => (
        <CartaoDia
          key={dia}
          titulo={titulo}
          // Mais antigo à esquerda, mais recente à direita.
          cultos={comparativos
            .filter((c) => diaDaSemana(c.atual.data) === dia)
            .slice(0, BARRAS)
            .reverse()}
        />
      ))}
    </>
  );
}

function CartaoDia({ titulo, cultos }: { titulo: string; cultos: Comparativo[] }) {
  const ultimo = cultos.at(-1);
  const aumentos = cultos.filter((c) => (c.diferenca ?? 0) > 0).length;
  const quedas = cultos.filter((c) => (c.diferenca ?? 0) < 0).length;
  const maximo = Math.max(1, ...cultos.map((c) => c.atual.total_cultos));

  return (
    <Cartao as="section" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-texto-2">
            {titulo}
          </h2>
          <p className="text-2xl font-bold tabular-nums">
            {ultimo ? ultimo.atual.total_cultos : "—"}
            {ultimo ? (
              <span className="ml-1.5 text-xs font-normal text-texto-3">
                no último
              </span>
            ) : null}
          </p>
        </div>

        <dl className="flex gap-4 text-right text-xs font-semibold uppercase tracking-wider">
          <div className="flex flex-col items-end gap-1">
            <dt className="flex items-center gap-1.5 text-texto-2">
              <span aria-hidden className="size-1.5 rounded-full bg-sucesso" />
              Aumentos
            </dt>
            <dd className="text-sm tabular-nums text-texto">{aumentos}</dd>
          </div>
          <div className="flex flex-col items-end gap-1">
            <dt className="flex items-center gap-1.5 text-texto-2">
              <span aria-hidden className="size-1.5 rounded-full bg-perigo" />
              Quedas
            </dt>
            <dd className="text-sm tabular-nums text-texto">{quedas}</dd>
          </div>
        </dl>
      </div>

      {cultos.length === 0 ? (
        /* Sem dado não há layout para reservar: a altura do gráfico aqui
           deixava dois blocos vazios ocupando meia tela de celular. */
        <p className="py-6 text-center text-sm text-texto-3">
          Nenhuma contagem ainda.
        </p>
      ) : (
        <>
          <ul
            aria-label={`Frequência das ${titulo.toLowerCase()}`}
            className="flex h-40 items-end justify-between gap-1 border-b border-borda sm:h-48 sm:gap-2"
          >
            {cultos.map((c, i) => (
              <Barra
                key={c.atual.data}
                culto={c}
                maximo={maximo}
                // Nas barras da direita a dica abre para a esquerda, sem vazar do cartão.
                dicaAEsquerda={i >= cultos.length / 2}
              />
            ))}
          </ul>
          <div className="flex justify-between font-mono text-[11px] text-texto-3">
            <span>{formatarDataCurta(cultos[0].atual.data).slice(0, 5)}</span>
            {cultos.length > 1 ? (
              <span>{formatarDataCurta(cultos.at(-1)!.atual.data).slice(0, 5)}</span>
            ) : null}
          </div>
        </>
      )}
    </Cartao>
  );
}

function Barra({
  culto,
  maximo,
  dicaAEsquerda,
}: {
  culto: Comparativo;
  maximo: number;
  dicaAEsquerda: boolean;
}) {
  const { atual, diferenca, percentual } = culto;
  const parcial = atual.lancados_cultos < atual.horarios_cultos;

  const cor =
    diferenca === null || diferenca === 0
      ? "bg-texto-3"
      : diferenca > 0
        ? "bg-sucesso"
        : "bg-perigo";

  const variacao =
    diferenca === null
      ? "sem semana anterior para comparar"
      : `${formatarDiferenca(diferenca)}${percentual !== null ? ` (${formatarPercentual(percentual)})` : ""} vs. semana anterior`;

  const data = formatarDataCurta(atual.data);
  const descricao = `${DIAS_SEMANA[diaDaSemana(atual.data)]}, ${data}: ${atual.total_cultos} pessoas, ${variacao}${parcial ? " (dia ainda parcial)" : ""}`;

  return (
    <li className="group relative flex h-full max-w-5 flex-1 items-end">
      <Link
        href={`/lancamento?data=${atual.data}`}
        aria-label={descricao}
        className={`w-full rounded-t-[3px] transition group-hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca ${cor} ${parcial ? "opacity-50" : ""}`}
        style={{ height: `${Math.max(4, (atual.total_cultos / maximo) * 100)}%` }}
      />

      {/* Dica ao passar o mouse ou focar a barra. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute bottom-full z-10 mb-2 hidden w-max flex-col rounded-campo border border-borda bg-superficie px-2.5 py-1.5 text-xs shadow-flutuante group-hover:flex group-focus-within:flex ${dicaAEsquerda ? "right-0" : "left-0"}`}
      >
        <span className="font-mono text-texto-3">{data}</span>
        <span className="font-semibold tabular-nums">{atual.total_cultos} pessoas</span>
        {diferenca !== null ? (
          <span
            className={
              diferenca > 0
                ? "text-sucesso-texto"
                : diferenca < 0
                  ? "text-perigo-texto"
                  : "text-texto-2"
            }
          >
            {diferenca > 0 ? "▲" : diferenca < 0 ? "▼" : "="} {formatarDiferenca(diferenca)}
            {percentual !== null ? ` · ${formatarPercentual(percentual)}` : ""}
          </span>
        ) : (
          <span className="text-texto-3">sem anterior</span>
        )}
        {parcial ? <span className="text-aviso-texto">dia parcial</span> : null}
      </span>
    </li>
  );
}

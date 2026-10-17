import Link from "next/link";

import {
  compararCadaData,
  formatarDiferenca,
  formatarPercentual,
  type Comparativo,
  type LinhaCulto,
} from "@/lib/comparativo";
import { somarDias } from "@/lib/crescimento";
import { DIAS_SEMANA, diaDaSemana, formatarDataCurta, hojeISO } from "@/lib/datas";
import { createClient } from "@/lib/supabase/server";

/** Barras por cartão: ~6 meses de domingos (ou de quintas). */
const BARRAS = 24;

/** Um cartão por dia de culto fixo, na ordem em que aparecem. */
const CARTOES = [
  { dia: 0, titulo: "Domingos" },
  { dia: 4, titulo: "Quintas" },
];

export type TotalGrafico = "simples" | "detalhado";

/**
 * Cartões de frequência no estilo de painel: o último total em destaque e uma
 * barra por culto — verde quando subiu e vermelha quando caiu em relação ao
 * mesmo dia da semana anterior. Só cultos fixos. Clicar no cartão abre o
 * Acompanhamento daquele dia da semana.
 *
 * `total`: simples (só congregação) ou detalhado (com quem serviu, seção 0.1).
 */
export async function GraficoComparativo({ total }: { total: TotalGrafico }) {
  const supabase = await createClient();
  const hoje = hojeISO();

  // Uma semana a mais que as barras, para a mais antiga achar a anterior.
  // ~5 cultos por semana: bem abaixo do limite de 1000 linhas.
  const { data, error } = await supabase
    .from("resumo_por_evento")
    .select("data, sem_culto, lancado, total_simples, total_detalhado")
    .eq("tipo", "culto_fixo")
    .gte("data", somarDias(hoje, -7 * (BARRAS + 1)))
    .lte("data", hoje);

  if (error) return null;

  // Uma linha por data, somando os horários lançados.
  const porData = new Map<string, LinhaCulto>();
  for (const r of data ?? []) {
    const l = porData.get(r.data) ?? { data: r.data, total_cultos: 0, horarios_cultos: 0, lancados_cultos: 0 };
    if (!r.sem_culto) l.horarios_cultos++;
    if (r.lancado) {
      l.lancados_cultos++;
      l.total_cultos += total === "detalhado" ? r.total_detalhado : r.total_simples;
    }
    porData.set(r.data, l);
  }
  const linhas = [...porData.values()]
    .filter((l) => l.lancados_cultos > 0)
    .sort((a, b) => (a.data < b.data ? 1 : -1));

  return <CartoesComparativo comparativos={compararCadaData(linhas)} total={total} />;
}

/** Os cartões em si, separados da consulta. */
export function CartoesComparativo({
  comparativos,
  total,
}: {
  comparativos: Comparativo[];
  total: TotalGrafico;
}) {
  return (
    <>
      {CARTOES.map(({ dia, titulo }) => (
        <CartaoDia
          key={dia}
          titulo={titulo}
          dia={dia}
          total={total}
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

function CartaoDia({
  titulo,
  dia,
  total,
  cultos,
}: {
  titulo: string;
  dia: number;
  total: TotalGrafico;
  cultos: Comparativo[];
}) {
  const ultimo = cultos.at(-1);
  const aumentos = cultos.filter((c) => (c.diferenca ?? 0) > 0).length;
  const quedas = cultos.filter((c) => (c.diferenca ?? 0) < 0).length;
  const maximo = Math.max(1, ...cultos.map((c) => c.atual.total_cultos));

  const mes = (ultimo?.atual.data ?? hojeISO()).slice(0, 7);
  const destino = `/acompanhamento?periodo=mes&escopo=${dia}&total=${total}&mes=${mes}`;

  return (
    <Link
      href={destino}
      aria-label={`${titulo}: ver no Acompanhamento`}
      className="group/cartao flex flex-col gap-4 rounded-cartao border border-borda bg-superficie p-5 shadow-cartao transition hover:border-borda-forte focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
    >
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
      <span className="text-sm font-medium text-marca-texto underline-offset-4 group-hover/cartao:underline">
        Ver no acompanhamento →
      </span>
    </Link>
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
      {/* Barra, não link: o cartão inteiro já leva ao Acompanhamento. */}
      <span
        role="img"
        aria-label={descricao}
        className={`w-full rounded-t-[3px] transition group-hover:opacity-80 ${cor} ${parcial ? "opacity-50" : ""}`}
        style={{ height: `${Math.max(4, (atual.total_cultos / maximo) * 100)}%` }}
      />

      {/* Dica ao passar o mouse na barra. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute bottom-full z-10 mb-2 hidden w-max flex-col rounded-campo border border-borda bg-superficie px-2.5 py-1.5 text-xs shadow-flutuante group-hover:flex ${dicaAEsquerda ? "right-0" : "left-0"}`}
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

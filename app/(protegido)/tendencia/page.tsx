import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { obterSessaoAtual } from "@/lib/auth/perfil";
import {
  comInicialMaiuscula,
  DIAS_SEMANA,
  formatarDataCurta,
  formatarHorario,
  hojeISO,
} from "@/lib/datas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { Grafico, type Ponto } from "./grafico";

export const metadata: Metadata = { title: "Tendência" };

const LIMITE_PONTOS = 60;

export default async function TendenciaPage({
  searchParams,
}: PageProps<"/tendencia">) {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  const params = await searchParams;
  const serie = typeof params.serie === "string" ? params.serie : "total";
  const mostrarEventos = params.eventos !== "0";
  const hoje = hojeISO();

  const supabase = await createClient();

  // Opções do seletor: vêm da tabela de horários fixos, não do código.
  const { data: horarios } = await supabase
    .from("horarios_padrao")
    .select("dia_semana, horario, nome")
    .eq("ativo", true)
    .order("dia_semana")
    .order("horario");

  const opcoes = (horarios ?? []).map((h) => ({
    valor: h.horario,
    rotulo: comInicialMaiuscula(
      `${DIAS_SEMANA[h.dia_semana]} ${formatarHorario(h.horario)}`,
    ),
  }));

  const serieValida =
    serie === "total" || opcoes.some((o) => o.valor === serie)
      ? serie
      : "total";

  // --- linha regular: só culto fixo -----------------------------------------
  const regulares = new Map<string, number>();

  if (serieValida === "total") {
    const { data } = await supabase
      .from("totais_por_data")
      .select("data, total_cultos, lancados_cultos")
      .eq("tem_culto_fixo", true)
      .gt("lancados_cultos", 0)
      .lte("data", hoje)
      .order("data", { ascending: false })
      .limit(LIMITE_PONTOS);

    for (const linha of data ?? []) regulares.set(linha.data, linha.total_cultos);
  } else {
    const { data } = await supabase
      .from("contagens")
      .select("quantidade, eventos!inner(data, horario, tipo)")
      .eq("eventos.tipo", "culto_fixo")
      .eq("eventos.horario", serieValida)
      .lte("eventos.data", hoje)
      .order("eventos(data)", { ascending: false })
      .limit(LIMITE_PONTOS);

    for (const linha of data ?? [])
      regulares.set(linha.eventos.data, linha.quantidade);
  }

  // --- marcadores: eventos especiais ----------------------------------------
  const eventos = new Map<string, { quantidade: number; nome: string }>();

  if (mostrarEventos && regulares.size > 0) {
    const maisAntiga = [...regulares.keys()].sort()[0];

    const { data } = await supabase
      .from("contagens")
      .select("quantidade, eventos!inner(data, nome, tipo)")
      .eq("eventos.tipo", "evento_especial")
      .gte("eventos.data", maisAntiga)
      .lte("eventos.data", hoje)
      .order("eventos(data)", { ascending: false })
      .limit(LIMITE_PONTOS);

    // Vários horários no mesmo evento somam num marcador só por data.
    for (const linha of data ?? []) {
      const atual = eventos.get(linha.eventos.data);
      eventos.set(linha.eventos.data, {
        quantidade: (atual?.quantidade ?? 0) + linha.quantidade,
        nome: atual?.nome ?? linha.eventos.nome,
      });
    }
  }

  const datas = [...new Set([...regulares.keys(), ...eventos.keys()])].sort();

  const pontos: Ponto[] = datas.map((data) => {
    const evento = eventos.get(data);
    return {
      data,
      rotulo: formatarDataCurta(data).slice(0, 5),
      regular: regulares.get(data) ?? null,
      evento: evento?.quantidade ?? null,
      nomeEvento: evento?.nome ?? null,
    };
  });

  const rotuloSerie =
    serieValida === "total"
      ? "Total do dia"
      : (opcoes.find((o) => o.valor === serieValida)?.rotulo ?? "");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8">
      <header className="flex flex-col gap-1">
        <Link
          href="/"
          className="text-sm text-slate-600 underline underline-offset-4 dark:text-slate-400"
        >
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Tendência</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Evolução da frequência dos cultos fixos ao longo do tempo.
        </p>
      </header>

      <form
        method="get"
        action="/tendencia"
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="serie"
            className="text-xs font-medium text-slate-600 dark:text-slate-400"
          >
            Mostrar
          </label>
          <select
            id="serie"
            name="serie"
            defaultValue={serieValida}
            className="h-11 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="total">Total do dia</option>
            {opcoes.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            name="eventos"
            value="1"
            defaultChecked={mostrarEventos}
            className="size-4 rounded border-slate-300 accent-violet-600 dark:border-slate-700"
          />
          Marcar eventos especiais
        </label>

        <button
          type="submit"
          className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Aplicar
        </button>
      </form>

      {pontos.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Ainda não há contagens suficientes para desenhar a tendência.
        </p>
      ) : (
        <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium">{rotuloSerie}</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {regulares.size} {regulares.size === 1 ? "data" : "datas"}
            </span>
          </div>

          <Grafico pontos={pontos} mostrarEventos={mostrarEventos} />

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-blue-500" />
              Cultos fixos
            </span>
            {mostrarEventos && eventos.size > 0 ? (
              <span className="flex items-center gap-1.5">
                <span className="size-2 rotate-45 bg-violet-400" />
                Eventos especiais ({eventos.size})
              </span>
            ) : null}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-500">
            Os eventos especiais são marcadores soltos — nunca entram na linha
            de tendência.
          </p>
        </section>
      )}

      <Resumo regulares={regulares} />
    </main>
  );
}

function Resumo({ regulares }: { regulares: Map<string, number> }) {
  if (regulares.size < 2) return null;

  const valores = [...regulares.values()];
  const media = Math.round(valores.reduce((a, b) => a + b, 0) / valores.length);
  const maior = Math.max(...valores);
  const menor = Math.min(...valores);
  const dataMaior = [...regulares.entries()].find(([, v]) => v === maior)?.[0];

  return (
    <dl className="grid grid-cols-3 gap-2 text-center">
      {[
        { rotulo: "Média", valor: media, extra: "" },
        {
          rotulo: "Maior",
          valor: maior,
          extra: dataMaior ? formatarDataCurta(dataMaior).slice(0, 5) : "",
        },
        { rotulo: "Menor", valor: menor, extra: "" },
      ].map((item) => (
        <div
          key={item.rotulo}
          className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
        >
          <dt className="text-xs text-slate-500 dark:text-slate-400">
            {item.rotulo}
          </dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums">
            {item.valor}
          </dd>
          {item.extra ? (
            <dd className="text-xs text-slate-500 dark:text-slate-400">
              {item.extra}
            </dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}


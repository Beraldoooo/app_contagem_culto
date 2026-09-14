import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { obterSessaoAtual } from "@/lib/auth/perfil";
import { ehDataValida, formatarDataLonga } from "@/lib/datas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { Filtros, type TipoFiltro } from "./filtros";

export const metadata: Metadata = { title: "Histórico" };

const POR_PAGINA = 20;

function lerTipo(valor: unknown): TipoFiltro {
  return valor === "culto_fixo" || valor === "evento_especial"
    ? valor
    : "todos";
}

function lerData(valor: unknown): string {
  return typeof valor === "string" && ehDataValida(valor) ? valor : "";
}

export default async function HistoricoPage({
  searchParams,
}: PageProps<"/historico">) {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  const params = await searchParams;
  const de = lerData(params.de);
  const ate = lerData(params.ate);
  const tipo = lerTipo(params.tipo);
  const pagina = Math.max(1, Number(params.pagina) || 1);
  const temFiltro = Boolean(de || ate || tipo !== "todos");

  const supabase = await createClient();

  let consulta = supabase
    .from("totais_por_data")
    .select("*", { count: "exact" })
    .order("data", { ascending: false });

  if (de) consulta = consulta.gte("data", de);
  if (ate) consulta = consulta.lte("data", ate);
  // Filtrar por tipo esconde as datas que não têm aquele tipo; os totais
  // exibidos passam a ser os daquele tipo, não o total misto da data.
  if (tipo === "culto_fixo") consulta = consulta.eq("tem_culto_fixo", true);
  if (tipo === "evento_especial")
    consulta = consulta.eq("tem_evento_especial", true);

  const inicio = (pagina - 1) * POR_PAGINA;
  const { data, error, count } = await consulta.range(
    inicio,
    inicio + POR_PAGINA - 1,
  );

  // A view pode não existir ainda no projeto de quem acabou de clonar.
  const viewAusente = error?.code === "PGRST205" || error?.code === "42P01";

  const linhas = data ?? [];
  const totalDeDatas = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalDeDatas / POR_PAGINA));

  const comFiltros = (extra: Record<string, string | number>) => {
    const q = new URLSearchParams();
    if (de) q.set("de", de);
    if (ate) q.set("ate", ate);
    if (tipo !== "todos") q.set("tipo", tipo);
    for (const [k, v] of Object.entries(extra)) q.set(k, String(v));
    const s = q.toString();
    return s ? `/historico?${s}` : "/historico";
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8">
      <header className="flex flex-col gap-1">
        <Link
          href="/"
          className="text-sm text-slate-600 underline underline-offset-4 dark:text-slate-400"
        >
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Histórico</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Todas as datas registradas, da mais recente para a mais antiga.
        </p>
      </header>

      <Filtros de={de} ate={ate} tipo={tipo} temFiltro={temFiltro} />

      {viewAusente ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="font-medium">Falta um passo no banco</p>
          <p className="mt-1">
            Rode o arquivo{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-xs dark:bg-amber-950">
              supabase/totais-por-data.sql
            </code>{" "}
            no SQL Editor do Supabase. Ele cria a view que soma os totais por
            data.
          </p>
        </div>
      ) : error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          Não foi possível carregar o histórico.
        </p>
      ) : linhas.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {temFiltro
            ? "Nenhuma data encontrada com esses filtros."
            : "Nenhuma contagem registrada ainda."}
        </p>
      ) : (
        <>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {totalDeDatas} {totalDeDatas === 1 ? "data" : "datas"}
            {totalPaginas > 1 ? ` · página ${pagina} de ${totalPaginas}` : ""}
          </p>

          <ul className="flex flex-col gap-2">
            {linhas.map((linha) => (
              <ItemData key={linha.data} linha={linha} tipo={tipo} />
            ))}
          </ul>

          {totalPaginas > 1 ? (
            <nav className="flex items-center justify-between gap-3">
              {pagina > 1 ? (
                <Link
                  href={comFiltros({ pagina: pagina - 1 })}
                  className="flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  ← Mais recentes
                </Link>
              ) : (
                <span className="flex-1" />
              )}
              {pagina < totalPaginas ? (
                <Link
                  href={comFiltros({ pagina: pagina + 1 })}
                  className="flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Mais antigas →
                </Link>
              ) : (
                <span className="flex-1" />
              )}
            </nav>
          ) : null}
        </>
      )}
    </main>
  );
}

function ItemData({
  linha,
  tipo,
}: {
  linha: {
    data: string;
    tem_culto_fixo: boolean;
    tem_evento_especial: boolean;
    horarios: number;
    horarios_lancados: number;
    total: number;
    horarios_cultos: number;
    lancados_cultos: number;
    total_cultos: number;
    horarios_eventos: number;
    lancados_eventos: number;
    total_eventos: number;
  };
  tipo: TipoFiltro;
}) {
  // Com filtro por tipo, os números mostrados são os daquele tipo — senão o
  // total apareceria maior do que a soma dos horários listados.
  const total =
    tipo === "culto_fixo"
      ? linha.total_cultos
      : tipo === "evento_especial"
        ? linha.total_eventos
        : linha.total;

  const horarios =
    tipo === "culto_fixo"
      ? linha.horarios_cultos
      : tipo === "evento_especial"
        ? linha.horarios_eventos
        : linha.horarios;

  const lancados =
    tipo === "culto_fixo"
      ? linha.lancados_cultos
      : tipo === "evento_especial"
        ? linha.lancados_eventos
        : linha.horarios_lancados;

  const pendentes = horarios - lancados;

  return (
    <li>
      <Link
        href={`/lancamento?data=${linha.data}`}
        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm font-medium first-letter:uppercase">
            {formatarDataLonga(linha.data)}
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {(tipo === "todos" || tipo === "culto_fixo") &&
            linha.tem_culto_fixo ? (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Culto
              </span>
            ) : null}
            {(tipo === "todos" || tipo === "evento_especial") &&
            linha.tem_evento_especial ? (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
                Evento
              </span>
            ) : null}
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {pendentes > 0
                ? `${lancados} de ${horarios} lançados`
                : `${horarios} ${horarios === 1 ? "horário" : "horários"}`}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className="block text-xl font-semibold tabular-nums">
            {total}
          </span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            {total === 1 ? "pessoa" : "pessoas"}
          </span>
        </div>
      </Link>
    </li>
  );
}

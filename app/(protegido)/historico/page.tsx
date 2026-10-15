import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Alerta } from "@/components/alerta";
import { AvisoSupabase } from "@/components/aviso-supabase";
import { CabecalhoPagina, Pagina, Selo, Vazio } from "@/components/ui/base";
import { LinkBotao } from "@/components/ui/botao";
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
    <Pagina largura="estreita">
      <CabecalhoPagina
        titulo="Histórico"
        descricao="Todas as datas registradas, da mais recente para a mais antiga."
      />

      <Filtros de={de} ate={ate} tipo={tipo} temFiltro={temFiltro} />

      {viewAusente ? (
        <Alerta tom="aviso">
          <strong className="font-semibold">Falta um passo no banco.</strong>{" "}
          Rode o arquivo <code className="text-xs">supabase/totais-por-data.sql</code>{" "}
          no SQL Editor do Supabase. Ele cria a view que soma os totais por
          data.
        </Alerta>
      ) : error ? (
        <Alerta tom="erro">Não foi possível carregar o histórico.</Alerta>
      ) : linhas.length === 0 ? (
        <Vazio>
          {temFiltro
            ? "Nenhuma data encontrada com esses filtros."
            : "Nenhuma contagem registrada ainda."}
        </Vazio>
      ) : (
        <>
          <p className="text-sm text-texto-2">
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
                <LinkBotao
                  href={comFiltros({ pagina: pagina - 1 })}
                  variante="secundario"
                  className="flex-1"
                >
                  ← Mais recentes
                </LinkBotao>
              ) : (
                <span className="flex-1" />
              )}
              {pagina < totalPaginas ? (
                <LinkBotao
                  href={comFiltros({ pagina: pagina + 1 })}
                  variante="secundario"
                  className="flex-1"
                >
                  Mais antigas →
                </LinkBotao>
              ) : (
                <span className="flex-1" />
              )}
            </nav>
          ) : null}
        </>
      )}
    </Pagina>
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
        className="flex items-center justify-between gap-3 rounded-cartao border border-borda bg-superficie p-5 shadow-cartao transition hover:border-marca/40 hover:bg-superficie-suave"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-[15px] font-semibold first-letter:uppercase">
            {formatarDataLonga(linha.data)}
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {(tipo === "todos" || tipo === "culto_fixo") &&
            linha.tem_culto_fixo ? (
              <Selo tom="marca">Culto</Selo>
            ) : null}
            {(tipo === "todos" || tipo === "evento_especial") &&
            linha.tem_evento_especial ? (
              <Selo tom="evento">Evento</Selo>
            ) : null}
            <span className="text-xs text-texto-3">
              {pendentes > 0
                ? `${lancados} de ${horarios} lançados`
                : `${horarios} ${horarios === 1 ? "horário" : "horários"}`}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className="block text-2xl font-bold tabular-nums">
            {total}
          </span>
          <span className="block text-xs text-texto-3">
            {total === 1 ? "pessoa" : "pessoas"}
          </span>
        </div>
      </Link>
    </li>
  );
}

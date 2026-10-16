import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { CabecalhoPagina, Cartao, Pagina, RotuloCartao, Vazio } from "@/components/ui/base";
import { classesBotao } from "@/components/ui/botao";
import { FiltroSelect } from "@/components/ui/filtro";
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

export const metadata: Metadata = { title: "Relatórios" };

const LIMITE_PONTOS = 60;

export default async function RelatoriosPage({
  searchParams,
}: PageProps<"/relatorios">) {
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
    // resumo_por_evento já soma as categorias; "contagens" sozinha não tem
    // mais o número do culto, só o cabeçalho.
    const { data } = await supabase
      .from("resumo_por_evento")
      .select("data, total_simples")
      .eq("tipo", "culto_fixo")
      .eq("horario", serieValida)
      .eq("lancado", true)
      .lte("data", hoje)
      .order("data", { ascending: false })
      .limit(LIMITE_PONTOS);

    for (const linha of data ?? [])
      regulares.set(linha.data, linha.total_simples);
  }

  // --- marcadores: eventos especiais ----------------------------------------
  const eventos = new Map<string, { quantidade: number; nome: string }>();

  if (mostrarEventos && regulares.size > 0) {
    const maisAntiga = [...regulares.keys()].sort()[0];

    const { data } = await supabase
      .from("resumo_por_evento")
      .select("data, nome, total_simples")
      .eq("tipo", "evento_especial")
      .eq("lancado", true)
      .gte("data", maisAntiga)
      .lte("data", hoje)
      .order("data", { ascending: false })
      .limit(LIMITE_PONTOS);

    // Vários horários no mesmo evento somam num marcador só por data.
    for (const linha of data ?? []) {
      const atual = eventos.get(linha.data);
      eventos.set(linha.data, {
        quantidade: (atual?.quantidade ?? 0) + linha.total_simples,
        nome: atual?.nome ?? linha.nome,
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
    <Pagina>
      <CabecalhoPagina
        titulo="Relatórios"
        descricao="Evolução da frequência dos cultos fixos ao longo do tempo."
      />

      <form
        method="get"
        action="/relatorios"
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <FiltroSelect
          rotulo="Mostrar"
          id="serie"
          name="serie"
          defaultValue={serieValida}
          className="sm:w-72"
        >
          <option value="total">Total do dia</option>
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </FiltroSelect>

        <label className="flex h-11 items-center gap-2.5 rounded-campo border border-borda bg-superficie px-3.5 text-sm shadow-cartao">
          <input
            type="checkbox"
            name="eventos"
            value="1"
            defaultChecked={mostrarEventos}
            className="size-4 accent-evento"
          />
          Marcar eventos especiais
        </label>

        <button type="submit" className={classesBotao()}>
          Aplicar
        </button>
      </form>

      <Resumo regulares={regulares} />

      {pontos.length === 0 ? (
        <Vazio>Ainda não há contagens suficientes para desenhar a tendência.</Vazio>
      ) : (
        <Cartao as="section" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <RotuloCartao>{rotuloSerie}</RotuloCartao>
            <span className="text-xs text-texto-3">
              {regulares.size} {regulares.size === 1 ? "data" : "datas"}
            </span>
          </div>

          <Grafico pontos={pontos} mostrarEventos={mostrarEventos} />

          <div className="flex flex-wrap items-center gap-4 text-xs text-texto-2">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-marca" />
              Cultos fixos
            </span>
            {mostrarEventos && eventos.size > 0 ? (
              <span className="flex items-center gap-1.5">
                <span className="size-2 rotate-45 bg-evento" />
                Eventos especiais ({eventos.size})
              </span>
            ) : null}
          </div>

          <p className="text-xs text-texto-3">
            Os eventos especiais são marcadores soltos — nunca entram na linha
            de tendência.
          </p>
        </Cartao>
      )}
    </Pagina>
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
    <dl className="grid grid-cols-3 gap-3 lg:gap-5">
      {[
        { rotulo: "Média", valor: media, extra: "" },
        {
          rotulo: "Maior",
          valor: maior,
          extra: dataMaior ? formatarDataCurta(dataMaior).slice(0, 5) : "",
        },
        { rotulo: "Menor", valor: menor, extra: "" },
      ].map((item) => (
        <Cartao key={item.rotulo} className="p-4 lg:p-5">
          <dt className="text-sm font-medium text-texto-2">{item.rotulo}</dt>
          <dd className="mt-2 text-2xl font-bold tabular-nums lg:text-3xl">
            {item.valor}
          </dd>
          {item.extra ? (
            <dd className="mt-0.5 text-xs text-texto-3">{item.extra}</dd>
          ) : null}
        </Cartao>
      ))}
    </dl>
  );
}


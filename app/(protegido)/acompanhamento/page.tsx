import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Alerta } from "@/components/alerta";
import { AvisoSupabase } from "@/components/aviso-supabase";
import {
  CabecalhoPagina,
  Cartao,
  Pagina,
  RotuloCartao,
} from "@/components/ui/base";
import { Botao } from "@/components/ui/botao";
import { FiltroSelect } from "@/components/ui/filtro";
import { obterSessaoAtual } from "@/lib/auth/perfil";
import type { Resumo } from "@/lib/contagem";
import {
  eventosPorTipo,
  formatarVariacao,
  mesDe,
  mesesEntre,
  segundaDaSemana,
  semanasEntre,
  somarDias,
  type CultoFixo,
  type EventoLancado,
  type Semana,
} from "@/lib/crescimento";
import { diaDaSemana, ehDataValida, formatarDataCurta, hojeISO } from "@/lib/datas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { GraficoLinha, type PontoLinha } from "./grafico-linha";
import { CartaoMensagem, MensagemDoGrupo, type CultoDaMensagem } from "./mensagem-do-grupo";

export const metadata: Metadata = { title: "Acompanhamento" };

const PERIODOS = {
  semana: "Última semana",
  mes: "Mês",
  "1a": "1 ano",
  "2a": "2 anos",
  "3a": "3 anos",
} as const;
type Periodo = keyof typeof PERIODOS;

/** Escopo dos cultos fixos: todos, ou um dia da semana (0 = domingo). */
const ESCOPOS = { geral: "Todos os cultos", "0": "Domingo", "3": "Quarta", "4": "Quinta" } as const;
type Escopo = keyof typeof ESCOPOS;

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const rotuloMes = (mes: string) =>
  `${MESES[Number(mes.slice(5)) - 1]}/${mes.slice(2, 4)}`;
const ddmm = (data: string) => formatarDataCurta(data).slice(0, 5);

/** "08:00:00" → "08h" · "14:30:00" → "14h30" */
function rotuloHorario(horario: string) {
  const [h, m] = horario.split(":");
  return m === "00" ? `${h}h` : `${h}h${m}`;
}

function avisoDaSemana(s: Semana) {
  const partes: string[] = [];
  if (s.pendentes) partes.push(`falta lançar ${s.pendentes} ${s.pendentes === 1 ? "culto" : "cultos"}`);
  if (s.semCulto) partes.push(`${s.semCulto} sem culto`);
  return partes.join(" · ") || undefined;
}

const um = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function AcompanhamentoPage({
  searchParams,
}: PageProps<"/acompanhamento">) {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;
  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  const q = await searchParams;
  const hoje = hojeISO();
  const periodoParam = um(q.periodo);
  const periodo: Periodo = periodoParam && periodoParam in PERIODOS ? (periodoParam as Periodo) : "mes";
  const escopoParam = um(q.escopo);
  const escopo: Escopo = escopoParam && escopoParam in ESCOPOS ? (escopoParam as Escopo) : "geral";
  const mesParam = um(q.mes);
  const mesEscolhido = mesParam && /^\d{4}-\d{2}$/.test(mesParam) && mesParam <= mesDe(hoje) ? mesParam : mesDe(hoje);

  const supabase = await createClient();

  // --- mensagem: a data pedida, ou a mais recente com lançamento -------------
  let dataMensagem = um(q.data);
  if (!dataMensagem || !ehDataValida(dataMensagem)) {
    const { data: ultima } = await supabase
      .from("totais_por_data")
      .select("data")
      .gt("horarios_lancados", 0)
      .order("data", { ascending: false })
      .limit(1)
      .maybeSingle();
    dataMensagem = ultima?.data ?? hoje;
  }

  // --- intervalo do crescimento ---------------------------------------------
  const anos = periodo === "1a" ? 1 : periodo === "2a" ? 2 : periodo === "3a" ? 3 : 0;
  let de: string;
  let ate = hoje;
  if (periodo === "semana") {
    de = somarDias(segundaDaSemana(hoje), -7);
  } else if (periodo === "mes") {
    de = `${mesEscolhido}-01`;
    const [a, m] = mesEscolhido.split("-").map(Number);
    const ultimo = new Date(a, m, 0).getDate();
    ate = mesEscolhido === mesDe(hoje) ? hoje : `${mesEscolhido}-${String(ultimo).padStart(2, "0")}`;
  } else {
    const [a, m] = mesDe(hoje).split("-").map(Number);
    const inicio = new Date(a - anos, m, 1); // mês seguinte, há N anos
    de = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, "0")}-01`;
  }
  // Margem para trás: a primeira semana ou o primeiro mês precisa de um
  // anterior para comparar.
  const buscarDe = somarDias(de, -45);

  const [linhasDia, linhasPeriodo] = await Promise.all([
    supabase
      .from("resumo_por_evento")
      .select(
        "evento_id, nome, horario, adultos, homens, criancas, pads, volts, servindo_fora, servindo_dentro, pastoral, lancado, total_simples, total_detalhado",
      )
      .eq("data", dataMensagem)
      .eq("lancado", true)
      .order("horario"),
    buscarTudo(supabase, buscarDe, ate),
  ]);

  const cultosDaMensagem: CultoDaMensagem[] = (linhasDia.data ?? []).map((c) => ({
    id: c.evento_id,
    nome: c.nome,
    rotulo: rotuloHorario(c.horario),
    resumo: {
      adultos: c.adultos,
      homens: c.homens,
      criancas: c.criancas,
      pads: c.pads,
      volts: c.volts,
      servindoFora: c.servindo_fora,
      servindoDentro: c.servindo_dentro,
      pastoral: c.pastoral,
      totalSimples: c.total_simples,
      totalDetalhado: c.total_detalhado,
      lancado: c.lancado,
    } satisfies Resumo,
  }));

  const fixos: CultoFixo[] = linhasPeriodo
    .filter((l) => l.tipo === "culto_fixo")
    .filter((l) => escopo === "geral" || diaDaSemana(l.data) === Number(escopo))
    .map((l) => ({ data: l.data, horario: l.horario, situacao: l.situacao, total: l.total_simples }));
  const eventos: EventoLancado[] = linhasPeriodo
    .filter((l) => l.tipo === "evento_especial")
    .map((l) => ({ data: l.data, tipoEvento: l.tipo_evento, situacao: l.situacao, total: l.total_simples }));

  const filtrosAtuais = { periodo, escopo, ...(periodo === "mes" ? { mes: mesEscolhido } : {}) };

  return (
    <Pagina>
      <CabecalhoPagina
        titulo="Acompanhamento"
        descricao="A mensagem do grupo e a resposta para a pergunta de sempre: a igreja está crescendo ou caindo?"
      />

      {/* Duas colunas só em tela larga: em 1024px a da direita ficava estreita
          demais e os filtros empilhavam, com o mês cortado. */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:items-start">
        <CartaoMensagem data={dataMensagem} hoje={hoje} outros={filtrosAtuais}>
          <MensagemDoGrupo
            key={dataMensagem}
            data={dataMensagem}
            diaSemana={diaDaSemana(dataMensagem)}
            cultos={cultosDaMensagem}
          />
        </CartaoMensagem>

        <div className="flex flex-col gap-5">
          <form action="/acompanhamento" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <input type="hidden" name="data" value={dataMensagem} />
            <FiltroSelect id="periodo" name="periodo" rotulo="Período" defaultValue={periodo} className="sm:w-48">
              {Object.entries(PERIODOS).map(([v, r]) => (
                <option key={v} value={v}>{r}</option>
              ))}
            </FiltroSelect>
            <FiltroSelect id="escopo" name="escopo" rotulo="Cultos" defaultValue={escopo} className="sm:w-56">
              {Object.entries(ESCOPOS).map(([v, r]) => (
                <option key={v} value={v}>{r}</option>
              ))}
            </FiltroSelect>
            {periodo === "mes" ? (
              <label htmlFor="mes" className="flex h-11 items-center gap-1.5 rounded-campo border border-borda bg-superficie px-3.5 text-sm sm:w-60">
                <span className="shrink-0 text-texto-2">Mês:</span>
                <input id="mes" name="mes" type="month" defaultValue={mesEscolhido} max={mesDe(hoje)}
                  className="min-w-0 flex-1 bg-transparent font-semibold text-texto outline-none" />
              </label>
            ) : null}
            <Botao type="submit" className="sm:w-auto">Aplicar</Botao>
          </form>

          {linhasPeriodo.length === 0 ? (
            <Cartao>
              <p className="text-sm text-texto-2">
                Ainda não há contagens neste período. Assim que os cultos forem
                lançados, o crescimento aparece aqui.
              </p>
            </Cartao>
          ) : (
            <>
              <CrescimentoCultos periodo={periodo} de={de} ate={ate} hoje={hoje} fixos={fixos}
                escopo={ESCOPOS[escopo]} mes={mesEscolhido} />
              <CrescimentoEventos periodo={periodo} de={de} ate={ate} eventos={eventos} />
            </>
          )}
        </div>
      </div>
    </Pagina>
  );
}

type Linha = {
  data: string;
  horario: string;
  tipo: "culto_fixo" | "evento_especial";
  tipo_evento: string | null;
  situacao: "lancado" | "sem_culto" | "pendente";
  total_simples: number;
};

/**
 * O Supabase devolve no máximo 1000 linhas por consulta. Três anos de cultos
 * passam disso (~5 por semana), e cortar em silêncio faria o gráfico perder o
 * começo do período sem avisar ninguém.
 */
async function buscarTudo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  de: string,
  ate: string,
): Promise<Linha[]> {
  const pagina = 1000;
  const linhas: Linha[] = [];
  for (let desde = 0; ; desde += pagina) {
    const { data, error } = await supabase
      .from("resumo_por_evento")
      .select("data, horario, tipo, tipo_evento, situacao, total_simples")
      .gte("data", de)
      .lte("data", ate)
      .order("data")
      .order("horario")
      .range(desde, desde + pagina - 1);
    if (error || !data) break;
    linhas.push(...data);
    if (data.length < pagina) break;
  }
  return linhas;
}

function Variacao({ valor, grande }: { valor: number | null; grande?: boolean }) {
  const texto = formatarVariacao(valor);
  if (!texto) return <span className="text-texto-3">—</span>;
  const cor = valor! > 0 ? "text-sucesso-texto" : valor! < 0 ? "text-perigo-texto" : "text-texto-2";
  return <span className={`font-semibold tabular-nums ${cor} ${grande ? "text-xl" : ""}`}>{texto}</span>;
}

function CrescimentoCultos({
  periodo,
  de,
  ate,
  hoje,
  fixos,
  escopo,
  mes,
}: {
  periodo: Periodo;
  de: string;
  ate: string;
  hoje: string;
  fixos: CultoFixo[];
  escopo: string;
  mes: string;
}) {
  if (periodo === "semana") {
    const semanas = semanasEntre(de, hoje, fixos, hoje);
    const atual = semanas.at(-1)!;
    const fechada = semanas.at(-2);
    return (
      <Cartao as="section" className="flex flex-col gap-4">
        <div>
          <RotuloCartao>{escopo} · semana com semana</RotuloCartao>
          <p className="mt-1 text-xs text-texto-3">
            Cada culto comparado com o mesmo culto da semana anterior, só os que aconteceram nas duas.
          </p>
        </div>
        {fechada && fechada.total !== null ? (
          <div className="flex flex-wrap items-end justify-between gap-3 rounded-campo bg-superficie-suave px-4 py-3">
            <div>
              <p className="text-xs text-texto-3">
                Semana de {ddmm(fechada.inicio)} a {ddmm(fechada.fim)}
              </p>
              <p className="text-3xl font-bold tabular-nums tracking-tight">
                {fechada.total.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="text-right">
              <Variacao valor={fechada.variacao} grande />
              <p className="text-xs text-texto-3">
                {fechada.variacao === null
                  ? "sem semana anterior para comparar"
                  : `sobre a semana anterior · ${fechada.cultosComparados} ${fechada.cultosComparados === 1 ? "culto comparado" : "cultos comparados"}`}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-texto-2">A semana passada não teve lançamentos.</p>
        )}
        {fechada && avisoDaSemana(fechada) ? (
          <Alerta tom="aviso">{avisoDaSemana(fechada)}</Alerta>
        ) : null}
        <p className="text-xs text-texto-3">
          Esta semana ({ddmm(atual.inicio)} a {ddmm(atual.fim)}) está em andamento
          {atual.total !== null ? `: ${atual.total.toLocaleString("pt-BR")} até agora, em ${atual.lancados} ${atual.lancados === 1 ? "culto" : "cultos"}` : ""}.
          Entra na comparação quando o domingo passar.
        </p>
      </Cartao>
    );
  }

  if (periodo === "mes") {
    // A semana pertence ao mês em que TERMINA (no domingo). Sem isso, a semana
    // de 28/09 a 04/10 entrava em setembro só com a quarta 30/09 e aparecia
    // como uma queda enorme — era uma semana de outubro.
    const semanas = semanasEntre(de, ate, fixos, hoje).filter((s) => mesDe(s.fim) === mes);
    const [resumoMes] = mesesEntre(de, ate, fixos, hoje);
    const emAndamento = semanas.find((s) => s.emAndamento);
    const pontos: PontoLinha[] = semanas
      .filter((s) => !s.emAndamento)
      .map((s) => ({
        // Rotulada pelo domingo, que é o que define o mês da semana.
        rotulo: ddmm(s.fim),
        descricao: `Semana de ${ddmm(s.inicio)} a ${ddmm(s.fim)}`,
        valor: s.total,
        variacao: s.variacao,
        aviso: avisoDaSemana(s),
      }));
    return (
      <Cartao as="section" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <RotuloCartao>{escopo} · {rotuloMes(mes)}</RotuloCartao>
            <p className="mt-1 text-xs text-texto-3">Uma linha por semana, cada uma contra a anterior.</p>
          </div>
          {resumoMes?.semanaTipica != null ? (
            <div className="text-right">
              <p className="text-xs text-texto-3">Semana típica do mês</p>
              <p className="text-xl font-bold tabular-nums">
                {resumoMes.semanaTipica.toLocaleString("pt-BR")}
                {resumoMes.variacao !== null ? (
                  <> <Variacao valor={resumoMes.variacao} /></>
                ) : null}
              </p>
              <p className="text-xs text-texto-3">
                {resumoMes.variacao !== null ? "sobre o mês anterior" : "sem mês anterior para comparar"}
              </p>
            </div>
          ) : null}
        </div>
        {pontos.some((p) => p.valor !== null) ? (
          <GraficoLinha pontos={pontos} />
        ) : (
          <p className="text-sm text-texto-2">Nenhuma semana fechada com lançamento neste mês.</p>
        )}
        {emAndamento ? (
          <p className="text-xs text-texto-3">
            A semana de {ddmm(emAndamento.inicio)} está em andamento e ainda não aparece na linha.
          </p>
        ) : null}
      </Cartao>
    );
  }

  const meses = mesesEntre(de, ate, fixos, hoje);
  const pontos: PontoLinha[] = meses.map((m) => ({
    rotulo: rotuloMes(m.mes),
    descricao: `Semana típica de ${rotuloMes(m.mes)}${m.emAndamento ? " (mês em andamento)" : ""}`,
    valor: m.semanaTipica,
    variacao: m.variacao,
  }));
  return (
    <Cartao as="section" className="flex flex-col gap-4">
      <div>
        <RotuloCartao>{escopo} · mês a mês</RotuloCartao>
        <p className="mt-1 text-xs text-texto-3">
          Cada ponto é a semana típica do mês: a média de cada culto, somadas. Assim um mês com cinco domingos não parece maior.
        </p>
      </div>
      <GraficoLinha pontos={pontos} />
    </Cartao>
  );
}

function CrescimentoEventos({
  periodo,
  de,
  ate,
  eventos,
}: {
  periodo: Periodo;
  de: string;
  ate: string;
  eventos: EventoLancado[];
}) {
  const longo = periodo !== "semana" && periodo !== "mes";
  // Eventos só se comparam mês com mês: nos períodos curtos, o mês do fim do
  // período contra o anterior.
  const inicio = longo ? de : somarDias(`${mesDe(ate)}-01`, -1);
  const series = eventosPorTipo(inicio, ate, eventos);
  if (series.length === 0) return null;

  return (
    <Cartao as="section" className="flex flex-col gap-4">
      <div>
        <RotuloCartao>Eventos especiais · mês com mês</RotuloCartao>
        <p className="mt-1 text-xs text-texto-3">
          Fora da conta dos cultos. Cada tipo comparado com ele mesmo no mês anterior.
        </p>
      </div>
      {series.map((s) => {
        const ultimo = s.meses.at(-1)!;
        return (
          <div key={s.tipo} className="flex flex-col gap-2 border-t border-borda pt-4 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">{s.tipo}</p>
              <p className="text-sm">
                {ultimo.valor === null ? (
                  <span className="text-texto-3">sem evento em {rotuloMes(ultimo.mes)}</span>
                ) : (
                  <>
                    <span className="font-semibold tabular-nums">{ultimo.valor.toLocaleString("pt-BR")}</span>{" "}
                    <Variacao valor={ultimo.variacao} />
                  </>
                )}
              </p>
            </div>
            {longo ? (
              <GraficoLinha
                pontos={s.meses.map((m) => ({
                  rotulo: rotuloMes(m.mes),
                  descricao: `${s.tipo} · ${rotuloMes(m.mes)}`,
                  valor: m.valor,
                  variacao: m.variacao,
                  aviso: m.valor === null ? "sem evento neste mês" : undefined,
                }))}
              />
            ) : null}
          </div>
        );
      })}
    </Cartao>
  );
}

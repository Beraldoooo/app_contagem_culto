import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Alerta } from "@/components/alerta";
import { AtualizacaoAutomatica } from "@/components/atualizacao-automatica";
import { AvisoSupabase } from "@/components/aviso-supabase";
import {
  CabecalhoPagina,
  Cartao,
  Pagina,
  RotuloCartao,
} from "@/components/ui/base";
import { LinkBotao } from "@/components/ui/botao";
import { ehAdmin, obterSessaoAtual, podeLancar } from "@/lib/auth/perfil";
import {
  mensagemDetalhada,
  mensagemSimples,
  type CultoResumido,
  type Item,
  type Resumo,
  type ValorItem,
} from "@/lib/contagem";
import {
  DIAS_SEMANA,
  diaDaSemana,
  ehDataValida,
  formatarDataLonga,
  hojeISO,
} from "@/lib/datas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { FormularioContagem, type ValoresIniciais } from "./formulario-contagem";
import { FormularioData } from "./formulario-data";
import { MensagensDoDia } from "./mensagens-do-dia";

export const metadata: Metadata = { title: "Contagem do dia" };

/** "08:00:00" → "08h" · "14:30:00" → "14h30" */
function rotuloHorario(horario: string) {
  const [h, m] = horario.split(":");
  return m === "00" ? `${h}h` : `${h}h${m}`;
}

export default async function LancamentoPage({
  searchParams,
}: PageProps<"/lancamento">) {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  // Visualizador entra, mas só lê. Quem edita é decidido aqui, repetido na
  // Server Action e garantido pela RLS — a tela é a camada mais fraca das três.
  const podeEditar = podeLancar(sessao.perfil);
  const podeExcluir = ehAdmin(sessao.perfil);

  const hoje = hojeISO();
  const { data: dataParam, evento: eventoParam } = await searchParams;
  const dataSelecionada =
    typeof dataParam === "string" && ehDataValida(dataParam) ? dataParam : null;
  const eventoSelecionado =
    typeof eventoParam === "string" ? eventoParam : null;

  return (
    <Pagina largura="estreita">
      <CabecalhoPagina
        titulo={podeEditar ? "Lançar contagem" : "Contagens do dia"}
        descricao={
          podeEditar
            ? "Escolha a data. Cada horário é lançado separadamente, quando o culto terminar."
            : "Escolha a data para consultar as contagens já lançadas."
        }
      />

      <Cartao>
        <FormularioData dataInicial={dataSelecionada ?? hoje} hoje={hoje} />
      </Cartao>

      {dataSelecionada ? (
        <Dia
          data={dataSelecionada}
          eventoSelecionado={eventoSelecionado}
          podeEditar={podeEditar}
          podeExcluir={podeExcluir}
        />
      ) : (
        <ReferenciaHorarios />
      )}
    </Pagina>
  );
}

async function Dia({
  data,
  eventoSelecionado,
  podeEditar,
  podeExcluir,
}: {
  data: string;
  eventoSelecionado: string | null;
  podeEditar: boolean;
  podeExcluir: boolean;
}) {
  const supabase = await createClient();

  // As três consultas saem juntas. Antes, a dos ministérios do culto aberto
  // só começava depois das outras duas terminarem — uma ida ao banco em fila
  // que a tela esperava à toa.
  const [{ data: cultos, error }, { data: itensBrutos }, { data: itensDoCulto }] =
    await Promise.all([
      supabase
        .from("resumo_por_evento")
        .select(
          "evento_id, nome, horario, tipo, adultos, homens, observacao, criancas, pads, volts, servindo_fora, servindo_dentro, pastoral, lancado, total_simples, total_detalhado",
        )
        .eq("data", data)
        .order("horario", { ascending: true }),
      supabase
        .from("itens_contagem")
        .select("id, codigo, nome, grupo, tem_servindo, tem_publico, soma_em, ordem")
        .eq("ativo", true)
        .order("grupo")
        .order("ordem"),
      eventoSelecionado
        ? supabase
            .from("contagens_itens")
            .select(
              "servindo, publico, itens_contagem!inner(codigo), contagens!inner(evento_id)",
            )
            .eq("contagens.evento_id", eventoSelecionado)
        : Promise.resolve({ data: [] as never[] }),
    ]);

  if (error) {
    return (
      <Alerta tom="erro">
        Não foi possível carregar os horários dessa data.
      </Alerta>
    );
  }

  const lista = cultos ?? [];
  if (lista.length === 0) return <SemCultos data={data} podeEditar={podeEditar} />;

  const itens: Item[] = itensBrutos ?? [];

  // O mesmo formato que lib/contagem usa, para as mensagens saírem das regras
  // já testadas em vez de uma segunda conta feita aqui.
  const resumos: CultoResumido[] = lista.map((c) => ({
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

  const diaSemana = diaDaSemana(data);
  const simples = mensagemSimples(data, diaSemana, resumos);
  const detalhada = mensagemDetalhada(data, diaSemana, resumos);

  const lancados = lista.filter((c) => c.lancado).length;
  const pendentes = lista.length - lancados;
  const totalSimples = lista.reduce(
    (t, c) => (c.lancado ? t + c.total_simples : t),
    0,
  );
  const totalDetalhado = lista.reduce(
    (t, c) => (c.lancado ? t + c.total_detalhado : t),
    0,
  );

  const aberto = lista.find((c) => c.evento_id === eventoSelecionado) ?? null;

  const porCodigo: Record<string, ValorItem> = {};
  for (const linha of itensDoCulto ?? []) {
    porCodigo[linha.itens_contagem.codigo] = {
      servindo: linha.servindo,
      publico: linha.publico,
    };
  }

  return (
    <section className="flex flex-col gap-4">
      <AtualizacaoAutomatica />

      <h2 className="text-base font-semibold first-letter:uppercase">
        {formatarDataLonga(data)}
      </h2>

      <Cartao>
        <RotuloCartao>Total do dia</RotuloCartao>
        <div className="mt-2 flex flex-wrap items-end gap-x-8 gap-y-3">
          <p className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold tabular-nums tracking-tight">
              {totalSimples}
            </span>
            <span className="text-sm text-texto-3">na congregação</span>
          </p>
          <p className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-texto-2">
              {totalDetalhado}
            </span>
            <span className="text-sm text-texto-3">com quem serviu</span>
          </p>
        </div>

        <p className="mt-3 text-xs text-texto-3">
          {lancados} de {lista.length}{" "}
          {lista.length === 1 ? "horário lançado" : "horários lançados"}
          {pendentes > 0
            ? ` · ${pendentes} ${pendentes === 1 ? "pendente" : "pendentes"}`
            : " · dia completo"}
        </p>
      </Cartao>

      <ul className="flex flex-col gap-2">
        {lista.map((culto) => {
          const selecionado = culto.evento_id === aberto?.evento_id;
          return (
            <li key={culto.evento_id}>
              <Link
                href={
                  selecionado
                    ? `/lancamento?data=${data}`
                    : `/lancamento?data=${data}&evento=${culto.evento_id}`
                }
                aria-current={selecionado ? "true" : undefined}
                className={`flex items-center justify-between gap-3 rounded-cartao border px-4 py-3 transition ${
                  selecionado
                    ? "border-marca bg-marca-suave"
                    : "border-borda bg-superficie hover:border-borda-forte"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {culto.nome}
                  </span>
                  <span className="block text-xs text-texto-3">
                    {culto.tipo === "evento_especial" ? "Evento · " : ""}
                    {rotuloHorario(culto.horario)}
                  </span>
                </span>
                {culto.lancado ? (
                  <span className="shrink-0 rounded-campo bg-sucesso-suave px-2.5 py-1 text-xs font-medium tabular-nums text-sucesso-texto">
                    ✓ {culto.total_simples}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-campo bg-aviso-suave px-2.5 py-1 text-xs font-medium text-aviso-texto">
                    pendente
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {aberto ? (
        <FormularioDoCulto
          culto={aberto}
          itens={itens}
          valoresItens={porCodigo}
          podeEditar={podeEditar}
          podeExcluir={podeExcluir}
        />
      ) : (
        <p className="text-xs text-texto-3">
          {podeEditar
            ? "Toque num horário acima para lançar ou corrigir a contagem."
            : "Toque num horário acima para ver os números."}
        </p>
      )}

      <MensagensDoDia simples={simples} detalhada={detalhada} />

      {podeEditar ? (
        <LinkBotao href={`/evento-especial?data=${data}`} variante="secundario">
          + Evento especial nesta data
        </LinkBotao>
      ) : null}

      <p className="text-xs text-texto-3">
        Esta tela se atualiza sozinha a cada 30 segundos — o que outra pessoa
        lançar aparece aqui sem precisar recarregar.
      </p>
    </section>
  );
}

function FormularioDoCulto({
  culto,
  itens,
  valoresItens,
  podeEditar,
  podeExcluir,
}: {
  culto: { evento_id: string; nome: string; adultos: number | null; homens: number | null; observacao: string | null; lancado: boolean };
  itens: Item[];
  valoresItens: Record<string, ValorItem>;
  podeEditar: boolean;
  podeExcluir: boolean;
}) {
  const porCodigo = valoresItens;

  const iniciais: ValoresIniciais = {
    adultos: culto.adultos,
    homens: culto.homens,
    observacao: culto.observacao ?? "",
    itens: porCodigo,
  };

  if (!podeEditar) {
    return <SomenteLeitura culto={culto} itens={itens} iniciais={iniciais} />;
  }

  return (
    <FormularioContagem
      key={culto.evento_id}
      eventoId={culto.evento_id}
      nomeCulto={culto.nome}
      itens={itens}
      iniciais={iniciais}
      jaLancado={culto.lancado}
      podeExcluir={podeExcluir}
    />
  );
}

/** Visualizador vê os mesmos números, sem um campo sequer para editar. */
function SomenteLeitura({
  culto,
  itens,
  iniciais,
}: {
  culto: { nome: string; lancado: boolean };
  itens: Item[];
  iniciais: ValoresIniciais;
}) {
  if (!culto.lancado) {
    return (
      <Cartao>
        <p className="text-sm text-texto-2">
          {culto.nome} ainda não foi lançado.
        </p>
      </Cartao>
    );
  }

  const comValor = itens.filter((i) => {
    const v = iniciais.itens[i.codigo];
    return v && (v.servindo !== null || v.publico !== null);
  });

  return (
    <Cartao as="section">
      <RotuloCartao>{culto.nome}</RotuloCartao>
      <dl className="mt-3 flex flex-col gap-1.5 text-sm">
        <Linha rotulo="Adultos" valor={iniciais.adultos} />
        {iniciais.homens !== null ? (
          <Linha rotulo="Homens" valor={iniciais.homens} />
        ) : null}
        {comValor.map((item) => (
          <Linha
            key={item.codigo}
            rotulo={item.nome}
            valor={iniciais.itens[item.codigo].servindo}
            publico={iniciais.itens[item.codigo].publico}
          />
        ))}
      </dl>
      {iniciais.observacao ? (
        <p className="mt-4 border-t border-borda pt-3 text-sm text-texto-2">
          {iniciais.observacao}
        </p>
      ) : null}
    </Cartao>
  );
}

function Linha({
  rotulo,
  valor,
  publico,
}: {
  rotulo: string;
  valor: number | null;
  publico?: number | null;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-texto-2">{rotulo}</dt>
      <dd className="font-medium tabular-nums">
        {valor !== null && valor !== undefined ? valor : "—"}
        {publico !== null && publico !== undefined ? (
          <span className="ml-2 text-texto-3">· {publico} crianças</span>
        ) : null}
      </dd>
    </div>
  );
}

function SemCultos({
  data,
  podeEditar,
}: {
  data: string;
  podeEditar: boolean;
}) {
  const diaSemana = DIAS_SEMANA[diaDaSemana(data)];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-semibold first-letter:uppercase">
        {formatarDataLonga(data)}
      </h2>
      <Cartao className="text-sm">
        <p>
          Não há culto fixo em <strong className="font-medium">{diaSemana}</strong>.
        </p>
        <p className="mt-2 text-texto-2">
          Os horários fixos são domingo (8h, 10h e 18h), quarta (14h30) e
          quinta-feira (20h).
          {podeEditar
            ? " Para uma data fora da rotina, cadastre um evento especial."
            : " Nenhum evento especial foi cadastrado nesta data."}
        </p>
        {podeEditar ? (
          <LinkBotao
            href={`/evento-especial?data=${data}`}
            variante="secundario"
            className="mt-4"
          >
            Criar evento especial nesta data
          </LinkBotao>
        ) : null}
      </Cartao>
    </section>
  );
}

function ReferenciaHorarios() {
  return (
    <Cartao as="section">
      <RotuloCartao>Horários fixos</RotuloCartao>
      <dl className="mt-3 flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-texto-2">Domingo</dt>
          <dd className="font-medium">8h · 10h · 18h</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-texto-2">Quarta-feira</dt>
          <dd className="font-medium">14h30 · Culto da Esperança</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-texto-2">Quinta-feira</dt>
          <dd className="font-medium">20h</dd>
        </div>
      </dl>
    </Cartao>
  );
}

import type { Metadata } from "next";
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
  DIAS_SEMANA,
  diaDaSemana,
  ehDataValida,
  formatarDataLonga,
  hojeISO,
} from "@/lib/datas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { CartaoHorario, type HorarioDoDia } from "./cartao-horario";
import { FormularioData } from "./formulario-data";

export const metadata: Metadata = { title: "Contagem do dia" };

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
  const { data: dataParam } = await searchParams;
  const dataSelecionada =
    typeof dataParam === "string" && ehDataValida(dataParam) ? dataParam : null;

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
        <Horarios
          data={dataSelecionada}
          podeEditar={podeEditar}
          podeExcluir={podeExcluir}
        />
      ) : (
        <ReferenciaHorarios />
      )}
    </Pagina>
  );
}

async function Horarios({
  data,
  podeEditar,
  podeExcluir,
}: {
  data: string;
  podeEditar: boolean;
  podeExcluir: boolean;
}) {
  const supabase = await createClient();

  const { data: eventos, error } = await supabase
    .from("eventos")
    .select("id, nome, horario, tipo")
    .eq("data", data)
    .order("horario", { ascending: true });

  if (error) {
    return (
      <Alerta tom="erro">
        Não foi possível carregar os horários dessa data.
      </Alerta>
    );
  }

  const lista = eventos ?? [];

  const { data: contagens } = lista.length
    ? await supabase
        .from("contagens")
        .select("evento_id, quantidade")
        .in(
          "evento_id",
          lista.map((e) => e.id),
        )
    : { data: [] };

  const porEvento = new Map(
    (contagens ?? []).map((c) => [c.evento_id, c.quantidade]),
  );

  const horarios: HorarioDoDia[] = lista.map((evento) => ({
    id: evento.id,
    nome: evento.nome,
    horario: evento.horario,
    ehEvento: evento.tipo === "evento_especial",
    quantidade: porEvento.get(evento.id) ?? null,
  }));

  if (horarios.length === 0) {
    return <SemCultos data={data} podeEditar={podeEditar} />;
  }

  const lancados = horarios.filter((h) => h.quantidade !== null).length;
  const pendentes = horarios.length - lancados;

  const soma = (apenas: (h: HorarioDoDia) => boolean) =>
    horarios.reduce((t, h) => (apenas(h) ? t + (h.quantidade ?? 0) : t), 0);

  const total = soma(() => true);
  const totalCultos = soma((h) => !h.ehEvento);
  const totalEventos = soma((h) => h.ehEvento);
  const temEvento = horarios.some((h) => h.ehEvento);

  return (
    <section className="flex flex-col gap-4">
      <AtualizacaoAutomatica />

      <h2 className="text-base font-semibold first-letter:uppercase">
        {formatarDataLonga(data)}
      </h2>

      <Cartao>
        <RotuloCartao>Total do dia</RotuloCartao>
        <p className="mt-2 flex items-baseline gap-1.5">
          <span className="text-4xl font-bold tabular-nums tracking-tight">
            {total}
          </span>
          <span className="text-sm text-texto-3">
            {total === 1 ? "pessoa" : "pessoas"}
          </span>
        </p>

        <p className="mt-2 text-xs text-texto-3">
          {lancados} de {horarios.length}{" "}
          {horarios.length === 1 ? "horário lançado" : "horários lançados"}
          {pendentes > 0
            ? ` · ${pendentes} ${pendentes === 1 ? "pendente" : "pendentes"}`
            : " · dia completo"}
        </p>

        {/* Com evento especial no mesmo dia, um número só enganaria: ele não é
            comparável com outro domingo. A quebra deixa isso à vista. */}
        {temEvento ? (
          <dl className="mt-4 flex flex-col gap-1.5 border-t border-borda pt-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-texto-2">Cultos</dt>
              <dd className="font-medium tabular-nums">{totalCultos}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-texto-2">Eventos especiais</dt>
              <dd className="font-medium tabular-nums">{totalEventos}</dd>
            </div>
          </dl>
        ) : null}

        {pendentes > 0 ? (
          <p className="mt-3 text-xs text-aviso-texto">
            Ainda falta lançar {pendentes}{" "}
            {pendentes === 1 ? "horário" : "horários"} — o total vai subir.
          </p>
        ) : null}
      </Cartao>

      <ul className="flex flex-col gap-3">
        {horarios.map((horario) => (
          <CartaoHorario
            key={horario.id}
            horario={horario}
            podeEditar={podeEditar}
            podeExcluir={podeExcluir}
          />
        ))}
      </ul>

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
          Os horários fixos são domingo (8h, 10h e 18h) e quinta-feira (20h).
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
          <dt className="text-texto-2">Quinta-feira</dt>
          <dd className="font-medium">20h</dd>
        </div>
      </dl>
    </Cartao>
  );
}

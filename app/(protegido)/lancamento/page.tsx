import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { obterSessaoAtual, podeLancar } from "@/lib/auth/perfil";
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

  const hoje = hojeISO();
  const { data: dataParam } = await searchParams;
  const dataSelecionada =
    typeof dataParam === "string" && ehDataValida(dataParam) ? dataParam : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex flex-col gap-1">
        <Link
          href="/"
          className="text-sm text-slate-600 underline underline-offset-4 dark:text-slate-400"
        >
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {podeEditar ? "Contagem do dia" : "Contagens do dia"}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {podeEditar
            ? "Escolha a data. Cada horário é lançado separadamente, quando o culto terminar."
            : "Escolha a data para consultar as contagens já lançadas."}
        </p>
      </header>

      <FormularioData dataInicial={dataSelecionada ?? hoje} hoje={hoje} />

      {dataSelecionada ? (
        <Horarios data={dataSelecionada} podeEditar={podeEditar} />
      ) : (
        <ReferenciaHorarios />
      )}
    </main>
  );
}

async function Horarios({
  data,
  podeEditar,
}: {
  data: string;
  podeEditar: boolean;
}) {
  const supabase = await createClient();

  const { data: eventos, error } = await supabase
    .from("eventos")
    .select("id, nome, horario, tipo")
    .eq("data", data)
    .order("horario", { ascending: true });

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
      >
        Não foi possível carregar os horários dessa data.
      </p>
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

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-medium">{formatarDataLonga(data)}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {lancados} de {horarios.length}{" "}
          {horarios.length === 1 ? "horário lançado" : "horários lançados"}
          {pendentes > 0
            ? ` · ${pendentes} ${pendentes === 1 ? "pendente" : "pendentes"}`
            : " · dia completo"}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {horarios.map((horario) => (
          <CartaoHorario
            key={horario.id}
            horario={horario}
            podeEditar={podeEditar}
          />
        ))}
      </ul>

      {podeEditar ? (
        <Link
          href={`/evento-especial?data=${data}`}
          className="flex h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          + Evento especial nesta data
        </Link>
      ) : null}

      <p className="text-xs text-slate-500 dark:text-slate-500">
        A soma do dia e o comparativo com as datas anteriores são a próxima
        etapa.
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
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">{formatarDataLonga(data)}</h2>
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
        <p>
          Não há culto fixo em <strong className="font-medium">{diaSemana}</strong>.
        </p>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Os horários fixos são domingo (8h, 10h e 18h) e quinta-feira (20h).
          {podeEditar
            ? " Para uma data fora da rotina, cadastre um evento especial."
            : " Nenhum evento especial foi cadastrado nesta data."}
        </p>
        {podeEditar ? (
          <Link
            href={`/evento-especial?data=${data}`}
            className="mt-3 flex h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Criar evento especial nesta data
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function ReferenciaHorarios() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-medium">Horários fixos</h2>
      <dl className="mt-3 flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-600 dark:text-slate-400">Domingo</dt>
          <dd className="font-medium">8h · 10h · 18h</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-600 dark:text-slate-400">Quinta-feira</dt>
          <dd className="font-medium">20h</dd>
        </div>
      </dl>
    </section>
  );
}

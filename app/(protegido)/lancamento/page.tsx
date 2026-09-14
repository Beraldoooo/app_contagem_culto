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
  formatarHorario,
  hojeISO,
} from "@/lib/datas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { FormularioData } from "./formulario-data";

export const metadata: Metadata = { title: "Novo lançamento" };

export default async function LancamentoPage({
  searchParams,
}: PageProps<"/lancamento">) {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  // Barreira de servidor: Visualizador não chega aqui nem digitando a URL.
  // A RLS ainda barra a escrita, mesmo que alguém contorne esta checagem.
  if (!podeLancar(sessao.perfil)) redirect("/");

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
          Novo lançamento
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Escolha a data do culto. Os horários aparecem automaticamente.
        </p>
      </header>

      <FormularioData dataInicial={dataSelecionada ?? hoje} hoje={hoje} />

      {dataSelecionada ? (
        <Horarios data={dataSelecionada} />
      ) : (
        <ReferenciaHorarios />
      )}
    </main>
  );
}

async function Horarios({ data }: { data: string }) {
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

  // Contagens já lançadas, para a tela mostrar o que falta.
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

  const diaSemana = DIAS_SEMANA[diaDaSemana(data)];

  if (lista.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">{formatarDataLonga(data)}</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
          <p>
            Não há culto fixo em{" "}
            <strong className="font-medium">{diaSemana}</strong>.
          </p>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Os horários fixos são domingo (8h, 10h e 18h) e quinta-feira (20h).
            Para uma data fora da rotina, será preciso cadastrar um evento
            especial — ainda não implementado.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-medium">{formatarDataLonga(data)}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {lista.length === 1
            ? "1 culto nessa data"
            : `${lista.length} cultos nessa data`}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {lista.map((evento) => {
          const quantidade = porEvento.get(evento.id);

          return (
            <li
              key={evento.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-medium">
                  {formatarHorario(evento.horario)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {evento.nome}
                </span>
              </div>

              {quantidade === undefined ? (
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  sem contagem
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {quantidade} pessoas
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-slate-500 dark:text-slate-500">
        Digitar o número de cada horário é a próxima etapa.
      </p>
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

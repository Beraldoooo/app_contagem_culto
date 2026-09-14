"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";

import { formatarHorario } from "@/lib/datas";

import { salvarContagem, type EstadoContagem } from "./acoes";

export type HorarioDoDia = {
  id: string;
  nome: string;
  horario: string;
  ehEvento: boolean;
  quantidade: number | null;
};

function BotaoSalvar({ jaLancado }: { jaLancado: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 shrink-0 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
    >
      {pending ? "Salvando…" : jaLancado ? "Atualizar" : "Salvar"}
    </button>
  );
}

function Cabecalho({ horario }: { horario: HorarioDoDia }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="flex items-center gap-2 text-base font-medium">
        {formatarHorario(horario.horario)}
        {horario.ehEvento ? (
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
            Evento
          </span>
        ) : null}
      </span>
      <span className="truncate text-xs text-slate-500 dark:text-slate-400">
        {horario.nome}
      </span>
    </div>
  );
}

function Selo({ jaLancado }: { jaLancado: boolean }) {
  return jaLancado ? (
    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
      ✓ lançado
    </span>
  ) : (
    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
      pendente
    </span>
  );
}

/**
 * Um card por horário, com formulário próprio.
 *
 * Cada card salva sozinho: são Server Actions independentes, então lançar o
 * culto das 8h não depende de o das 10h estar preenchido — que é justamente
 * como a contagem acontece ao longo do domingo.
 */
export function CartaoHorario({
  horario,
  podeEditar,
}: {
  horario: HorarioDoDia;
  podeEditar: boolean;
}) {
  const [estado, enviar] = useActionState<EstadoContagem, FormData>(
    salvarContagem,
    {},
  );
  const campoId = useId();
  const jaLancado = horario.quantidade !== null;

  const borda = jaLancado
    ? "border-emerald-300 dark:border-emerald-900"
    : "border-slate-200 dark:border-slate-800";

  if (!podeEditar) {
    return (
      <li
        className={`flex items-center justify-between gap-3 rounded-xl border bg-white p-4 dark:bg-slate-900 ${borda}`}
      >
        <Cabecalho horario={horario} />
        {jaLancado ? (
          <span className="shrink-0 text-right">
            <span className="block text-lg font-semibold">
              {horario.quantidade}
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              pessoas
            </span>
          </span>
        ) : (
          <Selo jaLancado={false} />
        )}
      </li>
    );
  }

  return (
    <li
      className={`flex flex-col gap-3 rounded-xl border bg-white p-4 dark:bg-slate-900 ${borda}`}
    >
      <div className="flex items-start justify-between gap-3">
        <Cabecalho horario={horario} />
        <Selo jaLancado={jaLancado} />
      </div>

      <form action={enviar} className="flex flex-col gap-2">
        <input type="hidden" name="evento_id" value={horario.id} />

        <div className="flex items-center gap-2">
          <label htmlFor={campoId} className="sr-only">
            {`Pessoas presentes às ${formatarHorario(horario.horario)}`}
          </label>
          <input
            id={campoId}
            name="quantidade"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            required
            placeholder="0"
            defaultValue={horario.quantidade ?? ""}
            className="h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-950"
          />
          <BotaoSalvar jaLancado={jaLancado} />
        </div>

        {estado.erro ? (
          <p role="alert" className="text-xs text-red-700 dark:text-red-400">
            {estado.erro}
          </p>
        ) : null}
        {estado.ok ? (
          <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">
            ✓ {estado.ok}
          </p>
        ) : null}
      </form>
    </li>
  );
}

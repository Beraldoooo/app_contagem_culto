"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alerta } from "@/components/alerta";

import { prepararData, type EstadoData } from "./acoes";

function Botao() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-lg bg-blue-600 px-4 text-base font-medium text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
    >
      {pending ? "Carregando…" : "Ver horários"}
    </button>
  );
}

export function FormularioData({
  dataInicial,
  hoje,
}: {
  dataInicial: string;
  hoje: string;
}) {
  const [estado, enviar] = useActionState<EstadoData, FormData>(
    prepararData,
    {},
  );

  return (
    <form action={enviar} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="data" className="text-sm font-medium">
          Data do culto
        </label>
        <input
          id="data"
          name="data"
          type="date"
          required
          defaultValue={dataInicial}
          max={hoje}
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}

      <Botao />
    </form>
  );
}

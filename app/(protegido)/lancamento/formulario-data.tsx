"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alerta } from "@/components/alerta";
import { classesCampo, classesRotulo } from "@/components/ui/base";
import { classesBotao } from "@/components/ui/botao";

import { prepararData, type EstadoData } from "./acoes";

function Botao() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={classesBotao()}
    >
      {pending ? "Carregando…" : "Abrir data"}
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="data" className={classesRotulo}>
            Data do culto
          </label>
          <input
            id="data"
            name="data"
            type="date"
            required
            defaultValue={dataInicial}
            max={hoje}
            className={classesCampo}
          />
        </div>

        <Botao />
      </div>

      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}
    </form>
  );
}

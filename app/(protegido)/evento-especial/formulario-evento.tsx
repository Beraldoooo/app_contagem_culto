"use client";

import { useActionState, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Alerta } from "@/components/alerta";
import { Campo } from "@/components/campo";

import { criarEventoEspecial, type EstadoEvento } from "./acoes";

function Botao() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-lg bg-blue-600 px-4 text-base font-medium text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
    >
      {pending ? "Salvando…" : "Criar evento"}
    </button>
  );
}

type Linha = { id: number; valor: string };

export function FormularioEvento({ dataInicial }: { dataInicial: string }) {
  const [estado, enviar] = useActionState<EstadoEvento, FormData>(
    criarEventoEspecial,
    {},
  );
  // O primeiro id é sempre 0, então servidor e cliente renderizam igual. O
  // contador vive no componente — um `let` no módulo seria compartilhado entre
  // requisições no servidor e quebraria a hidratação.
  const [horarios, setHorarios] = useState<Linha[]>([{ id: 0, valor: "" }]);
  const proximoId = useRef(1);
  const idBase = useId();

  function alterar(id: number, valor: string) {
    setHorarios((atual) =>
      atual.map((h) => (h.id === id ? { ...h, valor } : h)),
    );
  }

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <Campo
        rotulo="Nome do evento"
        name="nome"
        type="text"
        required
        maxLength={120}
        placeholder="Culto de Homens"
        autoComplete="off"
      />

      <Campo rotulo="Data" name="data" type="date" required defaultValue={dataInicial} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">Horários</legend>

        {horarios.map((horario, indice) => (
          <div key={horario.id} className="flex items-center gap-2">
            <label htmlFor={`${idBase}-${horario.id}`} className="sr-only">
              {`Horário ${indice + 1}`}
            </label>
            <input
              id={`${idBase}-${horario.id}`}
              name="horario"
              type="time"
              required
              value={horario.valor}
              onChange={(e) => alterar(horario.id, e.target.value)}
              className="h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-950"
            />
            <button
              type="button"
              onClick={() =>
                setHorarios((atual) => atual.filter((h) => h.id !== horario.id))
              }
              disabled={horarios.length === 1}
              aria-label={`Remover horário ${indice + 1}`}
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Remover
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            setHorarios((atual) => [
              ...atual,
              { id: proximoId.current++, valor: "" },
            ])
          }
          className="h-11 rounded-lg border border-dashed border-slate-400 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          + Adicionar horário
        </button>
      </fieldset>

      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}

      <Botao />
    </form>
  );
}

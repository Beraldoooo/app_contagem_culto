"use client";

import { useActionState, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Alerta } from "@/components/alerta";
import { Campo } from "@/components/campo";
import { IconeFechar } from "@/components/icones";
import { classesCampo, classesRotulo } from "@/components/ui/base";
import { classesBotao } from "@/components/ui/botao";

import { criarEventoEspecial, type EstadoEvento } from "./acoes";

function Botao() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={classesBotao({ larguraTotal: true })}
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
    <form action={enviar} className="flex flex-col gap-5">
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
        <legend className={`mb-1.5 ${classesRotulo}`}>Horários</legend>

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
              className={`${classesCampo} flex-1`}
            />
            <button
              type="button"
              onClick={() =>
                setHorarios((atual) => atual.filter((h) => h.id !== horario.id))
              }
              disabled={horarios.length === 1}
              aria-label={`Remover horário ${indice + 1}`}
              className={`${classesBotao({ variante: "secundario" })} w-11 px-0`}
            >
              <IconeFechar tamanho={18} />
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
          className="h-11 rounded-campo border border-dashed border-borda-forte text-sm font-medium text-marca-texto transition hover:bg-marca-suave"
        >
          + Adicionar horário
        </button>
      </fieldset>

      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}

      <Botao />
    </form>
  );
}

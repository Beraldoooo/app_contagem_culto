"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alerta } from "@/components/alerta";
import { classesBotao } from "@/components/ui/botao";

import { prepararData, type EstadoData } from "./acoes";

function Enviar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={classesBotao({ larguraTotal: true })}>
      {pending ? "Abrindo…" : rotulo}
    </button>
  );
}

/**
 * Cria os horários fixos de uma data que ainda não tinha sido aberta — quem
 * chega por um link (do Histórico, por exemplo) não passou pelo "Abrir data".
 */
export function AbrirHorarios({ data, rotulo }: { data: string; rotulo: string }) {
  const [estado, acao] = useActionState<EstadoData, FormData>(prepararData, {});
  return (
    <form action={acao} className="mt-4 flex flex-col gap-2">
      <input type="hidden" name="data" value={data} />
      <Enviar rotulo={rotulo} />
      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alerta } from "@/components/alerta";
import { Cartao } from "@/components/ui/base";
import { classesBotao } from "@/components/ui/botao";

import { marcarSemCulto, type EstadoContagem } from "./acoes";

function Enviar({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={classesBotao({ variante: "secundario", larguraTotal: true })}
    >
      {pending ? "Salvando…" : children}
    </button>
  );
}

/**
 * "Não teve culto" fica acima da ficha, para quem chega num horário que não
 * aconteceu não precisar rolar a tela inteira para achar.
 * Não pede confirmação: desfazer é um toque, nada se perde.
 */
export function BotaoSemCulto({ eventoId }: { eventoId: string }) {
  const [estado, acao] = useActionState<EstadoContagem, FormData>(marcarSemCulto, {});

  return (
    <form action={acao} className="flex flex-col gap-2">
      <input type="hidden" name="evento_id" value={eventoId} />
      <input type="hidden" name="sem_culto" value="1" />
      <Enviar>Não teve culto neste horário</Enviar>
      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}
    </form>
  );
}

/** O que aparece no lugar da ficha quando o horário está marcado. */
export function AvisoSemCulto({
  eventoId,
  nomeCulto,
  podeEditar,
}: {
  eventoId: string;
  nomeCulto: string;
  podeEditar: boolean;
}) {
  const [estado, acao] = useActionState<EstadoContagem, FormData>(marcarSemCulto, {});

  return (
    <Cartao as="section" className="flex flex-col gap-3">
      <p className="text-sm">
        <strong className="font-semibold">{nomeCulto}</strong>: não teve culto.
      </p>
      <p className="text-xs text-texto-3">
        Fica fora da comparação de crescimento, sem contar como pendente nem como zero.
      </p>
      {podeEditar ? (
        <form action={acao} className="flex flex-col gap-2">
          <input type="hidden" name="evento_id" value={eventoId} />
          <input type="hidden" name="sem_culto" value="0" />
          <Enviar>Teve culto, sim — desfazer</Enviar>
          {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}
        </form>
      ) : null}
    </Cartao>
  );
}

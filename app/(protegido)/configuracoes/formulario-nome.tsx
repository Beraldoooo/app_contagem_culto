"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alerta } from "@/components/alerta";
import { classesCampo } from "@/components/ui/base";
import { classesBotao } from "@/components/ui/botao";
import { salvarNome, type EstadoFormulario } from "@/lib/auth/acoes";

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={classesBotao({ variante: "secundario" })}>
      {pending ? "Salvando…" : "Salvar"}
    </button>
  );
}

export function FormularioNome({ nomeAtual }: { nomeAtual: string | null }) {
  const [estado, acao] = useActionState<EstadoFormulario, FormData>(salvarNome, {});

  return (
    <form action={acao} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="nome" className="sr-only">
          Nome de exibição
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          maxLength={60}
          autoComplete="nickname"
          defaultValue={nomeAtual ?? ""}
          placeholder="Como você quer aparecer no app"
          className={classesCampo}
        />
        <Botao />
      </div>
      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}
      {estado.aviso ? <Alerta tom="info">{estado.aviso}</Alerta> : null}
    </form>
  );
}

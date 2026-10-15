"use client";

import { useActionState } from "react";

import { Alerta } from "@/components/alerta";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Campo } from "@/components/campo";
import { pedirRecuperacao, type EstadoFormulario } from "@/lib/auth/acoes";

export function FormularioRecuperacao() {
  const [estado, acao] = useActionState<EstadoFormulario, FormData>(
    pedirRecuperacao,
    {},
  );

  if (estado.aviso) {
    return <Alerta tom="info">{estado.aviso}</Alerta>;
  }

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Campo
        rotulo="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        placeholder="voce@exemplo.com"
      />

      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}

      <BotaoEnviar carregando="Enviando…">Enviar link</BotaoEnviar>
    </form>
  );
}

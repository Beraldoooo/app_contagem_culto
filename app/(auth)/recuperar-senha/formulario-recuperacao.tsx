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

  // O formulário continua na tela depois do aviso: quem digitou o e-mail
  // errado pede de novo ali mesmo, sem recarregar a página.
  return (
    <div className="flex flex-col gap-4">
      {estado.aviso ? (
        <div className="flex flex-col gap-2">
          <Alerta tom="info">{estado.aviso}</Alerta>
          <p className="text-sm text-texto-2">
            Não chegou ou digitou errado? Informe o e-mail de novo abaixo.
          </p>
        </div>
      ) : null}

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

        <BotaoEnviar carregando="Enviando…">
          {estado.aviso ? "Enviar de novo" : "Enviar link"}
        </BotaoEnviar>
      </form>
    </div>
  );
}

"use client";

import { useActionState } from "react";

import { Alerta } from "@/components/alerta";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Campo } from "@/components/campo";
import { cadastrar, type EstadoFormulario } from "@/lib/auth/acoes";

export function FormularioCadastro() {
  const [estado, acao] = useActionState<EstadoFormulario, FormData>(
    cadastrar,
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

      <Campo
        rotulo="Senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        required
        minLength={6}
        dica="Mínimo de 6 caracteres."
      />

      <Campo
        rotulo="Confirmar senha"
        name="confirmacao"
        type="password"
        autoComplete="new-password"
        required
        minLength={6}
      />

      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}

      <BotaoEnviar carregando="Criando…">Criar conta</BotaoEnviar>
    </form>
  );
}

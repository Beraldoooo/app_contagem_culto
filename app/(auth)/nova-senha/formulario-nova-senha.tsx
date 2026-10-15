"use client";

import { useActionState } from "react";

import { Alerta } from "@/components/alerta";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Campo } from "@/components/campo";
import { LinkBotao } from "@/components/ui/botao";
import { definirNovaSenha, type EstadoFormulario } from "@/lib/auth/acoes";

export function FormularioNovaSenha() {
  const [estado, acao] = useActionState<EstadoFormulario, FormData>(
    definirNovaSenha,
    {},
  );

  if (estado.aviso) {
    return (
      <div className="flex flex-col gap-4">
        <Alerta tom="info">{estado.aviso}</Alerta>
        <LinkBotao href="/" larguraTotal>
          Ir para o início
        </LinkBotao>
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Campo
        rotulo="Nova senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        required
        minLength={6}
        dica="Mínimo de 6 caracteres."
      />

      <Campo
        rotulo="Confirmar nova senha"
        name="confirmacao"
        type="password"
        autoComplete="new-password"
        required
        minLength={6}
      />

      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}

      <BotaoEnviar carregando="Salvando…">Salvar nova senha</BotaoEnviar>
    </form>
  );
}

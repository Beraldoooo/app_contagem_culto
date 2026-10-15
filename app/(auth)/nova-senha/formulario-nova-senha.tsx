"use client";

import { useActionState } from "react";

import { Alerta } from "@/components/alerta";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Campo } from "@/components/campo";
import { LinkBotao } from "@/components/ui/botao";
import { definirNovaSenha, type EstadoFormulario } from "@/lib/auth/acoes";

export function FormularioNovaSenha({
  daConfiguracoes = false,
}: {
  daConfiguracoes?: boolean;
}) {
  const [estado, acao] = useActionState<EstadoFormulario, FormData>(
    definirNovaSenha,
    {},
  );

  const voltar = daConfiguracoes
    ? { href: "/configuracoes" as const, rotulo: "Voltar para Configurações" }
    : { href: "/" as const, rotulo: "Ir para o início" };

  if (estado.aviso) {
    return (
      <div className="flex flex-col gap-4">
        <Alerta tom="info">{estado.aviso}</Alerta>
        <LinkBotao href={voltar.href} larguraTotal>
          {voltar.rotulo}
        </LinkBotao>
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-4">
      {/* Diz à ação de onde veio: muda o texto de sessão expirada, que no
          fluxo do e-mail manda pedir um link novo. */}
      {daConfiguracoes ? (
        <input type="hidden" name="origem" value="configuracoes" />
      ) : null}

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

      {daConfiguracoes ? (
        <LinkBotao href="/configuracoes" variante="discreto" larguraTotal>
          Cancelar
        </LinkBotao>
      ) : null}
    </form>
  );
}

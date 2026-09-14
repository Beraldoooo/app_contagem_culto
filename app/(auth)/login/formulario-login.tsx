"use client";

import { useActionState } from "react";

import { Alerta } from "@/components/alerta";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Campo } from "@/components/campo";
import { entrar, type EstadoFormulario } from "@/lib/auth/acoes";

export function FormularioLogin({ destino }: { destino: string }) {
  const [estado, acao] = useActionState<EstadoFormulario, FormData>(entrar, {});

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="redirecionar" value={destino} />

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
        autoComplete="current-password"
        required
      />

      <label className="flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          name="lembrar"
          defaultChecked
          className="size-4 rounded border-slate-300 accent-blue-600 dark:border-slate-700"
        />
        Manter-me conectado neste aparelho
      </label>

      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}

      <BotaoEnviar carregando="Entrando…">Entrar</BotaoEnviar>
    </form>
  );
}

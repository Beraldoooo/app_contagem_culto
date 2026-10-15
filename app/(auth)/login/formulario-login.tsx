"use client";

import Link from "next/link";
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

      <div className="-mt-1 flex justify-end">
        <Link
          href="/recuperar-senha"
          className="text-sm font-medium text-marca-texto underline-offset-4 hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-texto-2">
        <input
          type="checkbox"
          name="lembrar"
          defaultChecked
          className="size-4 accent-marca"
        />
        Manter-me conectado neste aparelho
      </label>

      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}

      <BotaoEnviar carregando="Entrando…">Entrar</BotaoEnviar>
    </form>
  );
}

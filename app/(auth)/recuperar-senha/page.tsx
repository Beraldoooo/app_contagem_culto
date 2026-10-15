import type { Metadata } from "next";
import Link from "next/link";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { Cartao } from "@/components/ui/base";
import { hasSupabaseEnv } from "@/lib/supabase/env";

import { FormularioRecuperacao } from "./formulario-recuperacao";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function RecuperarSenhaPage() {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  return (
    <Cartao as="main" className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Esqueci minha senha</h1>
        <p className="text-sm text-texto-2">
          Informe o e-mail da sua conta. Vamos mandar um link para você criar
          uma senha nova.
        </p>
      </div>

      <FormularioRecuperacao />

      <p className="text-center text-sm text-texto-2">
        Lembrou?{" "}
        <Link
          href="/login"
          className="font-semibold text-marca-texto underline-offset-4 hover:underline"
        >
          Voltar para o login
        </Link>
      </p>
    </Cartao>
  );
}

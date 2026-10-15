import type { Metadata } from "next";
import Link from "next/link";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { Cartao } from "@/components/ui/base";
import { hasSupabaseEnv } from "@/lib/supabase/env";

import { FormularioCadastro } from "./formulario-cadastro";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastroPage() {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  return (
    <Cartao as="main" className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Criar conta</h1>
        <p className="text-sm text-texto-2">
          Qualquer pessoa pode se cadastrar, mas o acesso só é liberado depois
          que o Administrador Geral aprovar.
        </p>
      </div>

      <FormularioCadastro />

      <p className="text-center text-sm text-texto-2">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-marca-texto underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </Cartao>
  );
}

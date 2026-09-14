import type { Metadata } from "next";
import Link from "next/link";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { hasSupabaseEnv } from "@/lib/supabase/env";

import { FormularioCadastro } from "./formulario-cadastro";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastroPage() {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Qualquer pessoa pode se cadastrar, mas o acesso só é liberado depois
          que o Administrador Geral aprovar.
        </p>
      </div>

      <FormularioCadastro />

      <p className="text-sm text-slate-600 dark:text-slate-400">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-medium text-blue-700 underline underline-offset-4 dark:text-blue-400"
        >
          Entrar
        </Link>
      </p>
    </main>
  );
}

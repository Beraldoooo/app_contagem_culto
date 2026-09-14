import type { Metadata } from "next";
import Link from "next/link";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { hasSupabaseEnv } from "@/lib/supabase/env";

import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const { redirecionar } = await searchParams;
  const destino = typeof redirecionar === "string" ? redirecionar : "/";

  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Acesse para lançar e consultar as contagens.
        </p>
      </div>

      <FormularioLogin destino={destino} />

      <p className="text-sm text-slate-600 dark:text-slate-400">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="font-medium text-blue-700 underline underline-offset-4 dark:text-blue-400"
        >
          Criar conta
        </Link>
      </p>
    </main>
  );
}

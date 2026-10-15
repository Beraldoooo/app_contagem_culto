import type { Metadata } from "next";
import Link from "next/link";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { Cartao } from "@/components/ui/base";
import { hasSupabaseEnv } from "@/lib/supabase/env";

import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const { redirecionar } = await searchParams;
  const destino = typeof redirecionar === "string" ? redirecionar : "/";

  return (
    <Cartao as="main" className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
        <p className="text-sm text-texto-2">
          Acesse para lançar e consultar as contagens.
        </p>
      </div>

      <FormularioLogin destino={destino} />

      <p className="text-center text-sm text-texto-2">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="font-semibold text-marca-texto underline-offset-4 hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </Cartao>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { obterSessaoAtual, podeLancar } from "@/lib/auth/perfil";
import { ehDataValida, hojeISO } from "@/lib/datas";
import { hasSupabaseEnv } from "@/lib/supabase/env";

import { FormularioEvento } from "./formulario-evento";

export const metadata: Metadata = { title: "Novo evento especial" };

export default async function EventoEspecialPage({
  searchParams,
}: PageProps<"/evento-especial">) {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");
  if (!podeLancar(sessao.perfil)) redirect("/");

  const { data: dataParam } = await searchParams;
  const dataInicial =
    typeof dataParam === "string" && ehDataValida(dataParam)
      ? dataParam
      : hojeISO();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex flex-col gap-1">
        <Link
          href="/"
          className="text-sm text-slate-600 underline underline-offset-4 dark:text-slate-400"
        >
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Novo evento especial
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Para datas fora da rotina — Culto de Homens numa terça, evento anual
          de sábado. Entra no histórico como qualquer culto, mas fica de fora do
          comparativo de frequência regular.
        </p>
      </header>

      <FormularioEvento dataInicial={dataInicial} />
    </main>
  );
}

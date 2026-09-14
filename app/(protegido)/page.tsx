import Link from "next/link";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { obterSessaoAtual, podeLancar, ROTULO_ROLE } from "@/lib/auth/perfil";
import { hasSupabaseEnv } from "@/lib/supabase/env";

import { ResumoDoDia } from "./resumo-do-dia";

export default async function Home() {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  // O layout de (protegido) já garantiu sessão válida e status aprovado.
  const sessao = await obterSessaoAtual();
  const perfil = sessao?.perfil ?? null;
  const lanca = podeLancar(perfil);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Contagem Culto</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {perfil ? `Você entrou como ${ROTULO_ROLE[perfil.role]}.` : ""}
        </p>
      </header>

      <ResumoDoDia />

      <div className="flex flex-col gap-2">
        <Link
          href="/lancamento"
          className="flex h-12 items-center justify-center rounded-xl bg-blue-600 px-4 text-base font-medium text-white transition hover:bg-blue-700"
        >
          {lanca ? "Lançar contagem" : "Ver contagens"}
        </Link>
        {lanca ? (
          <Link
            href="/evento-especial"
            className="flex h-12 items-center justify-center rounded-xl border border-slate-300 px-4 text-base font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Novo evento especial
          </Link>
        ) : null}
        <Link
          href="/historico"
          className="flex h-12 items-center justify-center rounded-xl border border-slate-300 px-4 text-base font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Histórico
        </Link>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { EncerrarSessao } from "./encerrar-sessao";

export const metadata: Metadata = { title: "Acesso negado" };

export default function AcessoNegadoPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-10">
      <div className="flex flex-col gap-2">
        <span
          aria-hidden
          className="flex size-11 items-center justify-center rounded-full bg-red-100 text-xl dark:bg-red-950/60"
        >
          🚫
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Acesso negado</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Esta conta foi bloqueada pelo Administrador Geral e não pode acessar o
          aplicativo. Se você acha que houve engano, procure o responsável pela
          contagem.
        </p>
      </div>

      <EncerrarSessao />

      <Link
        href="/login"
        className="flex h-11 items-center justify-center rounded-lg bg-slate-900 px-4 text-base font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
      >
        Voltar para o login
      </Link>
    </main>
  );
}

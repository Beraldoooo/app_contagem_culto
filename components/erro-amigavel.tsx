"use client";

import Link from "next/link";

/**
 * Tela mostrada quando algo quebra. Fala do que a pessoa pode fazer, não do
 * que o servidor achou — a mensagem técnica fica no console.
 */
export function ErroAmigavel({
  titulo = "Algo deu errado",
  descricao = "Não conseguimos carregar esta tela. Pode ter sido uma falha momentânea de conexão.",
  aoTentarNovamente,
}: {
  titulo?: string;
  descricao?: string;
  aoTentarNovamente?: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-5 py-10">
      <span
        aria-hidden
        className="flex size-11 items-center justify-center rounded-full bg-amber-100 text-xl dark:bg-amber-950/60"
      >
        ⚠️
      </span>
      <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">{descricao}</p>

      <div className="flex flex-col gap-2">
        {aoTentarNovamente ? (
          <button
            type="button"
            onClick={aoTentarNovamente}
            className="h-11 rounded-lg bg-blue-600 px-4 text-base font-medium text-white transition hover:bg-blue-700"
          >
            Tentar de novo
          </button>
        ) : null}
        <Link
          href="/"
          className="flex h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-base font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Voltar ao início
        </Link>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-500">
        Se continuar acontecendo, avise o responsável pelo aplicativo.
      </p>
    </main>
  );
}

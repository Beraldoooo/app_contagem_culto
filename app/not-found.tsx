import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NaoEncontrada() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-5 py-10">
      <span
        aria-hidden
        className="flex size-11 items-center justify-center rounded-full bg-slate-200 text-xl dark:bg-slate-800"
      >
        🔍
      </span>
      <h1 className="text-xl font-semibold tracking-tight">
        Página não encontrada
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        O endereço que você abriu não existe. Pode ter sido um link antigo ou um
        erro de digitação.
      </p>
      <Link
        href="/"
        className="flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-base font-medium text-white transition hover:bg-blue-700"
      >
        Voltar ao início
      </Link>
    </main>
  );
}

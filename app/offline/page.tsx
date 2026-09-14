import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sem conexão",
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold">Você está sem conexão</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Reconecte-se à internet para lançar ou consultar contagens.
      </p>
    </main>
  );
}

import { sair } from "@/lib/auth/acoes";

export function BotaoSair({ variante = "texto" }: { variante?: "texto" | "solido" }) {
  const classe =
    variante === "solido"
      ? "h-11 rounded-lg bg-slate-900 px-4 text-base font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
      : "text-sm font-medium text-slate-600 underline underline-offset-4 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100";

  return (
    <form action={sair}>
      <button type="submit" className={classe}>
        Sair
      </button>
    </form>
  );
}

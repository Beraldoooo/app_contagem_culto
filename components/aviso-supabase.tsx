/**
 * Mostrado quando faltam as variáveis do Supabase — evita uma tela de erro
 * críptica em quem acabou de clonar o projeto.
 */
export function AvisoSupabase() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-5 py-10">
      <h1 className="text-xl font-semibold">Supabase não configurado</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Copie <code className="rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-800">.env.local.example</code>{" "}
        para <code className="rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-800">.env.local</code>, preencha{" "}
        <code className="rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-800">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
        <code className="rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-800">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
        e reinicie o servidor.
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Rode também <code className="rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-800">supabase/schema.sql</code>{" "}
        no SQL Editor do seu projeto.
      </p>
    </main>
  );
}

import { AvisoSupabase } from "@/components/aviso-supabase";
import Link from "next/link";

import { obterSessaoAtual, podeLancar, ROTULO_ROLE } from "@/lib/auth/perfil";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function Home() {
  // O layout de (protegido) já garantiu sessão válida e status aprovado, mas o
  // Next renderiza este segmento por conta própria — a guarda tem que existir
  // aqui também.
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const sessao = await obterSessaoAtual();
  const perfil = sessao?.perfil ?? null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Contagem Culto
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {perfil ? `Você entrou como ${ROTULO_ROLE[perfil.role]}.` : ""}
        </p>
      </header>

      {podeLancar(perfil) ? (
        <div className="flex flex-col gap-2">
          <Link
            href="/lancamento"
            className="flex h-12 items-center justify-center rounded-xl bg-blue-600 px-4 text-base font-medium text-white transition hover:bg-blue-700"
          >
            Novo lançamento
          </Link>
          <Link
            href="/evento-especial"
            className="flex h-12 items-center justify-center rounded-xl border border-slate-300 px-4 text-base font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Novo evento especial
          </Link>
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-medium">O que já funciona</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          <Item ok label="Cadastro, login e “lembrar-me”" />
          <Item ok label="Aprovação pelo administrador (pendente / banido)" />
          <Item ok label="Proteção de rotas e RLS no banco" />
          <Item
            ok={false}
            label={
              podeLancar(perfil)
                ? "Lançamento de contagem — próxima etapa"
                : "Consulta de histórico e comparativo — próxima etapa"
            }
          />
        </ul>
      </section>

      <p className="text-xs text-slate-500 dark:text-slate-500">
        Próximo passo: telas de lançamento por data/horário, soma do dia e
        comparativo com os cultos anteriores.
      </p>
    </main>
  );
}

function Item({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        className={`inline-block size-2 shrink-0 rounded-full ${
          ok ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
        }`}
      />
      <span>{label}</span>
    </li>
  );
}

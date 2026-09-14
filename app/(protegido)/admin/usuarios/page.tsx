import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { obterSessaoAtual } from "@/lib/auth/perfil";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

import { LinhaUsuario } from "./linha-usuario";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsuariosPage() {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  // Terceira barreira, depois do proxy e da RLS: se alguém chegar aqui sem ser
  // admin, não renderiza a tela.
  if (sessao.perfil?.role !== "admin_geral" || sessao.perfil.status !== "aprovado") {
    redirect("/");
  }

  const supabase = await createClient();

  // A RLS decide o que vem: só um admin_geral recebe mais que a própria linha.
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  const usuarios: Profile[] = data ?? [];

  const pendentes = usuarios.filter((u) => u.status === "pendente");
  const ativos = usuarios.filter((u) => u.status === "aprovado");
  const banidos = usuarios.filter((u) => u.status === "banido");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex flex-col gap-1">
        <Link
          href="/"
          className="text-sm text-slate-600 underline underline-offset-4 dark:text-slate-400"
        >
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Usuários</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Aprove quem se cadastrou, defina papéis e controle o acesso.
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          Não foi possível carregar a lista de usuários.
        </p>
      ) : null}

      <Secao
        titulo="Aguardando aprovação"
        contagem={pendentes.length}
        vazio="Ninguém aguardando no momento."
        destaque
      >
        {pendentes.map((perfil) => (
          <LinhaUsuario
            key={perfil.id}
            perfil={perfil}
            souEu={perfil.id === sessao.usuarioId}
          />
        ))}
      </Secao>

      <Secao
        titulo="Com acesso"
        contagem={ativos.length}
        vazio="Nenhum usuário ativo."
      >
        {ativos.map((perfil) => (
          <LinhaUsuario
            key={perfil.id}
            perfil={perfil}
            souEu={perfil.id === sessao.usuarioId}
          />
        ))}
      </Secao>

      {banidos.length > 0 ? (
        <Secao titulo="Banidos" contagem={banidos.length} vazio="">
          {banidos.map((perfil) => (
            <LinhaUsuario
              key={perfil.id}
              perfil={perfil}
              souEu={perfil.id === sessao.usuarioId}
            />
          ))}
        </Secao>
      ) : null}
    </main>
  );
}

function Secao({
  titulo,
  contagem,
  vazio,
  destaque,
  children,
}: {
  titulo: string;
  contagem: number;
  vazio: string;
  destaque?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        {titulo}
        {contagem > 0 ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              destaque
                ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {contagem}
          </span>
        ) : null}
      </h2>

      {contagem === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{vazio}</p>
      ) : (
        <ul className="flex flex-col gap-3">{children}</ul>
      )}
    </section>
  );
}

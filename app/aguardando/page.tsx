import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Alerta } from "@/components/alerta";
import { AvisoSupabase } from "@/components/aviso-supabase";
import { BotaoSair } from "@/components/botao-sair";
import { obterSessaoAtual, ROTULO_ROLE, ROTULO_STATUS } from "@/lib/auth/perfil";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Aguardando aprovação" };

export default async function AguardandoPage() {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");
  if (sessao.perfil?.status === "banido") redirect("/acesso-negado");
  if (sessao.perfil?.status === "aprovado") redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-10">
      <div className="flex flex-col gap-2">
        <span
          aria-hidden
          className="flex size-11 items-center justify-center rounded-full bg-amber-100 text-xl dark:bg-amber-950/60"
        >
          ⏳
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">
          Aguardando aprovação
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sua conta foi criada, mas o Administrador Geral ainda precisa liberar
          o acesso. Assim que isso acontecer, é só entrar de novo.
        </p>
      </div>

      <dl className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-500 dark:text-slate-400">Conta</dt>
          <dd className="truncate font-medium">{sessao.email}</dd>
        </div>
        {sessao.perfil ? (
          <>
            <div className="mt-2 flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Perfil</dt>
              <dd className="font-medium">{ROTULO_ROLE[sessao.perfil.role]}</dd>
            </div>
            <div className="mt-2 flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Situação</dt>
              <dd className="font-medium">
                {ROTULO_STATUS[sessao.perfil.status]}
              </dd>
            </div>
          </>
        ) : null}
      </dl>

      {!sessao.perfil ? (
        <Alerta tom="aviso">
          Não encontramos seu perfil no banco. Confirme que o
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 text-xs dark:bg-amber-950/60">
            supabase/schema.sql
          </code>
          foi executado — é o trigger <code>handle_new_user</code> que cria essa
          linha no cadastro.
        </Alerta>
      ) : null}

      <BotaoSair variante="solido" />
    </main>
  );
}

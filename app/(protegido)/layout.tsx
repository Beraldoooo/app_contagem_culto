import Link from "next/link";
import { redirect } from "next/navigation";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { BotaoSair } from "@/components/botao-sair";
import { ehAdmin, obterSessaoAtual, ROTULO_ROLE } from "@/lib/auth/perfil";
import { hasSupabaseEnv } from "@/lib/supabase/env";

/**
 * Portaria das telas internas.
 *
 * O proxy já barrou quem não tem sessão; aqui checamos o *status* do perfil,
 * que exige uma consulta ao banco. A RLS continua sendo a garantia real: um
 * usuário pendente ou banido não lê dado nenhum mesmo que chegue à tela.
 */
export default async function ProtegidoLayout({ children }: LayoutProps<"/">) {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  const status = sessao.perfil?.status;
  if (status === "banido") redirect("/acesso-negado");
  if (status !== "aprovado") redirect("/aguardando");

  return (
    <>
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 py-3">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{sessao.email}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {sessao.perfil ? ROTULO_ROLE[sessao.perfil.role] : ""}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {ehAdmin(sessao.perfil) ? (
              <Link
                href="/admin/usuarios"
                className="text-sm font-medium text-blue-700 underline underline-offset-4 dark:text-blue-400"
              >
                Usuários
              </Link>
            ) : null}
            <BotaoSair />
          </div>
        </div>
      </header>
      {children}
    </>
  );
}

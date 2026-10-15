import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { Cartao } from "@/components/ui/base";
import { obterSessaoAtual } from "@/lib/auth/perfil";
import { hasSupabaseEnv } from "@/lib/supabase/env";

import { FormularioNovaSenha } from "./formulario-nova-senha";

export const metadata: Metadata = { title: "Nova senha" };

/**
 * Onde o link de "esqueci minha senha" termina (a sessão nasce em
 * /auth/confirm) e também o "Alterar senha" de Configurações. Exige sessão:
 * sem ela o proxy manda para o login.
 */
export default async function NovaSenhaPage() {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  return (
    <Cartao as="main" className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Criar nova senha</h1>
        <p className="text-sm text-texto-2">
          Para a conta <span className="font-medium text-texto">{sessao.email}</span>.
        </p>
      </div>

      <FormularioNovaSenha />
    </Cartao>
  );
}

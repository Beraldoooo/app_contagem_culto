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
export default async function NovaSenhaPage({
  searchParams,
}: PageProps<"/nova-senha">) {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  // Esta tela usa o layout de login (sem menu lateral nem barra inferior).
  // Quem veio de Configurações precisa de uma saída daqui: sem isso, desistir
  // da troca só era possível pelo botão de voltar do navegador.
  const { origem } = await searchParams;
  const daConfiguracoes = origem === "configuracoes";

  return (
    <Cartao as="main" className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {daConfiguracoes ? "Alterar senha" : "Criar nova senha"}
        </h1>
        <p className="text-sm text-texto-2">
          Para a conta <span className="font-medium text-texto">{sessao.email}</span>.
        </p>
      </div>

      <FormularioNovaSenha daConfiguracoes={daConfiguracoes} />
    </Cartao>
  );
}

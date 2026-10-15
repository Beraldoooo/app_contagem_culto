import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Alerta } from "@/components/alerta";
import { AvisoSupabase } from "@/components/aviso-supabase";
import { BotaoSair } from "@/components/botao-sair";
import { IconeRelogio } from "@/components/icones";
import { Selo } from "@/components/ui/base";
import { TelaCentralizada } from "@/components/ui/tela-centralizada";
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
    <TelaCentralizada
      icone={IconeRelogio}
      tom="aviso"
      titulo="Aguardando aprovação"
      descricao="Sua conta foi criada, mas o Administrador Geral ainda precisa liberar o acesso. Assim que isso acontecer, é só entrar de novo."
    >
      <dl className="flex flex-col gap-2 rounded-campo bg-superficie-suave p-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-texto-2">Conta</dt>
          <dd className="truncate font-medium">{sessao.email}</dd>
        </div>
        {sessao.perfil ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-texto-2">Perfil</dt>
              <dd className="font-medium">{ROTULO_ROLE[sessao.perfil.role]}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-texto-2">Situação</dt>
              <dd>
                <Selo tom="aviso">{ROTULO_STATUS[sessao.perfil.status]}</Selo>
              </dd>
            </div>
          </>
        ) : null}
      </dl>

      {!sessao.perfil ? (
        <Alerta tom="aviso">
          Não encontramos seu perfil no banco. Confirme que o
          <code className="mx-1 text-xs">supabase/schema.sql</code>
          foi executado — é o trigger <code>handle_new_user</code> que cria essa
          linha no cadastro.
        </Alerta>
      ) : null}

      <BotaoSair variante="solido" />
    </TelaCentralizada>
  );
}

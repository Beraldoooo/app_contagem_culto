import { redirect } from "next/navigation";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { Marca } from "@/components/marca";
import { BarraInferior } from "@/components/navegacao/barra-inferior";
import { BlocoConta } from "@/components/navegacao/bloco-conta";
import type { Permissoes } from "@/components/navegacao/itens";
import { MenuLateral } from "@/components/navegacao/menu-lateral";
import {
  ehAdmin,
  nomeDeExibicao,
  obterSessaoAtual,
  podeLancar,
  ROTULO_ROLE,
} from "@/lib/auth/perfil";
import { hasSupabaseEnv } from "@/lib/supabase/env";

/**
 * Portaria e moldura das telas internas.
 *
 * O proxy já barrou quem não tem sessão; aqui checamos o *status* do perfil,
 * que exige uma consulta ao banco. A RLS continua sendo a garantia real: um
 * usuário pendente ou banido não lê dado nenhum mesmo que chegue à tela.
 *
 * Desktop: menu lateral fixo. Celular: barra fixa embaixo.
 */
export default async function ProtegidoLayout({ children }: LayoutProps<"/">) {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  const status = sessao.perfil?.status;
  if (status === "banido") redirect("/acesso-negado");
  if (status !== "aprovado") redirect("/aguardando");

  const permissoes: Permissoes = {
    lanca: podeLancar(sessao.perfil),
    admin: ehAdmin(sessao.perfil),
  };

  const conta = (
    <BlocoConta
      nome={nomeDeExibicao(sessao.perfil)}
      papel={sessao.perfil ? ROTULO_ROLE[sessao.perfil.role] : ""}
    />
  );

  return (
    <div className="flex flex-1 flex-col">
      <MenuLateral permissoes={permissoes} conta={conta} />

      {/* Espaço embaixo para a barra fixa do celular não cobrir o conteúdo. */}
      <div className="flex flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-64">
        <header className="flex h-14 items-center border-b border-borda bg-superficie px-4 sm:px-6 lg:hidden">
          <Marca />
        </header>
        {children}
      </div>

      <BarraInferior permissoes={permissoes} conta={conta} />
    </div>
  );
}

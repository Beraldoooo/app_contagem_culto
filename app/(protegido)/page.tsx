import { AvisoSupabase } from "@/components/aviso-supabase";
import { IconeMais } from "@/components/icones";
import { CabecalhoPagina, Pagina } from "@/components/ui/base";
import { LinkBotao } from "@/components/ui/botao";
import { obterSessaoAtual, podeLancar, ROTULO_ROLE } from "@/lib/auth/perfil";
import { hasSupabaseEnv } from "@/lib/supabase/env";

import { ResumoDoDia } from "./resumo-do-dia";

export default async function Home() {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  // O layout de (protegido) já garantiu sessão válida e status aprovado.
  const sessao = await obterSessaoAtual();
  const perfil = sessao?.perfil ?? null;

  return (
    <Pagina>
      <CabecalhoPagina
        titulo="Início"
        descricao={perfil ? `Você entrou como ${ROTULO_ROLE[perfil.role]}.` : undefined}
        acao={
          podeLancar(perfil) ? (
            <LinkBotao href="/lancamento" className="hidden sm:inline-flex">
              <IconeMais tamanho={18} />
              Lançar contagem
            </LinkBotao>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ResumoDoDia />
      </div>
    </Pagina>
  );
}

import { AvisoSupabase } from "@/components/aviso-supabase";
import { IconeMais } from "@/components/icones";
import { CabecalhoPagina, Pagina } from "@/components/ui/base";
import { LinkBotao } from "@/components/ui/botao";
import { obterSessaoAtual, podeLancar, ROTULO_ROLE } from "@/lib/auth/perfil";
import { hasSupabaseEnv } from "@/lib/supabase/env";

import { ResumoDoDia } from "./resumo-do-dia";
import { TendenciaSemanal } from "./tendencia-semanal";
import { GraficoComparativo, type TotalGrafico } from "./grafico-comparativo";
import { SeletorTotal } from "./seletor-total";

export default async function Home({ searchParams }: PageProps<"/">) {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  // O layout de (protegido) já garantiu sessão válida e status aprovado.
  const sessao = await obterSessaoAtual();
  const perfil = sessao?.perfil ?? null;
  const { total: totalParam } = await searchParams;
  const total: TotalGrafico = totalParam === "detalhado" ? "detalhado" : "simples";

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

      <div className="flex flex-col gap-6">
        <ResumoDoDia />
        <TendenciaSemanal />
        <section className="flex flex-col gap-3" aria-label="Frequência por dia de culto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-texto-2">Frequência por dia de culto</h2>
            <SeletorTotal atual={total} />
          </div>
          <GraficoComparativo total={total} />
        </section>
      </div>
    </Pagina>
  );
}

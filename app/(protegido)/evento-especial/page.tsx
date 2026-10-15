import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { CabecalhoPagina, Cartao, Pagina } from "@/components/ui/base";
import { obterSessaoAtual, podeLancar } from "@/lib/auth/perfil";
import { ehDataValida, hojeISO } from "@/lib/datas";
import { hasSupabaseEnv } from "@/lib/supabase/env";

import { FormularioEvento } from "./formulario-evento";

export const metadata: Metadata = { title: "Novo evento especial" };

export default async function EventoEspecialPage({
  searchParams,
}: PageProps<"/evento-especial">) {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");
  if (!podeLancar(sessao.perfil)) redirect("/");

  const { data: dataParam } = await searchParams;
  const dataInicial =
    typeof dataParam === "string" && ehDataValida(dataParam)
      ? dataParam
      : hojeISO();

  return (
    <Pagina largura="estreita">
      <CabecalhoPagina
        titulo="Novo evento especial"
        descricao="Para datas fora da rotina — Culto de Homens numa terça, evento anual de sábado. Entra no histórico como qualquer culto, mas fica de fora do comparativo de frequência regular."
      />

      <Cartao className="sm:p-6">
        <FormularioEvento dataInicial={dataInicial} />
      </Cartao>
    </Pagina>
  );
}

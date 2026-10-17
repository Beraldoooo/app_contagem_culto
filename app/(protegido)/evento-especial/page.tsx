import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AvisoSupabase } from "@/components/aviso-supabase";
import { CabecalhoPagina, Cartao, Pagina } from "@/components/ui/base";
import { obterSessaoAtual, podeLancar } from "@/lib/auth/perfil";
import { ehDataValida, hojeISO } from "@/lib/datas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const { data: tipos } = await supabase
    .from("tipos_evento")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");

  return (
    <Pagina largura="estreita">
      <CabecalhoPagina
        titulo="Novo evento especial"
        descricao="Para datas fora da rotina, como o Culto Arena e o Culto Belas. Entra no histórico como qualquer culto, mas é comparado só com eventos do mesmo tipo, mês com mês."
      />

      <Cartao className="sm:p-6">
        <FormularioEvento dataInicial={dataInicial} tipos={tipos ?? []} />
      </Cartao>
    </Pagina>
  );
}

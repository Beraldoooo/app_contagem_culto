"use server";

import { redirect } from "next/navigation";

import { ehDataValida, hojeISO } from "@/lib/datas";
import { createClient } from "@/lib/supabase/server";

export type EstadoData = {
  erro?: string;
};

/**
 * Prepara uma data para lançamento: gera em `eventos` os cultos fixos daquele
 * dia da semana que ainda não existirem, e leva para a tela da data.
 *
 * Quem cria as linhas é a função `gerar_eventos_fixos` do banco, que tem
 * `on conflict do nothing` — chamar duas vezes na mesma data não duplica nada.
 * Ela roda como SECURITY INVOKER, então a RLS ainda decide se quem chamou pode
 * inserir.
 */
export async function prepararData(
  _anterior: EstadoData,
  formData: FormData,
): Promise<EstadoData> {
  const data = String(formData.get("data") ?? "");

  if (!ehDataValida(data)) {
    return { erro: "Escolha uma data válida." };
  }
  if (data > hojeISO()) {
    return { erro: "Não dá para lançar a contagem de um culto que ainda não aconteceu." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Entre novamente." };

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  const podeLancar =
    perfil?.status === "aprovado" &&
    (perfil.role === "contador" || perfil.role === "admin_geral");

  if (!podeLancar) {
    return { erro: "Seu perfil não pode lançar contagens." };
  }

  const { error } = await supabase.rpc("gerar_eventos_fixos", {
    p_data: data,
  });

  if (error) {
    return {
      erro: "Não foi possível preparar os horários dessa data. Tente novamente.",
    };
  }

  redirect(`/lancamento?data=${data}`);
}

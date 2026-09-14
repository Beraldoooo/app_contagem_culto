"use server";

import { revalidatePath } from "next/cache";
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

  const aprovado = perfil?.status === "aprovado";
  if (!aprovado) return { erro: "Seu perfil não tem acesso." };

  const podeLancar =
    perfil.role === "contador" || perfil.role === "admin_geral";

  // Visualizador só consulta: navega para a data sem criar nada. A RLS recusaria
  // o INSERT de qualquer forma — aqui é para ele não levar um erro na cara ao
  // simplesmente escolher um dia.
  if (podeLancar) {
    const { error } = await supabase.rpc("gerar_eventos_fixos", {
      p_data: data,
    });

    if (error) {
      return {
        erro: "Não foi possível preparar os horários dessa data. Tente novamente.",
      };
    }
  }

  redirect(`/lancamento?data=${data}`);
}

const QUANTIDADE_MAXIMA = 100_000;

export type EstadoContagem = {
  erro?: string;
  ok?: string;
};

/**
 * Salva (ou corrige) a contagem de UM horário.
 *
 * `upsert` com onConflict em evento_id: como a tabela tem UNIQUE(evento_id),
 * lançar de novo o mesmo horário corrige o número em vez de criar uma segunda
 * linha — o que inflaria o total do dia.
 */
export async function salvarContagem(
  _anterior: EstadoContagem,
  formData: FormData,
): Promise<EstadoContagem> {
  const eventoId = String(formData.get("evento_id") ?? "");
  const bruto = String(formData.get("quantidade") ?? "").trim();

  if (!eventoId) return { erro: "Horário não informado." };
  if (bruto === "") return { erro: "Digite quantas pessoas estavam presentes." };
  if (!/^\d+$/.test(bruto)) {
    return { erro: "Use apenas números inteiros, sem vírgula nem sinal." };
  }

  const quantidade = Number(bruto);
  if (quantidade > QUANTIDADE_MAXIMA) {
    return { erro: "Esse número parece alto demais. Confira o que digitou." };
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

  const { error } = await supabase.from("contagens").upsert(
    { evento_id: eventoId, quantidade, lancado_por: user.id },
    { onConflict: "evento_id" },
  );

  if (error) {
    return { erro: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/lancamento");
  return {
    ok: quantidade === 1 ? "1 pessoa registrada." : `${quantidade} pessoas registradas.`,
  };
}

/**
 * Apaga o lançamento de um horário — o registro some, diferente de salvar zero,
 * que significa "ninguém veio".
 *
 * Restrito ao Administrador Geral, espelhando a política de RLS
 * "contagens: admin remove": corrigir um número é rotina do Contador, apagar
 * histórico não é.
 */
export async function excluirContagem(
  _anterior: EstadoContagem,
  formData: FormData,
): Promise<EstadoContagem> {
  const eventoId = String(formData.get("evento_id") ?? "");
  if (!eventoId) return { erro: "Horário não informado." };

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

  if (perfil?.role !== "admin_geral" || perfil.status !== "aprovado") {
    return { erro: "Só o Administrador Geral pode excluir um lançamento." };
  }

  const { data, error } = await supabase
    .from("contagens")
    .delete()
    .eq("evento_id", eventoId)
    .select("id");

  if (error) return { erro: "Não foi possível excluir. Tente novamente." };
  if (!data?.length) return { erro: "Não havia lançamento para excluir." };

  revalidatePath("/lancamento");
  return { ok: "Lançamento excluído." };
}

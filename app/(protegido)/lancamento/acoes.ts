"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { validar, type Lancamento, type ValorItem } from "@/lib/contagem";
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

export type EstadoContagem = {
  erro?: string;
  ok?: string;
};

/** Campo vazio vira null de propósito: "não contado" não é "zero". */
function numero(formData: FormData, campo: string): number | null | "erro" {
  const bruto = String(formData.get(campo) ?? "").trim();
  if (bruto === "") return null;
  if (!/^\d+$/.test(bruto)) return "erro";
  return Number(bruto);
}

/** Confere sessão e papel. Repetido aqui porque a tela é a camada mais fraca. */
async function exigirContador() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Entre novamente." as const };

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  const pode =
    perfil?.status === "aprovado" &&
    (perfil.role === "contador" || perfil.role === "admin_geral");

  if (!pode) return { erro: "Seu perfil não pode lançar contagens." as const };
  return { supabase, user };
}

/**
 * Salva (ou corrige) a contagem de UM culto, com as categorias e os ministérios.
 *
 * O cabeçalho (adultos, homens, observação) vai em `contagens`, que tem
 * UNIQUE(evento_id): relançar corrige em vez de criar uma segunda linha.
 * Os ministérios vão em `contagens_itens`, uma linha por item preenchido.
 *
 * A gravação dos itens é upsert-e-depois-apaga, nessa ordem de propósito: o
 * caminho inverso deixaria o lançamento vazio por um instante, e uma falha no
 * meio apagaria o que já estava certo.
 */
export async function salvarContagem(
  _anterior: EstadoContagem,
  formData: FormData,
): Promise<EstadoContagem> {
  const eventoId = String(formData.get("evento_id") ?? "");
  if (!eventoId) return { erro: "Horário não informado." };

  const sessao = await exigirContador();
  if ("erro" in sessao) return { erro: sessao.erro };
  const { supabase, user } = sessao;

  const { data: itens, error: erroItens } = await supabase
    .from("itens_contagem")
    .select("id, codigo, grupo, tem_servindo, tem_publico, soma_em, ordem, nome")
    .eq("ativo", true);

  if (erroItens || !itens) {
    return { erro: "Não foi possível carregar os ministérios. Tente novamente." };
  }

  const adultos = numero(formData, "adultos");
  const homens = numero(formData, "homens");
  if (adultos === "erro" || homens === "erro") {
    return { erro: "Use apenas números inteiros, sem vírgula nem sinal." };
  }

  const valores: Record<string, ValorItem> = {};
  for (const item of itens) {
    const servindo = item.tem_servindo ? numero(formData, `s_${item.codigo}`) : null;
    const publico = item.tem_publico ? numero(formData, `p_${item.codigo}`) : null;
    if (servindo === "erro" || publico === "erro") {
      return { erro: "Use apenas números inteiros, sem vírgula nem sinal." };
    }
    valores[item.codigo] = { servindo, publico };
  }

  const lancamento: Lancamento = {
    adultos,
    homens,
    observacao: String(formData.get("observacao") ?? "").trim(),
    itens: valores,
  };

  const problema = validar(lancamento);
  if (problema) return { erro: problema };

  const { data: contagem, error: erroCabecalho } = await supabase
    .from("contagens")
    .upsert(
      {
        evento_id: eventoId,
        adultos: lancamento.adultos,
        homens: lancamento.homens,
        observacao: lancamento.observacao || null,
        lancado_por: user.id,
      },
      { onConflict: "evento_id" },
    )
    .select("id")
    .single();

  if (erroCabecalho || !contagem) {
    return { erro: "Não foi possível salvar. Tente novamente." };
  }

  const preenchidos = itens.filter((item) => {
    const v = valores[item.codigo];
    return v.servindo !== null || v.publico !== null;
  });

  if (preenchidos.length > 0) {
    const { error } = await supabase.from("contagens_itens").upsert(
      preenchidos.map((item) => ({
        contagem_id: contagem.id,
        item_id: item.id,
        servindo: valores[item.codigo].servindo,
        publico: valores[item.codigo].publico,
      })),
      { onConflict: "contagem_id,item_id" },
    );
    if (error) return { erro: "Não foi possível salvar os ministérios. Tente de novo." };
  }

  // O que a pessoa apagou precisa sumir do banco, senão o total continuaria
  // somando um ministério que ela acabou de limpar.
  const manter = preenchidos.map((i) => i.id);
  const limpeza = supabase
    .from("contagens_itens")
    .delete()
    .eq("contagem_id", contagem.id);
  const { error: erroLimpeza } = manter.length
    ? await limpeza.not("item_id", "in", `(${manter.join(",")})`)
    : await limpeza;

  if (erroLimpeza) {
    return { erro: "Salvou, mas não foi possível limpar um campo apagado. Confira os números." };
  }

  revalidatePath("/lancamento");
  return { ok: "Contagem salva." };
}

/**
 * Apaga o lançamento de um horário — o registro some, diferente de salvar zero,
 * que significa "ninguém veio". As linhas de ministério vão junto, por cascade.
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

"use server";

import { redirect } from "next/navigation";

import { ehDataValida, formatarHorario } from "@/lib/datas";
import { createClient } from "@/lib/supabase/server";

import { NOVO_TIPO } from "./constantes";

export type EstadoEvento = {
  erro?: string;
};

const FORMATO_HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Cria um evento especial: uma linha em `eventos` por horário informado.
 *
 * O evento é de um TIPO (Culto Arena, Culto Belas…), escolhido da lista ou
 * cadastrado aqui mesmo. É o tipo que permite comparar a Arena de outubro com a
 * de setembro; pelo nome livre não dava para agrupar.
 *
 * Usa upsert com `ignoreDuplicates`, que vira ON CONFLICT DO NOTHING sobre a
 * restrição (data, horario, nome). Reenviar o mesmo evento não duplica nada —
 * mesma garantia que os cultos fixos têm.
 */
export async function criarEventoEspecial(
  _anterior: EstadoEvento,
  formData: FormData,
): Promise<EstadoEvento> {
  const tipoEscolhido = String(formData.get("tipo_evento") ?? "");
  const tipoNovo = String(formData.get("tipo_novo") ?? "").trim().replace(/\s+/g, " ");
  const data = String(formData.get("data") ?? "");
  const horarios = formData
    .getAll("horario")
    .map((h) => String(h).trim())
    .filter(Boolean);

  if (!tipoEscolhido) return { erro: "Escolha o tipo do evento." };
  if (tipoEscolhido === NOVO_TIPO) {
    if (!tipoNovo) return { erro: "Dê um nome ao tipo novo." };
    if (tipoNovo.length > 60) return { erro: "O nome do tipo pode ter no máximo 60 caracteres." };
  }
  if (!ehDataValida(data)) return { erro: "Escolha uma data válida." };
  if (horarios.length === 0) return { erro: "Informe pelo menos um horário." };

  for (const horario of horarios) {
    if (!FORMATO_HORARIO.test(horario)) {
      return { erro: "Há um horário inválido no formulário." };
    }
  }

  const repetido = horarios.find((h, i) => horarios.indexOf(h) !== i);
  if (repetido) {
    return { erro: `O horário ${formatarHorario(repetido)} está repetido.` };
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
    return { erro: "Seu perfil não pode criar eventos." };
  }

  const tipo = await resolverTipo(supabase, user.id, tipoEscolhido, tipoNovo);
  if ("erro" in tipo) return { erro: tipo.erro };

  const { error } = await supabase.from("eventos").upsert(
    horarios.map((horario) => ({
      tipo: "evento_especial" as const,
      // O nome do evento é o do tipo: é o que aparece no dia, no histórico e
      // na mensagem do grupo.
      nome: tipo.nome,
      tipo_evento_id: tipo.id,
      data,
      horario,
      created_by: user.id,
    })),
    { onConflict: "data,horario,nome", ignoreDuplicates: true },
  );

  if (error) {
    return { erro: "Não foi possível salvar o evento. Tente novamente." };
  }

  redirect(`/lancamento?data=${data}`);
}

type Cliente = Awaited<ReturnType<typeof createClient>>;

/**
 * Devolve o tipo escolhido, ou cadastra o novo. Se já existir um tipo com o
 * mesmo nome (sem diferenciar maiúsculas), usa o existente em vez de falhar:
 * quem digitou "culto arena" queria a Arena que já está na lista.
 */
async function resolverTipo(
  supabase: Cliente,
  usuario: string,
  escolhido: string,
  novo: string,
): Promise<{ id: string; nome: string } | { erro: string }> {
  if (escolhido !== NOVO_TIPO) {
    const { data } = await supabase
      .from("tipos_evento")
      .select("id, nome")
      .eq("id", escolhido)
      .eq("ativo", true)
      .maybeSingle();
    return data ?? { erro: "Esse tipo de evento não existe mais. Escolha outro." };
  }

  const { data: existente } = await supabase
    .from("tipos_evento")
    .select("id, nome, ativo")
    .ilike("nome", novo.replace(/[%_\\]/g, "\\$&"))
    .maybeSingle();
  if (existente) {
    // Um tipo que tinha saído da lista volta, em vez de nascer duplicado.
    if (!existente.ativo) {
      await supabase.from("tipos_evento").update({ ativo: true }).eq("id", existente.id);
    }
    return { id: existente.id, nome: existente.nome };
  }

  const { data: criado, error } = await supabase
    .from("tipos_evento")
    .insert({ nome: novo, created_by: usuario })
    .select("id, nome")
    .single();

  if (error || !criado) return { erro: "Não foi possível cadastrar o tipo. Tente novamente." };
  return criado;
}

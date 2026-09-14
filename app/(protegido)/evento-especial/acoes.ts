"use server";

import { redirect } from "next/navigation";

import { ehDataValida, formatarHorario } from "@/lib/datas";
import { createClient } from "@/lib/supabase/server";

export type EstadoEvento = {
  erro?: string;
};

const FORMATO_HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Cria um evento especial: uma linha em `eventos` por horário informado.
 *
 * Usa upsert com `ignoreDuplicates`, que vira ON CONFLICT DO NOTHING sobre a
 * restrição (data, horario, nome). Reenviar o mesmo evento não duplica nada —
 * mesma garantia que os cultos fixos têm.
 */
export async function criarEventoEspecial(
  _anterior: EstadoEvento,
  formData: FormData,
): Promise<EstadoEvento> {
  const nome = String(formData.get("nome") ?? "").trim();
  const data = String(formData.get("data") ?? "");
  const horarios = formData
    .getAll("horario")
    .map((h) => String(h).trim())
    .filter(Boolean);

  if (!nome) return { erro: "Dê um nome ao evento." };
  if (nome.length > 120) return { erro: "O nome está muito longo." };
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

  const { error } = await supabase.from("eventos").upsert(
    horarios.map((horario) => ({
      tipo: "evento_especial" as const,
      nome,
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

"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type EstadoAcao = {
  erro?: string;
  ok?: string;
};

const PAPEIS_PERMITIDOS: UserRole[] = [
  "visualizador",
  "contador",
  "admin_geral",
];

/**
 * Confirma que quem chamou é Administrador Geral aprovado.
 *
 * A RLS já barra qualquer escrita de não-admin, mas checar aqui devolve uma
 * mensagem clara em vez de um "0 linhas afetadas" silencioso.
 */
async function exigirAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Entre novamente." } as const;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.role !== "admin_geral" || perfil.status !== "aprovado") {
    return { erro: "Só o Administrador Geral pode fazer isso." } as const;
  }

  return { supabase, usuarioId: user.id } as const;
}

function traduzirErro(mensagem: string): string {
  if (mensagem.includes("último Administrador Geral")) return mensagem;
  if (mensagem.toLowerCase().includes("row-level security")) {
    return "Você não tem permissão para esta alteração.";
  }
  return "Não foi possível salvar. Tente novamente.";
}

async function alterarPerfil(
  formData: FormData,
  mudanca: { role?: UserRole; status?: "aprovado" | "banido" },
  mensagemOk: (email: string) => string,
): Promise<EstadoAcao> {
  const contexto = await exigirAdmin();
  if ("erro" in contexto) return { erro: contexto.erro };
  const { supabase, usuarioId } = contexto;

  const alvo = String(formData.get("id") ?? "");
  if (!alvo) return { erro: "Usuário não informado." };

  // O próprio admin não mexe no próprio acesso: evita o autobloqueio mais
  // comum. Para trocar de admin, outro administrador faz a alteração.
  if (alvo === usuarioId) {
    return { erro: "Você não pode alterar o próprio acesso." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(mudanca)
    .eq("id", alvo)
    .select("email")
    .maybeSingle();

  if (error) return { erro: traduzirErro(error.message) };
  if (!data) return { erro: "Usuário não encontrado." };

  revalidatePath("/admin/usuarios");
  return { ok: mensagemOk(data.email) };
}

export async function aprovarUsuario(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  return alterarPerfil(
    formData,
    { status: "aprovado", role: "visualizador" },
    (email) => `${email} aprovado como Visualizador.`,
  );
}

export async function alterarPapel(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const papel = String(formData.get("role") ?? "") as UserRole;
  if (!PAPEIS_PERMITIDOS.includes(papel)) {
    return { erro: "Papel inválido." };
  }

  const rotulos: Record<string, string> = {
    visualizador: "Visualizador",
    contador: "Contador",
    admin_geral: "Administrador Geral",
  };

  return alterarPerfil(
    formData,
    { role: papel },
    (email) => `${email} agora é ${rotulos[papel]}.`,
  );
}

export async function banirUsuario(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  return alterarPerfil(
    formData,
    { status: "banido" },
    (email) => `${email} foi banido e perdeu o acesso.`,
  );
}

export async function reverterBanimento(
  _anterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  return alterarPerfil(
    formData,
    { status: "aprovado" },
    (email) => `${email} teve o acesso restaurado.`,
  );
}

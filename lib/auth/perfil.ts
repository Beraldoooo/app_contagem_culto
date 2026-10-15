// Só roda no servidor: `createClient` importa `next/headers`.
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export type SessaoAtual = {
  usuarioId: string;
  email: string;
  /** `null` quando o trigger `handle_new_user` não criou a linha (schema não aplicado). */
  perfil: Profile | null;
};

/**
 * Usuário autenticado + seu perfil, ou `null` se não houver sessão válida.
 *
 * Usa `getUser()` (valida o JWT no servidor de auth) em vez de `getSession()`,
 * que apenas lê o cookie e é falsificável.
 */
export async function obterSessaoAtual(): Promise<SessaoAtual | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    usuarioId: user.id,
    email: user.email ?? "",
    perfil: perfil ?? null,
  };
}

export function podeLancar(perfil: Profile | null): boolean {
  return (
    perfil?.status === "aprovado" &&
    (perfil.role === "contador" || perfil.role === "admin_geral")
  );
}

export function ehAdmin(perfil: Profile | null): boolean {
  return perfil?.status === "aprovado" && perfil.role === "admin_geral";
}

/** Nome para mostrar na tela. Nunca cai para o e-mail: quem não definiu nome vê "Sem nome". */
export function nomeDeExibicao(perfil: Profile | null): string | null {
  return perfil?.nome?.trim() || null;
}

export const ROTULO_ROLE: Record<Profile["role"], string> = {
  admin_geral: "Administrador Geral",
  contador: "Contador",
  visualizador: "Visualizador",
  pendente: "Pendente",
};

export const ROTULO_STATUS: Record<Profile["status"], string> = {
  pendente: "Aguardando aprovação",
  aprovado: "Aprovado",
  banido: "Banido",
};

import { NextResponse } from "next/server";

import { cookies } from "next/headers";

import { COOKIE_LEMBRAR } from "@/lib/supabase/cookies";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Encerra a sessão sem redirecionar.
 *
 * Usado pela tela de acesso negado: um Server Action com `redirect` levaria a
 * pessoa embora antes de ela ler a mensagem. Route Handlers podem gravar
 * cookies, então o logout acontece de fato.
 */
export async function POST() {
  if (!hasSupabaseEnv()) {
    return new NextResponse(null, { status: 204 });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_LEMBRAR);

  return new NextResponse(null, { status: 204 });
}

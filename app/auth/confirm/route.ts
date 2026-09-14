import { NextResponse, type NextRequest } from "next/server";

import type { EmailOtpType } from "@supabase/supabase-js";

import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const TIPOS_VALIDOS: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

/** Só caminhos internos: bloqueia redirect para outro site. */
function destinoSeguro(valor: string | null): string {
  return valor?.startsWith("/") && !valor.startsWith("//") ? valor : "/aguardando";
}

/**
 * Recebe o link de confirmação de e-mail (e também os de recuperação de senha
 * e magic link).
 *
 * Aceita as duas formas que o Supabase pode mandar:
 *
 * - `?token_hash=...&type=...` — o formato recomendado para apps com sessão no
 *   servidor. Funciona mesmo que a pessoa abra o e-mail em outro aparelho.
 * - `?code=...` — o fluxo PKCE padrão. Só funciona no mesmo navegador que fez
 *   o cadastro, porque depende de um cookie gravado naquele momento.
 *
 * Veja o README para o template de e-mail que ativa o primeiro formato.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const proximo = destinoSeguro(searchParams.get("next"));

  const erro = (motivo: string) =>
    NextResponse.redirect(
      new URL(`/link-invalido?motivo=${motivo}`, request.url),
    );

  if (!hasSupabaseEnv()) return erro("configuracao");

  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createClient();

  if (tokenHash && tipo && TIPOS_VALIDOS.includes(tipo)) {
    const { error } = await supabase.auth.verifyOtp({
      type: tipo,
      token_hash: tokenHash,
    });
    if (error) return erro("expirado");
    return NextResponse.redirect(new URL(proximo, request.url));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // Aparelho diferente do que fez o cadastro: o verificador PKCE não existe aqui.
    if (error) return erro("outro-aparelho");
    return NextResponse.redirect(new URL(proximo, request.url));
  }

  return erro("incompleto");
}

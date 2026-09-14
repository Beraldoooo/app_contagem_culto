import type { CookieOptions } from "@supabase/ssr";

/**
 * Nome do cookie que guarda a preferência do "lembrar-me".
 *
 * Ele próprio é um cookie de sessão: some quando o navegador fecha, junto com
 * os cookies de auth que ele governa.
 */
export const COOKIE_LEMBRAR = "contagem-lembrar";

export type CookieParaGravar = {
  name: string;
  value: string;
  options?: CookieOptions;
};

/**
 * O @supabase/ssr grava todo cookie de auth com `maxAge` de 400 dias. Sem
 * mexer nisso, o "lembrar-me" seria decorativo — toda sessão já seria
 * persistente. Quando o usuário não marca a opção, removemos `maxAge`/`expires`
 * para que o cookie vire um cookie de sessão e morra ao fechar o navegador.
 */
export function ajustarPersistencia(
  cookiesParaGravar: CookieParaGravar[],
  lembrar: boolean,
): CookieParaGravar[] {
  return cookiesParaGravar.map(({ name, value, options }) => ({
    name,
    value,
    options: {
      ...options,
      secure: process.env.NODE_ENV === "production",
      ...(lembrar ? {} : { maxAge: undefined, expires: undefined }),
    },
  }));
}

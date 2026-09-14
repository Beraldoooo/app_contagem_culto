import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { ajustarPersistencia, COOKIE_LEMBRAR } from "./cookies";
import { hasSupabaseEnv, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Rotas acessíveis sem sessão.
 *
 * /acesso-negado entra aqui porque a tela encerra a sessão do usuário banido:
 * se exigisse sessão, a própria página se expulsaria depois do logout.
 */
const ROTAS_PUBLICAS = [
  "/login",
  "/cadastro",
  "/acesso-negado",
  // É justamente aqui que a sessão nasce, vinda do link do e-mail: exigir
  // sessão desviaria a confirmação para /login e ela nunca aconteceria.
  "/auth/confirm",
  "/link-invalido",
  // O service worker pré-cacheia /offline na instalação. Se a rota exigisse
  // sessão, o cache guardaria a tela de login no lugar da página offline.
  "/offline",
];

/** Rotas que não fazem sentido para quem já está logado. */
const ROTAS_SO_DESLOGADO = ["/login", "/cadastro"];

/** Rotas exclusivas do Administrador Geral. */
const ROTAS_ADMIN = ["/admin"];

function ehRota(pathname: string, rotas: string[]) {
  return rotas.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );
}

/**
 * Renova o token de sessão do Supabase e protege as rotas: quem não está
 * autenticado vai para /login.
 *
 * A checagem de status (pendente/banido) fica no layout de `(protegido)`, que
 * já consulta o perfil — repetir aqui custaria uma ida ao banco a cada request.
 * De todo modo, quem manda é a RLS: um usuário pendente ou banido não lê dado
 * nenhum, mesmo que chegue à tela.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Sem .env.local o app continua rodando normalmente (esqueleto).
  if (!hasSupabaseEnv()) return response;

  const lembrar = request.cookies.get(COOKIE_LEMBRAR)?.value === "1";

  const supabase = createServerClient<Database>(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          const ajustados = ajustarPersistencia(cookiesToSet, lembrar);
          for (const { name, value } of ajustados) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of ajustados) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Não remova: é esta chamada que dispara o refresh do token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const publica = ehRota(pathname, ROTAS_PUBLICAS);

  if (!user && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // Preserva o destino para voltar até ele depois do login.
    if (pathname !== "/") url.searchParams.set("redirecionar", pathname);
    return redirecionar(url, response);
  }

  if (user && ehRota(pathname, ROTAS_SO_DESLOGADO)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return redirecionar(url, response);
  }

  // Área do administrador: custa uma consulta, mas só nas rotas /admin. A RLS
  // e as próprias Server Actions repetem a checagem — aqui é só para a pessoa
  // não chegar a ver a tela.
  if (user && ehRota(pathname, ROTAS_ADMIN)) {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (perfil?.role !== "admin_geral" || perfil.status !== "aprovado") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return redirecionar(url, response);
    }
  }

  return response;
}

/** Redireciona levando junto os cookies renovados nesta request. */
function redirecionar(url: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export { ROTAS_ADMIN, ROTAS_PUBLICAS, ROTAS_SO_DESLOGADO };

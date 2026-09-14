import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { ajustarPersistencia, COOKIE_LEMBRAR } from "./cookies";
import { requireSupabaseEnv } from "./env";

/**
 * Cliente Supabase para Server Components, Route Handlers e Server Actions.
 * Crie um cliente novo a cada request — nunca reaproveite entre requests.
 *
 * @param lembrar força a persistência da sessão. Quando omitido, respeita o
 * cookie de preferência gravado no login.
 */
export async function createClient(lembrar?: boolean) {
  // Lê os cookies primeiro de propósito: isso marca a rota como dinâmica antes
  // de qualquer erro de configuração, evitando que o build tente prerenderizar
  // uma página de sessão e quebre quando não há .env.local.
  const cookieStore = await cookies();
  const { url, anonKey } = requireSupabaseEnv();

  const persistir =
    lembrar ?? cookieStore.get(COOKIE_LEMBRAR)?.value === "1";

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of ajustarPersistencia(
            cookiesToSet,
            persistir,
          )) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components não podem escrever cookies. O proxy
          // (proxy.ts) já cuida de renovar a sessão, então ignorar aqui
          // é seguro.
        }
      },
    },
  });
}

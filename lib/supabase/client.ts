import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { requireSupabaseEnv } from "./env";

/**
 * Cliente Supabase para uso em Client Components ("use client").
 * A sessão é lida/gravada nos cookies do navegador.
 */
export function createClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}

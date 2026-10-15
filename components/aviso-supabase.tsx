import { IconeAlerta } from "@/components/icones";
import { TelaCentralizada } from "@/components/ui/tela-centralizada";

function Codigo({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-superficie-suave px-1 py-0.5 text-xs text-texto ring-1 ring-borda">
      {children}
    </code>
  );
}

/**
 * Mostrado quando faltam as variáveis do Supabase — evita uma tela de erro
 * críptica em quem acabou de clonar o projeto.
 */
export function AvisoSupabase() {
  return (
    <TelaCentralizada
      icone={IconeAlerta}
      tom="aviso"
      titulo="Supabase não configurado"
      descricao={
        <div className="flex flex-col gap-3">
          <p>
            Copie <Codigo>.env.local.example</Codigo> para{" "}
            <Codigo>.env.local</Codigo>, preencha{" "}
            <Codigo>NEXT_PUBLIC_SUPABASE_URL</Codigo> e{" "}
            <Codigo>NEXT_PUBLIC_SUPABASE_ANON_KEY</Codigo> e reinicie o
            servidor.
          </p>
          <p>
            Rode também <Codigo>supabase/schema.sql</Codigo> no SQL Editor do
            seu projeto.
          </p>
        </div>
      }
    />
  );
}

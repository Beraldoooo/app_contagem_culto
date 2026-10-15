import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Alerta } from "@/components/alerta";
import { AvisoSupabase } from "@/components/aviso-supabase";
import { CabecalhoPagina, Pagina, Selo } from "@/components/ui/base";
import { obterSessaoAtual } from "@/lib/auth/perfil";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

import { LinhaUsuario } from "./linha-usuario";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsuariosPage() {
  if (!hasSupabaseEnv()) return <AvisoSupabase />;

  const sessao = await obterSessaoAtual();
  if (!sessao) redirect("/login");

  // Terceira barreira, depois do proxy e da RLS: se alguém chegar aqui sem ser
  // admin, não renderiza a tela.
  if (sessao.perfil?.role !== "admin_geral" || sessao.perfil.status !== "aprovado") {
    redirect("/");
  }

  const supabase = await createClient();

  // A RLS decide o que vem: só um admin_geral recebe mais que a própria linha.
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  const usuarios: Profile[] = data ?? [];

  const pendentes = usuarios.filter((u) => u.status === "pendente");
  const ativos = usuarios.filter((u) => u.status === "aprovado");
  const banidos = usuarios.filter((u) => u.status === "banido");

  return (
    <Pagina>
      <CabecalhoPagina
        titulo="Usuários"
        descricao="Aprove quem se cadastrou, defina papéis e controle o acesso."
      />

      {error ? (
        <Alerta tom="erro">Não foi possível carregar a lista de usuários.</Alerta>
      ) : null}

      <Secao
        titulo="Aguardando aprovação"
        contagem={pendentes.length}
        vazio="Ninguém aguardando no momento."
        destaque
      >
        {pendentes.map((perfil) => (
          <LinhaUsuario
            key={perfil.id}
            perfil={perfil}
            souEu={perfil.id === sessao.usuarioId}
          />
        ))}
      </Secao>

      <Secao
        titulo="Com acesso"
        contagem={ativos.length}
        vazio="Nenhum usuário ativo."
      >
        {ativos.map((perfil) => (
          <LinhaUsuario
            key={perfil.id}
            perfil={perfil}
            souEu={perfil.id === sessao.usuarioId}
          />
        ))}
      </Secao>

      {banidos.length > 0 ? (
        <Secao titulo="Banidos" contagem={banidos.length} vazio="">
          {banidos.map((perfil) => (
            <LinhaUsuario
              key={perfil.id}
              perfil={perfil}
              souEu={perfil.id === sessao.usuarioId}
            />
          ))}
        </Secao>
      ) : null}
    </Pagina>
  );
}

function Secao({
  titulo,
  contagem,
  vazio,
  destaque,
  children,
}: {
  titulo: string;
  contagem: number;
  vazio: string;
  destaque?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        {titulo}
        {contagem > 0 ? (
          <Selo tom={destaque ? "aviso" : "neutro"}>{contagem}</Selo>
        ) : null}
      </h2>

      {contagem === 0 ? (
        <p className="text-sm text-texto-3">{vazio}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</ul>
      )}
    </section>
  );
}

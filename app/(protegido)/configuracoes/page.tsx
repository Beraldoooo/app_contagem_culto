import type { Metadata } from "next";

import { SeletorTema } from "@/components/seletor-tema";
import { nomeDeExibicao, obterSessaoAtual } from "@/lib/auth/perfil";
import { CabecalhoPagina, Cartao, Pagina } from "@/components/ui/base";
import { LinkBotao } from "@/components/ui/botao";

import { FormularioNome } from "./formulario-nome";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const sessao = await obterSessaoAtual();

  return (
    <Pagina largura="estreita">
      <CabecalhoPagina
        titulo="Configurações"
        descricao="Seu nome, a aparência do app e a sua senha."
      />

      <Cartao as="section" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Nome de exibição</h2>
          <p className="text-sm text-texto-2">
            É o que aparece no app no lugar do seu e-mail. O e-mail só o
            administrador vê, na tela de Usuários.
          </p>
        </div>
        <FormularioNome nomeAtual={nomeDeExibicao(sessao?.perfil ?? null)} />
      </Cartao>

      <Cartao as="section" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Aparência</h2>
          <p className="text-sm text-texto-2">
            Escolha o tema do aplicativo. A escolha vale para este aparelho e é
            aplicada na hora.
          </p>
        </div>
        <SeletorTema />
      </Cartao>

      <Cartao as="section" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Senha</h2>
          <p className="text-sm text-texto-2">
            Troque a senha que você usa para entrar no app.
          </p>
        </div>
        {/* A origem faz a tela de senha oferecer a volta para cá e ajusta o
            texto de sessão expirada, que lá fala em link de recuperação. */}
        <LinkBotao href="/nova-senha?origem=configuracoes" variante="secundario">
          Alterar senha
        </LinkBotao>
      </Cartao>
    </Pagina>
  );
}

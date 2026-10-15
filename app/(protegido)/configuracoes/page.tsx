import type { Metadata } from "next";

import { SeletorTema } from "@/components/seletor-tema";
import { CabecalhoPagina, Cartao, Pagina } from "@/components/ui/base";
import { LinkBotao } from "@/components/ui/botao";

export const metadata: Metadata = { title: "Configurações" };

export default function ConfiguracoesPage() {
  return (
    <Pagina largura="estreita">
      <CabecalhoPagina
        titulo="Configurações"
        descricao="Aparência do app e acesso à sua conta."
      />

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
        <LinkBotao href="/nova-senha" variante="secundario">
          Alterar senha
        </LinkBotao>
      </Cartao>
    </Pagina>
  );
}

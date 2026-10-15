import type { Metadata } from "next";

import { IconeBloqueio } from "@/components/icones";
import { LinkBotao } from "@/components/ui/botao";
import { TelaCentralizada } from "@/components/ui/tela-centralizada";

import { EncerrarSessao } from "./encerrar-sessao";

export const metadata: Metadata = { title: "Acesso negado" };

export default function AcessoNegadoPage() {
  return (
    <TelaCentralizada
      icone={IconeBloqueio}
      tom="perigo"
      titulo="Acesso negado"
      descricao="Esta conta foi bloqueada pelo Administrador Geral e não pode acessar o aplicativo. Se você acha que houve engano, procure o responsável pela contagem."
    >
      <EncerrarSessao />

      <LinkBotao href="/login" variante="secundario" larguraTotal>
        Voltar para o login
      </LinkBotao>
    </TelaCentralizada>
  );
}

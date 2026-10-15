import type { Metadata } from "next";

import { IconeBusca } from "@/components/icones";
import { LinkBotao } from "@/components/ui/botao";
import { TelaCentralizada } from "@/components/ui/tela-centralizada";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NaoEncontrada() {
  return (
    <TelaCentralizada
      icone={IconeBusca}
      titulo="Página não encontrada"
      descricao="O endereço que você abriu não existe. Pode ter sido um link antigo ou um erro de digitação."
    >
      <LinkBotao href="/" larguraTotal>
        Voltar ao início
      </LinkBotao>
    </TelaCentralizada>
  );
}

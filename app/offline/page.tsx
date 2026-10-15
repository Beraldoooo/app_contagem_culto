import type { Metadata } from "next";

import { IconeSemConexao } from "@/components/icones";
import { TelaCentralizada } from "@/components/ui/tela-centralizada";

export const metadata: Metadata = {
  title: "Sem conexão",
};

export default function OfflinePage() {
  return (
    <TelaCentralizada
      icone={IconeSemConexao}
      titulo="Você está sem conexão"
      descricao="Reconecte-se à internet para lançar ou consultar contagens."
    />
  );
}

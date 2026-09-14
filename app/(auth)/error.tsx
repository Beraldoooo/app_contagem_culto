"use client";

import { useEffect } from "react";

import { ErroAmigavel } from "@/components/erro-amigavel";

export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Falha na tela de acesso:", error);
  }, [error]);

  return (
    <ErroAmigavel
      titulo="Não foi possível carregar"
      descricao="Houve uma falha ao abrir esta tela. Tente novamente em instantes."
      aoTentarNovamente={reset}
    />
  );
}

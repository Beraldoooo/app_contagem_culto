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
    // O detalhe técnico fica aqui; a pessoa vê a mensagem amigável.
    console.error("Falha na tela:", error);
  }, [error]);

  return <ErroAmigavel aoTentarNovamente={reset} />;
}

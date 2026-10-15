"use client";

import { useEffect, useState } from "react";

/**
 * Encerra a sessão do usuário banido assim que a tela abre, sem navegar para
 * outro lugar — a mensagem continua visível.
 */
export function EncerrarSessao() {
  const [encerrada, setEncerrada] = useState(false);

  useEffect(() => {
    let ativo = true;

    fetch("/auth/sair", { method: "POST" })
      .then(() => {
        if (ativo) setEncerrada(true);
      })
      .catch(() => {
        // Se falhar, a RLS ainda bloqueia todo acesso a dados.
      });

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <p className="text-xs text-texto-3">
      {encerrada ? "Sessão encerrada neste aparelho." : "Encerrando a sessão…"}
    </p>
  );
}

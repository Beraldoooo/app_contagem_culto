"use client";

import { useFormStatus } from "react-dom";

import { classesBotao } from "@/components/ui/botao";

export function BotaoEnviar({
  children,
  carregando,
}: {
  children: React.ReactNode;
  carregando?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={classesBotao({ larguraTotal: true })}
    >
      {pending ? (carregando ?? "Aguarde…") : children}
    </button>
  );
}

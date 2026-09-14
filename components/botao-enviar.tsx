"use client";

import { useFormStatus } from "react-dom";

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
      className="h-11 rounded-lg bg-blue-600 px-4 text-base font-medium text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
    >
      {pending ? (carregando ?? "Aguarde…") : children}
    </button>
  );
}

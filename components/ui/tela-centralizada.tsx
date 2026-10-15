import type { ReactNode } from "react";

import type { Icone } from "@/components/icones";

import { Cartao } from "./base";

type Tom = "neutro" | "aviso" | "perigo";

const TONS: Record<Tom, string> = {
  neutro: "bg-superficie-suave text-texto-2",
  aviso: "bg-aviso-suave text-aviso-texto",
  perigo: "bg-perigo-suave text-perigo-texto",
};

/**
 * Telas avulsas (aguardando, acesso negado, link inválido, offline, 404):
 * um cartão no centro com ícone, título, texto e ações.
 */
export function TelaCentralizada({
  icone: Icone,
  tom = "neutro",
  titulo,
  descricao,
  children,
}: {
  icone: Icone;
  tom?: Tom;
  titulo: string;
  descricao: ReactNode;
  children?: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Cartao className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex flex-col gap-3">
          <span
            className={`flex size-12 items-center justify-center rounded-full ${TONS[tom]}`}
          >
            <Icone tamanho={22} />
          </span>
          <h1 className="text-xl font-bold tracking-tight">{titulo}</h1>
          <div className="text-sm text-texto-2">{descricao}</div>
        </div>
        {children}
      </Cartao>
    </main>
  );
}

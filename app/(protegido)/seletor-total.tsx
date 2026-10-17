import Link from "next/link";

import type { TotalGrafico } from "./grafico-comparativo";

const OPCOES: { valor: TotalGrafico; rotulo: string; dica: string }[] = [
  { valor: "simples", rotulo: "Simples", dica: "Só a congregação" },
  { valor: "detalhado", rotulo: "Detalhada", dica: "Com quem serviu e a equipe pastoral" },
];

/** Simples × Detalhada nos gráficos do Início. Vai na URL (?total=). */
export function SeletorTotal({ atual }: { atual: TotalGrafico }) {
  return (
    <div role="group" aria-label="Contagem" className="grid grid-cols-2 gap-1 rounded-campo border border-borda bg-superficie p-1">
      {OPCOES.map((o) => (
        <Link
          key={o.valor}
          href={o.valor === "simples" ? "/" : "/?total=detalhado"}
          scroll={false}
          aria-current={o.valor === atual ? "true" : undefined}
          title={o.dica}
          className={`flex h-9 items-center justify-center rounded-[calc(var(--radius-campo)-4px)] px-4 text-sm transition ${
            o.valor === atual
              ? "bg-marca-suave font-semibold text-marca-texto"
              : "text-texto-2 hover:bg-superficie-suave"
          }`}
        >
          {o.rotulo}
        </Link>
      ))}
    </div>
  );
}

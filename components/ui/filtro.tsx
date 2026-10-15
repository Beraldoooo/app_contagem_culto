import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

import { IconeSetaBaixo } from "@/components/icones";

/**
 * Filtros no formato "Rótulo: Valor ▾" — caixa branca arredondada, rótulo em
 * cinza e valor em negrito, como na referência de dashboard.
 */
const caixa =
  "relative flex h-11 min-w-0 items-center gap-1.5 rounded-campo border border-borda bg-superficie pl-3.5 text-sm shadow-cartao transition focus-within:border-marca focus-within:ring-3 focus-within:ring-marca/15";

export function FiltroSelect({
  rotulo,
  id,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { rotulo: string; id: string }) {
  return (
    <label htmlFor={id} className={`${caixa} pr-9 ${className}`}>
      <span className="shrink-0 text-texto-2">{rotulo}:</span>
      <select
        id={id}
        className="min-w-0 flex-1 cursor-pointer appearance-none truncate bg-transparent font-semibold text-texto outline-none"
        {...props}
      >
        {children}
      </select>
      <IconeSetaBaixo
        tamanho={16}
        className="pointer-events-none absolute right-3 text-texto-2"
      />
    </label>
  );
}

export function FiltroData({
  rotulo,
  id,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { rotulo: string; id: string }) {
  return (
    <label htmlFor={id} className={`${caixa} pr-2 ${className}`}>
      <span className="shrink-0 text-texto-2">{rotulo}:</span>
      <input
        id={id}
        type="date"
        className="min-w-0 flex-1 bg-transparent font-semibold text-texto outline-none"
        {...props}
      />
    </label>
  );
}

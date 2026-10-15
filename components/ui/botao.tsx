import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

export type VarianteBotao = "principal" | "secundario" | "discreto" | "perigo";
export type TamanhoBotao = "md" | "sm";

const VARIANTES: Record<VarianteBotao, string> = {
  principal: "bg-marca text-white hover:bg-marca-forte",
  secundario:
    "border border-borda-forte bg-superficie text-texto hover:bg-superficie-suave",
  discreto: "text-texto-2 hover:bg-superficie-suave hover:text-texto",
  perigo: "bg-perigo text-white hover:opacity-90",
};

const TAMANHOS: Record<TamanhoBotao, string> = {
  md: "h-11 px-4 text-[15px]",
  sm: "h-9 px-3 text-sm",
};

/**
 * Classes do botão padrão. Exportado à parte para os botões que precisam de
 * `useFormStatus` (client) e não podem usar o componente direto.
 */
export function classesBotao({
  variante = "principal",
  tamanho = "md",
  larguraTotal = false,
}: {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
  larguraTotal?: boolean;
} = {}) {
  return [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-campo font-medium transition",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTES[variante],
    TAMANHOS[tamanho],
    larguraTotal ? "w-full" : "",
  ].join(" ");
}

type Opcoes = {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
  larguraTotal?: boolean;
};

export function Botao({
  variante,
  tamanho,
  larguraTotal,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & Opcoes) {
  return (
    <button
      type={type}
      className={`${classesBotao({ variante, tamanho, larguraTotal })} ${className}`}
      {...props}
    />
  );
}

export function LinkBotao({
  variante,
  tamanho,
  larguraTotal,
  className = "",
  ...props
}: ComponentProps<typeof Link> & Opcoes) {
  return (
    <Link
      className={`${classesBotao({ variante, tamanho, larguraTotal })} ${className}`}
      {...props}
    />
  );
}

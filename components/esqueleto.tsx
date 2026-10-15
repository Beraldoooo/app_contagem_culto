import { Cartao, Pagina } from "@/components/ui/base";

/**
 * Blocos cinzas que ocupam o lugar do conteúdo enquanto ele carrega.
 * Evita o "pulo" da tela quando os dados chegam.
 */
export function Bloco({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-campo bg-borda ${className}`}
    />
  );
}

export function CartaoEsqueleto({ linhas = 3 }: { linhas?: number }) {
  return (
    <Cartao className="flex flex-col gap-3">
      {Array.from({ length: linhas }, (_, i) => (
        <Bloco key={i} className={i === 0 ? "h-5 w-1/2" : "h-4 w-full"} />
      ))}
    </Cartao>
  );
}

export function ListaEsqueleto({ itens = 4 }: { itens?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: itens }, (_, i) => (
        <CartaoEsqueleto key={i} linhas={2} />
      ))}
    </div>
  );
}

/** Esqueleto do cabeçalho da página: título e linha embaixo. */
export function CabecalhoEsqueleto() {
  return (
    <div className="flex flex-col gap-2 border-b border-borda pb-5">
      <Bloco className="h-8 w-48" />
      <Bloco className="h-4 w-72 max-w-full" />
    </div>
  );
}

export function PaginaCarregando({
  titulo,
  itens = 4,
  largura = "larga",
}: {
  titulo: string;
  itens?: number;
  largura?: "estreita" | "larga";
}) {
  return (
    <Pagina largura={largura} aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando {titulo}…</span>
      <CabecalhoEsqueleto />
      <ListaEsqueleto itens={itens} />
    </Pagina>
  );
}

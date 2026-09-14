/**
 * Blocos cinzas que ocupam o lugar do conteúdo enquanto ele carrega.
 * Evita o "pulo" da tela quando os dados chegam.
 */
export function Bloco({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`}
    />
  );
}

export function CartaoEsqueleto({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {Array.from({ length: linhas }, (_, i) => (
        <Bloco key={i} className={i === 0 ? "h-5 w-1/2" : "h-4 w-full"} />
      ))}
    </div>
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

export function PaginaCarregando({
  titulo,
  itens = 4,
}: {
  titulo: string;
  itens?: number;
}) {
  return (
    <main
      className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2">
        <span className="sr-only">Carregando {titulo}…</span>
        <Bloco className="h-4 w-16" />
        <Bloco className="h-8 w-40" />
      </div>
      <ListaEsqueleto itens={itens} />
    </main>
  );
}

import type { HTMLAttributes, ReactNode } from "react";

/** Classes dos campos de formulário (input, select): mesma altura e borda. */
export const classesCampo =
  "h-11 w-full min-w-0 rounded-campo border border-borda-forte bg-superficie px-3 text-base text-texto outline-none transition placeholder:text-texto-3 focus:border-marca focus:ring-3 focus:ring-marca/15 disabled:opacity-60";

/**
 * Campo de várias linhas. Mesma aparência, mas sem a altura fixa de
 * `classesCampo`: o `h-11` é feito para uma linha só e cortava a segunda
 * linha de um textarea, inclusive o próprio texto de exemplo.
 */
export const classesCampoMultilinha = classesCampo
  .replace("h-11", "min-h-[5.25rem] py-2.5")
  .concat(" resize-y leading-relaxed");

/** Rótulo pequeno acima de um campo. */
export const classesRotulo = "text-sm font-medium text-texto";

/** Bloco branco com borda e sombra leve — a unidade básica das telas. */
export function Cartao({
  as: Tag = "div",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "li" | "article" | "form" | "dl" | "main";
}) {
  return (
    <Tag
      className={`rounded-cartao border border-borda bg-superficie p-5 shadow-cartao ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Título pequeno em cinza no topo de um cartão ("Total do dia"). */
export function RotuloCartao({ children }: { children: ReactNode }) {
  return <p className="text-sm font-medium text-texto-2">{children}</p>;
}

type TomSelo = "neutro" | "marca" | "sucesso" | "aviso" | "perigo" | "evento";

const TONS_SELO: Record<TomSelo, string> = {
  neutro: "bg-superficie-suave text-texto-2 ring-1 ring-inset ring-borda",
  marca: "bg-marca-suave text-marca-texto",
  sucesso: "bg-sucesso-suave text-sucesso-texto",
  aviso: "bg-aviso-suave text-aviso-texto",
  perigo: "bg-perigo-suave text-perigo-texto",
  evento: "bg-evento-suave text-evento-texto",
};

/** Etiqueta curta: papel, status, "Evento", "pendente". */
export function Selo({
  tom = "neutro",
  className = "",
  children,
}: {
  tom?: TomSelo;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${TONS_SELO[tom]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Área de conteúdo de uma tela interna. `estreita` para formulários e listas
 * de leitura; `larga` para relatórios e grades.
 */
export function Pagina({
  largura = "larga",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { largura?: "estreita" | "larga" }) {
  const max = largura === "estreita" ? "max-w-3xl" : "max-w-6xl";
  return (
    <main
      className={`mx-auto flex w-full ${max} flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-9 ${className}`}
      {...props}
    >
      {children}
    </main>
  );
}

/** Título da tela, descrição e uma ação opcional à direita, com linha embaixo. */
export function CabecalhoPagina({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-borda pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-texto lg:text-[28px]">
          {titulo}
        </h1>
        {descricao ? (
          <p className="max-w-2xl text-sm text-texto-2">{descricao}</p>
        ) : null}
      </div>
      {acao ? <div className="flex shrink-0 gap-2">{acao}</div> : null}
    </header>
  );
}

/** Mensagem curta em cinza para listas vazias. */
export function Vazio({ children }: { children: ReactNode }) {
  return (
    <Cartao className="text-center text-sm text-texto-2">{children}</Cartao>
  );
}

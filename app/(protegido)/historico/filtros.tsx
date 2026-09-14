import Link from "next/link";

export type TipoFiltro = "todos" | "culto_fixo" | "evento_especial";

/**
 * Formulário GET puro: os filtros viram parâmetros na URL, então dá para voltar
 * pelo botão do navegador, recarregar e mandar o link para alguém. Sem
 * JavaScript de cliente.
 */
export function Filtros({
  de,
  ate,
  tipo,
  temFiltro,
}: {
  de: string;
  ate: string;
  tipo: TipoFiltro;
  temFiltro: boolean;
}) {
  return (
    <form
      method="get"
      action="/historico"
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="de" className="text-xs font-medium text-slate-600 dark:text-slate-400">
            De
          </label>
          <input
            id="de"
            name="de"
            type="date"
            defaultValue={de}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="ate" className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Até
          </label>
          <input
            id="ate"
            name="ate"
            type="date"
            defaultValue={ate}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="tipo" className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          defaultValue={tipo}
          className="h-11 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="todos">Todos</option>
          <option value="culto_fixo">Somente cultos fixos</option>
          <option value="evento_especial">Somente eventos especiais</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="h-11 flex-1 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Filtrar
        </button>
        {temFiltro ? (
          <Link
            href="/historico"
            className="flex h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Limpar
          </Link>
        ) : null}
      </div>
    </form>
  );
}

import { LinkBotao, classesBotao } from "@/components/ui/botao";
import { FiltroData, FiltroSelect } from "@/components/ui/filtro";

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
      className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center"
    >
      <FiltroData rotulo="De" id="de" name="de" defaultValue={de} className="lg:w-52" />
      <FiltroData rotulo="Até" id="ate" name="ate" defaultValue={ate} className="lg:w-52" />
      <FiltroSelect
        rotulo="Tipo"
        id="tipo"
        name="tipo"
        defaultValue={tipo}
        className="sm:col-span-2 lg:w-64"
      >
        <option value="todos">Todos</option>
        <option value="culto_fixo">Somente cultos fixos</option>
        <option value="evento_especial">Somente eventos especiais</option>
      </FiltroSelect>

      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className={`${classesBotao()} flex-1 lg:flex-none`}>
          Filtrar
        </button>
        {temFiltro ? (
          <LinkBotao href="/historico" variante="discreto">
            Limpar
          </LinkBotao>
        ) : null}
      </div>
    </form>
  );
}

import { LinkBotao, classesBotao } from "@/components/ui/botao";
import { FiltroData, FiltroSelect } from "@/components/ui/filtro";

export type TipoFiltro = "todos" | "culto_fixo" | "evento_especial";

/**
 * Formulário GET puro: os filtros viram parâmetros na URL, então dá para voltar
 * pelo botão do navegador, recarregar e mandar o link para alguém.
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
        opcoes={[
          { valor: "todos", rotulo: "Todos" },
          { valor: "culto_fixo", rotulo: "Somente cultos fixos" },
          { valor: "evento_especial", rotulo: "Somente eventos especiais" },
        ]}
      />

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

import { Bloco, CabecalhoEsqueleto } from "@/components/esqueleto";
import { Pagina } from "@/components/ui/base";

export default function Carregando() {
  return (
    <Pagina aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando os relatórios…</span>
      <CabecalhoEsqueleto />
      <Bloco className="h-11 w-full sm:w-96" />
      <div className="grid grid-cols-3 gap-3 lg:gap-5">
        <Bloco className="h-24" />
        <Bloco className="h-24" />
        <Bloco className="h-24" />
      </div>
      <Bloco className="h-72 w-full sm:h-96 lg:h-[30rem]" />
    </Pagina>
  );
}

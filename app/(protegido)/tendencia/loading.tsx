import { Bloco } from "@/components/esqueleto";

export default function Carregando() {
  return (
    <main
      className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8 lg:max-w-4xl"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Carregando o gráfico de tendência…</span>
      <Bloco className="h-8 w-40" />
      <Bloco className="h-32 w-full" />
      <Bloco className="h-64 w-full sm:h-80 lg:h-[26rem]" />
    </main>
  );
}

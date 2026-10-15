import Link from "next/link";

/** Logo do app: três barras subindo + nome. */
export function Marca({ comNome = true }: { comNome?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Contagem Culto — início">
      <span
        aria-hidden
        className="flex size-9 items-end justify-center gap-[3px] rounded-[10px] bg-marca p-2.5"
      >
        <span className="h-[40%] w-1/4 rounded-[1px] bg-white" />
        <span className="h-[70%] w-1/4 rounded-[1px] bg-white" />
        <span className="h-full w-1/4 rounded-[1px] bg-white" />
      </span>
      {comNome ? (
        <span className="text-[17px] font-bold tracking-tight text-texto">
          Contagem Culto
        </span>
      ) : null}
    </Link>
  );
}

import { IconeSair } from "@/components/icones";
import { classesBotao } from "@/components/ui/botao";
import { sair } from "@/lib/auth/acoes";

export function BotaoSair({
  variante = "menu",
}: {
  /** `menu`: linha discreta com ícone (menu lateral). `solido`: botão cheio. */
  variante?: "menu" | "solido";
}) {
  const classe =
    variante === "solido"
      ? classesBotao({ variante: "secundario", larguraTotal: true })
      : "flex h-10 w-full items-center gap-3 rounded-campo px-3 text-sm font-medium text-texto-2 transition hover:bg-superficie-suave hover:text-perigo-texto";

  return (
    <form action={sair}>
      <button type="submit" className={classe}>
        <IconeSair tamanho={18} />
        Sair
      </button>
    </form>
  );
}

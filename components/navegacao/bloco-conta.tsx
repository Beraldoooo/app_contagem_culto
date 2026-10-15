import { BotaoSair } from "@/components/botao-sair";
import { Selo } from "@/components/ui/base";

/** Quem está logado, com o papel e o botão Sair. Fica no pé do menu. */
export function BlocoConta({
  email,
  papel,
}: {
  email: string;
  papel: string;
}) {
  const inicial = email.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-campo bg-superficie-suave p-3">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-marca-suave text-sm font-semibold text-marca-texto"
        >
          {inicial}
        </span>
        <div className="flex min-w-0 flex-col items-start gap-1">
          <span className="w-full truncate text-sm font-medium" title={email}>
            {email}
          </span>
          <Selo tom="marca">{papel}</Selo>
        </div>
      </div>
      <BotaoSair />
    </div>
  );
}

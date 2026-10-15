import { Selo } from "@/components/ui/base";
import { formatarDiferenca, formatarPercentual } from "@/lib/comparativo";

/** Selo verde (aumento), vermelho (queda) ou cinza (igual): "▲ +25 · +8,6%". */
export function Variacao({
  diferenca,
  percentual,
  className = "",
}: {
  diferenca: number;
  percentual: number | null;
  className?: string;
}) {
  const tom = diferenca > 0 ? "sucesso" : diferenca < 0 ? "perigo" : "neutro";

  return (
    <Selo tom={tom} className={className}>
      {diferenca > 0 ? "▲" : diferenca < 0 ? "▼" : "="}{" "}
      {formatarDiferenca(diferenca)}
      {percentual !== null ? ` · ${formatarPercentual(percentual)}` : ""}
    </Selo>
  );
}

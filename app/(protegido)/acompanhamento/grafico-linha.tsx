"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type PontoLinha = {
  rotulo: string;
  /** Período inteiro, para a dica ("semana de 05/10 a 11/10"). */
  descricao: string;
  /** `null` desenha um vão na linha, nunca uma queda até zero. */
  valor: number | null;
  /** Contra o período anterior. Pinta o ponto de verde ou vermelho. */
  variacao: number | null;
  /** "falta lançar a quinta", "1 sem culto"… */
  aviso?: string;
};

// Cores dos tokens do tema (globals.css): o SVG aceita var() nos atributos,
// então o gráfico acompanha o modo claro e o escuro.
const LINHA = "var(--marca)";
const SUBIU = "var(--sucesso)";
const CAIU = "var(--perigo)";
const NEUTRO = "var(--texto-3)";

const corDe = (v: number | null) => (v === null ? NEUTRO : v > 0 ? SUBIU : v < 0 ? CAIU : NEUTRO);

export function formatarVariacao(v: number | null) {
  if (v === null) return null;
  const sinal = v > 0 ? "↑ " : v < 0 ? "↓ " : "";
  return `${sinal}${Math.abs(v).toLocaleString("pt-BR")}%`;
}

function Ponto(props: { cx?: number; cy?: number; payload?: PontoLinha }) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload || payload.valor === null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4.5}
      fill={corDe(payload.variacao)}
      stroke="var(--superficie)"
      strokeWidth={1.5}
    />
  );
}

function Dica({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PontoLinha }>;
}) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  const v = formatarVariacao(p.variacao);
  return (
    <div className="max-w-56 rounded-campo border border-borda bg-superficie px-3 py-2 text-xs shadow-flutuante">
      <p className="font-medium">{p.descricao}</p>
      <p className="mt-1 text-texto-2">
        {p.valor === null ? "Sem lançamento" : (
          <>
            <span className="font-semibold text-texto tabular-nums">
              {p.valor.toLocaleString("pt-BR")}
            </span>{" "}
            pessoas
          </>
        )}
      </p>
      {v ? (
        <p className="mt-0.5 font-medium" style={{ color: corDe(p.variacao) }}>
          {v} sobre o anterior
        </p>
      ) : null}
      {p.aviso ? <p className="mt-1 text-aviso-texto">⚠️ {p.aviso}</p> : null}
    </div>
  );
}

export function GraficoLinha({ pontos }: { pontos: PontoLinha[] }) {
  return (
    <div className="h-56 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pontos} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={NEUTRO} strokeOpacity={0.25} vertical={false} />
          <XAxis
            dataKey="rotulo"
            tick={{ fontSize: 11, fill: NEUTRO }}
            tickLine={false}
            axisLine={{ stroke: NEUTRO, strokeOpacity: 0.4 }}
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 11, fill: NEUTRO }}
            tickLine={false}
            axisLine={false}
            width={44}
            allowDecimals={false}
          />
          <Tooltip content={<Dica />} />
          {/* connectNulls desligado: período sem lançamento vira vão. */}
          <Line
            type="monotone"
            dataKey="valor"
            stroke={LINHA}
            strokeWidth={2}
            dot={<Ponto />}
            activeDot={{ r: 6 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

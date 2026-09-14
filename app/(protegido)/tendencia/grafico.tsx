"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type Ponto = {
  data: string;
  rotulo: string;
  /** Frequência regular. `null` nas datas que só têm evento especial. */
  regular: number | null;
  /** Evento especial naquela data. `null` quando não há. */
  evento: number | null;
  nomeEvento: string | null;
};

// Cores fixas em vez de tokens do tema: o SVG do gráfico não herda as classes
// do Tailwind, e estes tons têm contraste suficiente no claro e no escuro.
const AZUL = "#3b82f6";
const VIOLETA = "#a78bfa";
const CINZA = "#94a3b8";

function Caixa({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Ponto }>;
}) {
  const ponto = payload?.[0]?.payload;
  if (!active || !ponto) return null;

  return (
    <div className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="font-medium">{ponto.rotulo}</p>
      {ponto.regular !== null ? (
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Culto: <span className="font-medium">{ponto.regular}</span>
        </p>
      ) : null}
      {ponto.evento !== null ? (
        <p className="mt-1 text-violet-700 dark:text-violet-300">
          {ponto.nomeEvento}: <span className="font-medium">{ponto.evento}</span>
        </p>
      ) : null}
    </div>
  );
}

export function Grafico({
  pontos,
  mostrarEventos,
}: {
  pontos: Ponto[];
  mostrarEventos: boolean;
}) {
  return (
    <div className="h-64 w-full sm:h-80 lg:h-[26rem]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={pontos}
          margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
        >
          <CartesianGrid stroke={CINZA} strokeOpacity={0.25} vertical={false} />
          <XAxis
            dataKey="rotulo"
            tick={{ fontSize: 11, fill: CINZA }}
            tickLine={false}
            axisLine={{ stroke: CINZA, strokeOpacity: 0.4 }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: CINZA }}
            tickLine={false}
            axisLine={false}
            width={44}
            allowDecimals={false}
          />
          <Tooltip content={<Caixa />} />

          {/* connectNulls: a linha atravessa as datas que só têm evento, em vez
              de se partir em pedaços. */}
          <Line
            type="monotone"
            dataKey="regular"
            stroke={AZUL}
            strokeWidth={2}
            dot={{ r: 2.5, fill: AZUL }}
            activeDot={{ r: 4 }}
            connectNulls
            isAnimationActive={false}
          />

          {/* Eventos especiais como marcadores soltos: nunca entram na linha. */}
          {mostrarEventos ? (
            <Scatter
              dataKey="evento"
              fill={VIOLETA}
              shape="diamond"
              isAnimationActive={false}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

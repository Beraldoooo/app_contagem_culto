"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { EstadoAcao } from "./acoes";

type Tom = "neutro" | "perigo" | "atencao";

const ESTILO_GATILHO: Record<Tom, string> = {
  neutro:
    "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
  atencao:
    "border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40",
  perigo:
    "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40",
};

const ESTILO_CONFIRMAR: Record<Tom, string> = {
  neutro: "bg-blue-600 hover:bg-blue-700",
  atencao: "bg-amber-600 hover:bg-amber-700",
  perigo: "bg-red-600 hover:bg-red-700",
};

function BotaoConfirmar({ tom, rotulo }: { tom: Tom; rotulo: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`h-9 rounded-lg px-3 text-sm font-medium text-white transition disabled:opacity-60 ${ESTILO_CONFIRMAR[tom]}`}
    >
      {pending ? "Aplicando…" : rotulo}
    </button>
  );
}

/**
 * Botão que não aplica nada no primeiro clique: abre um painel dizendo
 * exatamente o que vai acontecer e espera a confirmação.
 */
export function AcaoConfirmada({
  acao,
  campos,
  rotulo,
  pergunta,
  consequencia,
  rotuloConfirmar,
  tom = "neutro",
  desabilitado,
}: {
  acao: (estado: EstadoAcao, formData: FormData) => Promise<EstadoAcao>;
  campos: Record<string, string>;
  rotulo: string;
  pergunta: string;
  consequencia?: string;
  rotuloConfirmar: string;
  tom?: Tom;
  desabilitado?: boolean;
}) {
  const [estado, enviar] = useActionState<EstadoAcao, FormData>(acao, {});
  const [aberto, setAberto] = useState(false);

  // Sucesso fecha o painel por derivação, sem efeito colateral. Em geral a
  // linha se move de seção logo depois, e a etiqueta atualizada já é o retorno.
  if (estado.ok) {
    return (
      <p
        role="status"
        className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
      >
        ✓ {estado.ok}
      </p>
    );
  }

  if (!aberto) {
    return (
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          disabled={desabilitado}
          onClick={() => setAberto(true)}
          className={`h-9 rounded-lg border px-3 text-sm font-medium transition disabled:opacity-40 ${ESTILO_GATILHO[tom]}`}
        >
          {rotulo}
        </button>
        {estado.erro ? (
          <p role="alert" className="text-xs text-red-700 dark:text-red-400">
            {estado.erro}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      action={enviar}
      className="flex flex-col gap-2 rounded-lg border border-slate-300 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950"
    >
      {Object.entries(campos).map(([nome, valor]) => (
        <input key={nome} type="hidden" name={nome} value={valor} />
      ))}

      <p className="text-sm font-medium">{pergunta}</p>
      {consequencia ? (
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {consequencia}
        </p>
      ) : null}

      {estado.erro ? (
        <p role="alert" className="text-xs text-red-700 dark:text-red-400">
          {estado.erro}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <BotaoConfirmar tom={tom} rotulo={rotuloConfirmar} />
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="h-9 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

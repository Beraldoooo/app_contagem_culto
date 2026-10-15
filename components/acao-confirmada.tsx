"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { classesBotao } from "@/components/ui/botao";

/** Formato comum das Server Actions que passam por confirmação. */
export type EstadoAcao = {
  erro?: string;
  ok?: string;
};

type Tom = "neutro" | "perigo" | "atencao";

const ESTILO_GATILHO: Record<Tom, string> = {
  neutro: "border-borda-forte text-texto hover:bg-superficie-suave",
  atencao: "border-aviso/40 text-aviso-texto hover:bg-aviso-suave",
  perigo: "border-perigo/40 text-perigo-texto hover:bg-perigo-suave",
};

const ESTILO_CONFIRMAR: Record<Tom, string> = {
  neutro: classesBotao({ tamanho: "sm" }),
  // O botão principal com a cor de aviso no lugar do azul.
  atencao: classesBotao({ tamanho: "sm" })
    .replace("bg-marca", "bg-aviso")
    .replace("hover:bg-marca-forte", "hover:opacity-90"),
  perigo: classesBotao({ variante: "perigo", tamanho: "sm" }),
};

function BotaoConfirmar({ tom, rotulo }: { tom: Tom; rotulo: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={ESTILO_CONFIRMAR[tom]}
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
        className="rounded-campo bg-sucesso-suave px-3 py-2 text-xs text-sucesso-texto"
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
          className={`h-9 rounded-campo border bg-superficie px-3 text-sm font-medium transition disabled:opacity-40 ${ESTILO_GATILHO[tom]}`}
        >
          {rotulo}
        </button>
        {estado.erro ? (
          <p role="alert" className="text-xs text-perigo-texto">
            {estado.erro}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      action={enviar}
      className="flex flex-col gap-2 rounded-campo border border-borda bg-superficie-suave p-3"
    >
      {Object.entries(campos).map(([nome, valor]) => (
        <input key={nome} type="hidden" name={nome} value={valor} />
      ))}

      <p className="text-sm font-medium">{pergunta}</p>
      {consequencia ? (
        <p className="text-xs text-texto-2">
          {consequencia}
        </p>
      ) : null}

      {estado.erro ? (
        <p role="alert" className="text-xs text-perigo-texto">
          {estado.erro}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <BotaoConfirmar tom={tom} rotulo={rotuloConfirmar} />
        <button
          type="button"
          onClick={() => setAberto(false)}
          className={classesBotao({ variante: "discreto", tamanho: "sm" })}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

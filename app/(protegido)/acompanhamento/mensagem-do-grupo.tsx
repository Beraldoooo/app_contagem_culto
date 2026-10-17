"use client";

import { useState } from "react";

import { TextoCopiavel } from "@/components/texto-copiavel";
import { Cartao, RotuloCartao, classesRotulo } from "@/components/ui/base";
import { FiltroData } from "@/components/ui/filtro";
import {
  mensagemDetalhada,
  mensagemSimples,
  type CultoResumido,
} from "@/lib/contagem";

export type CultoDaMensagem = CultoResumido & { id: string; nome: string };

/**
 * Monta a mensagem do grupo a partir do que foi SALVO no lançamento.
 *
 * Regra geral, sem prender a dia da semana: com mais de um culto lançado na
 * data, aparece a escolha dos cultos; com um só (quarta, quinta), só
 * Simples/Detalhada. Na quarta a detalhada já vem marcada — é a única que se
 * manda lá.
 */
export function MensagemDoGrupo({
  data,
  diaSemana,
  cultos,
}: {
  data: string;
  diaSemana: number;
  cultos: CultoDaMensagem[];
}) {
  const [marcados, setMarcados] = useState<Set<string>>(
    () => new Set(cultos.map((c) => c.id)),
  );
  const [tipo, setTipo] = useState<"simples" | "detalhada">(
    diaSemana === 3 ? "detalhada" : "simples",
  );

  if (cultos.length === 0) {
    return (
      <p className="rounded-campo bg-superficie-suave px-3.5 py-3 text-sm text-texto-2">
        Nenhum culto lançado nesta data.
      </p>
    );
  }

  const escolhidos = cultos.filter((c) => marcados.has(c.id));
  const texto =
    tipo === "simples"
      ? mensagemSimples(data, diaSemana, escolhidos)
      : mensagemDetalhada(data, diaSemana, escolhidos);

  function alternar(id: string) {
    setMarcados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {cultos.length > 1 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className={`mb-1 ${classesRotulo}`}>Cultos</legend>
          <div className="flex flex-wrap gap-2">
            {cultos.map((c) => (
              <label
                key={c.id}
                className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-campo border px-3.5 text-sm transition ${
                  marcados.has(c.id)
                    ? "border-marca bg-marca-suave font-medium text-marca-texto"
                    : "border-borda-forte text-texto-2"
                }`}
              >
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--marca)]"
                  checked={marcados.has(c.id)}
                  onChange={() => alternar(c.id)}
                />
                {c.rotulo}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className={`mb-1 ${classesRotulo}`}>Mensagem</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["simples", "detalhada"] as const).map((t) => (
            <label
              key={t}
              className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-campo border text-sm transition ${
                tipo === t
                  ? "border-marca bg-marca-suave font-medium text-marca-texto"
                  : "border-borda-forte text-texto-2"
              }`}
            >
              <input
                type="radio"
                name="tipo-mensagem"
                className="sr-only"
                checked={tipo === t}
                onChange={() => setTipo(t)}
              />
              {t === "simples" ? "Simples" : "Detalhada"}
            </label>
          ))}
        </div>
      </fieldset>

      {escolhidos.length === 0 ? (
        <p className="rounded-campo bg-aviso-suave px-3.5 py-3 text-sm text-aviso-texto">
          Marque pelo menos um culto.
        </p>
      ) : (
        <TextoCopiavel texto={texto} />
      )}
    </div>
  );
}

/** Cartão da seção, com o seletor de data (GET, mantém os outros filtros). */
export function CartaoMensagem({
  children,
  data,
  hoje,
  outros,
}: {
  children: React.ReactNode;
  data: string;
  hoje: string;
  outros: Record<string, string>;
}) {
  return (
    <Cartao as="section" className="flex flex-col gap-4">
      <div>
        <RotuloCartao>Mensagem para o grupo</RotuloCartao>
        <p className="mt-1 text-xs text-texto-3">
          Sai pronta, com os números salvos no lançamento.
        </p>
      </div>
      <form className="flex gap-2" action="/acompanhamento">
        {Object.entries(outros).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <FiltroData
          rotulo="Data"
          id="data-mensagem"
          name="data"
          defaultValue={data}
          max={hoje}
          className="flex-1"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-campo border border-borda-forte px-4 text-sm font-medium text-texto transition hover:bg-superficie-suave"
        >
          Abrir
        </button>
      </form>
      {children}
    </Cartao>
  );
}

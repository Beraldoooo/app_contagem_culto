"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";

import { AcaoConfirmada } from "@/components/acao-confirmada";
import { classesCampo, Selo as Etiqueta } from "@/components/ui/base";
import { classesBotao } from "@/components/ui/botao";
import { formatarHorario } from "@/lib/datas";

import {
  excluirContagem,
  salvarContagem,
  type EstadoContagem,
} from "./acoes";

export type HorarioDoDia = {
  id: string;
  nome: string;
  horario: string;
  ehEvento: boolean;
  quantidade: number | null;
};

function BotaoSalvar({ jaLancado }: { jaLancado: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={classesBotao()}
    >
      {pending ? "Salvando…" : jaLancado ? "Atualizar" : "Salvar"}
    </button>
  );
}

function Cabecalho({ horario }: { horario: HorarioDoDia }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="flex items-center gap-2 text-lg font-semibold">
        {formatarHorario(horario.horario)}
        {horario.ehEvento ? (
          <Etiqueta tom="evento">Evento</Etiqueta>
        ) : null}
      </span>
      <span className="truncate text-sm text-texto-2">
        {horario.nome}
      </span>
    </div>
  );
}

function Selo({ quantidade }: { quantidade: number | null }) {
  // Mostra o número que está NO BANCO. O campo abaixo é o que a pessoa está
  // digitando; se outro aparelho lançar este horário, o selo entrega a verdade.
  return quantidade !== null ? (
    <Etiqueta tom="sucesso">✓ {quantidade}</Etiqueta>
  ) : (
    <Etiqueta tom="aviso">pendente</Etiqueta>
  );
}

/**
 * Um card por horário, com formulário próprio.
 *
 * Cada card salva sozinho: são Server Actions independentes, então lançar o
 * culto das 8h não depende de o das 10h estar preenchido — que é justamente
 * como a contagem acontece ao longo do domingo.
 */
export function CartaoHorario({
  horario,
  podeEditar,
  podeExcluir,
}: {
  horario: HorarioDoDia;
  podeEditar: boolean;
  /** Excluir é do Administrador Geral, como manda a RLS. */
  podeExcluir: boolean;
}) {
  const [estado, enviar] = useActionState<EstadoContagem, FormData>(
    salvarContagem,
    {},
  );
  const campoId = useId();
  const jaLancado = horario.quantidade !== null;

  const borda = jaLancado ? "border-sucesso/40" : "border-borda";

  if (!podeEditar) {
    return (
      <li
        className={`flex items-center justify-between gap-3 rounded-cartao border bg-superficie p-5 shadow-cartao ${borda}`}
      >
        <Cabecalho horario={horario} />
        {jaLancado ? (
          <span className="shrink-0 text-right">
            <span className="block text-2xl font-bold tabular-nums">
              {horario.quantidade}
            </span>
            <span className="block text-xs text-texto-3">
              pessoas
            </span>
          </span>
        ) : (
          <Selo quantidade={null} />
        )}
      </li>
    );
  }

  return (
    <li
      className={`flex flex-col gap-4 rounded-cartao border bg-superficie p-5 shadow-cartao ${borda}`}
    >
      <div className="flex items-start justify-between gap-3">
        <Cabecalho horario={horario} />
        <Selo quantidade={horario.quantidade} />
      </div>

      <form action={enviar} className="flex flex-col gap-2">
        <input type="hidden" name="evento_id" value={horario.id} />

        <div className="flex items-center gap-2">
          <label htmlFor={campoId} className="sr-only">
            {`Pessoas presentes às ${formatarHorario(horario.horario)}`}
          </label>
          <input
            id={campoId}
            name="quantidade"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            required
            placeholder="0"
            defaultValue={horario.quantidade ?? ""}
            className={`${classesCampo} text-lg font-semibold tabular-nums`}
          />
          <BotaoSalvar jaLancado={jaLancado} />
        </div>

        {estado.erro ? (
          <p role="alert" className="text-xs text-perigo-texto">
            {estado.erro}
          </p>
        ) : null}
        {estado.ok ? (
          <p role="status" className="text-xs text-sucesso-texto">
            ✓ {estado.ok}
          </p>
        ) : null}
      </form>

      {podeExcluir && jaLancado ? (
        <AcaoConfirmada
          acao={excluirContagem}
          campos={{ evento_id: horario.id }}
          rotulo="Excluir lançamento"
          tom="perigo"
          pergunta={`Excluir o lançamento das ${formatarHorario(horario.horario)}?`}
          consequencia={`As ${horario.quantidade} pessoas somem do total do dia e o horário volta a ficar pendente. Para registrar que ninguém veio, salve 0 em vez de excluir.`}
          rotuloConfirmar="Sim, excluir"
        />
      ) : null}
    </li>
  );
}

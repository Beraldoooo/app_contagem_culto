import Link from "next/link";

import { Cartao, RotuloCartao } from "@/components/ui/base";
import {
  formatarVariacao,
  mesDe,
  segundaDaSemana,
  semanasEntre,
  somarDias,
  type CultoFixo,
} from "@/lib/crescimento";
import { formatarDataCurta, hojeISO } from "@/lib/datas";
import { createClient } from "@/lib/supabase/server";

/** Quantas semanas para trás procurar a última semana fechada com lançamento. */
const SEMANAS = 26;

const ddmm = (data: string) => formatarDataCurta(data).slice(0, 5);

/**
 * A frase de tendência do Início: a última semana fechada contra a anterior,
 * com a mesma conta do Acompanhamento (culto com o mesmo culto, só os que
 * aconteceram nas duas; semana em andamento fica de fora). Leva ao
 * Acompanhamento, no mês dessa semana.
 */
export async function TendenciaSemanal() {
  const supabase = await createClient();
  const hoje = hojeISO();
  const de = somarDias(segundaDaSemana(hoje), -7 * SEMANAS);

  // ~5 cultos fixos por semana: bem abaixo do limite de 1000 linhas.
  const [{ data, error }, horarios] = await Promise.all([
    supabase
      .from("resumo_por_evento")
      .select("data, horario, situacao, total_simples")
      .eq("tipo", "culto_fixo")
      .gte("data", de)
      .lte("data", hoje)
      .order("data")
      .order("horario"),
    supabase.from("horarios_padrao").select("id", { count: "exact", head: true }).eq("ativo", true),
  ]);

  if (error) return null;
  const cultosPorSemana = horarios.count ?? 0;

  const cultos: CultoFixo[] = (data ?? []).map((l) => ({
    data: l.data,
    horario: l.horario,
    situacao: l.situacao,
    total: l.total_simples,
  }));
  const fechadas = semanasEntre(somarDias(de, 7), hoje, cultos, hoje).filter(
    (s) => !s.emAndamento && s.total !== null,
  );
  // Semana com só parte dos cultos lançados (ex.: só a quarta) daria uma
  // frase baseada num culto só. A frase usa a última semana completa e avisa
  // da incompleta que veio depois.
  const completa = (s: (typeof fechadas)[number]) =>
    s.lancados + s.semCulto >= cultosPorSemana;
  const semana = fechadas.filter(completa).at(-1) ?? fechadas.at(-1);
  const incompleta = fechadas.at(-1) !== semana ? fechadas.at(-1) : undefined;

  if (!semana) {
    return (
      <Cartao as="section" className="flex flex-col gap-2">
        <RotuloCartao>Tendência</RotuloCartao>
        <p className="text-sm text-texto-2">
          A comparação semana com semana aparece aqui assim que houver uma semana
          inteira lançada.
        </p>
      </Cartao>
    );
  }

  const ultimaFechada = somarDias(segundaDaSemana(hoje), -1);
  const v = semana.variacao;
  const cor = v === null || v === 0 ? "text-texto" : v > 0 ? "text-sucesso-texto" : "text-perigo-texto";

  return (
    <Link
      href={`/acompanhamento?periodo=mes&escopo=geral&mes=${mesDe(semana.fim)}`}
      className="group block rounded-cartao border border-borda bg-superficie p-5 shadow-cartao transition hover:border-borda-forte"
    >
      <div className="flex items-baseline justify-between gap-3">
        <RotuloCartao>Tendência</RotuloCartao>
        <span className="text-xs text-texto-3">
          Semana de {ddmm(semana.inicio)} a {ddmm(semana.fim)}
        </span>
      </div>

      <p className="mt-3 text-lg leading-snug">
        {v === null ? (
          <span className="text-texto-2">
            {semana.total!.toLocaleString("pt-BR")} pessoas · sem semana anterior para comparar
          </span>
        ) : (
          <>
            <span className={`font-bold tabular-nums ${cor}`}>{formatarVariacao(v)}</span>{" "}
            <span className="text-texto-2">em relação à semana anterior</span>
          </>
        )}
      </p>

      <p className="mt-1 text-xs text-texto-3">
        {semana.total!.toLocaleString("pt-BR")} pessoas nos cultos fixos
        {v !== null
          ? ` · ${semana.cultosComparados} ${semana.cultosComparados === 1 ? "culto comparado" : "cultos comparados"}`
          : ""}
        {semana.pendentes
          ? ` · falta lançar ${semana.pendentes} ${semana.pendentes === 1 ? "culto" : "cultos"}`
          : ""}
      </p>

      {incompleta ? (
        <p className="mt-2 text-xs text-aviso-texto">
          A semana de {ddmm(incompleta.inicio)} a {ddmm(incompleta.fim)} tem só {incompleta.lancados} de{" "}
          {cultosPorSemana} cultos lançados e ficou fora da frase.
        </p>
      ) : semana.fim !== ultimaFechada ? (
        <p className="mt-2 text-xs text-aviso-texto">
          É a última semana com lançamentos. As semanas depois dela ainda não foram lançadas.
        </p>
      ) : null}

      <p className="mt-3 text-sm font-medium text-marca-texto group-hover:underline underline-offset-4">
        Ver o acompanhamento →
      </p>
    </Link>
  );
}

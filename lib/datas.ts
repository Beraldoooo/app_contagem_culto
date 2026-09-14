/**
 * Utilitários de data.
 *
 * ARMADILHA: `new Date("2026-09-13")` é interpretado como meia-noite em UTC.
 * No Brasil (UTC-3) isso vira 21h do dia 12 — e o dia da semana sai errado,
 * justamente o que decide quais cultos existem. Por isso nada aqui constrói
 * Date a partir da string ISO direto: sempre pelos componentes, em hora local.
 */

export const DIAS_SEMANA = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
] as const;

const FORMATO_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Converte "2026-09-13" em Date local (meia-noite no fuso de quem usa). */
export function dataLocal(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

/** `true` se a string é uma data ISO existente de verdade (rejeita 31/02). */
export function ehDataValida(iso: string): boolean {
  if (!FORMATO_ISO.test(iso)) return false;
  const [ano, mes, dia] = iso.split("-").map(Number);
  const d = new Date(ano, mes - 1, dia);
  return (
    d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia
  );
}

/** 0 = domingo … 6 = sábado. Mesma convenção do `extract(dow)` do Postgres. */
export function diaDaSemana(iso: string): number {
  return dataLocal(iso).getDay();
}

/** Data de hoje no fuso de quem usa, em ISO. */
export function hojeISO(): string {
  const agora = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}`;
}

/** "2026-09-13" -> "domingo, 13 de setembro de 2026" */
export function formatarDataLonga(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dataLocal(iso));
}

/** "2026-09-13" -> "13/09/2026" */
export function formatarDataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** "08:00:00" -> "8h"  ·  "19:30:00" -> "19h30" */
export function formatarHorario(horario: string): string {
  const [h, m] = horario.split(":");
  const hora = Number(h);
  return Number(m) === 0 ? `${hora}h` : `${hora}h${m}`;
}

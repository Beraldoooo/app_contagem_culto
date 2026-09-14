"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Mantém a tela em dia com o que outras pessoas lançaram, sem recarregar.
 *
 * Usa `router.refresh()` em intervalo em vez de websocket (Supabase Realtime):
 * para dois ou três contadores na mesma manhã, uma consulta a cada 30s custa
 * quase nada, não exige habilitar replicação no painel e não tem conexão para
 * cair no wi-fi da igreja. O refresh mescla o novo conteúdo do servidor sem
 * perder o que a pessoa está digitando.
 *
 * Enquanto a aba está escondida (celular bloqueado, app em segundo plano) o
 * relógio para — e volta a atualizar assim que a tela é aberta de novo.
 */
export function AtualizacaoAutomatica({
  intervaloSegundos = 30,
}: {
  intervaloSegundos?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    let relogio: ReturnType<typeof setInterval> | undefined;

    const parar = () => {
      if (relogio) clearInterval(relogio);
      relogio = undefined;
    };

    const iniciar = () => {
      parar();
      relogio = setInterval(() => router.refresh(), intervaloSegundos * 1000);
    };

    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "visible") {
        // Voltou para a tela: não espera o próximo ciclo.
        router.refresh();
        iniciar();
      } else {
        parar();
      }
    };

    if (document.visibilityState === "visible") iniciar();
    document.addEventListener("visibilitychange", aoMudarVisibilidade);

    return () => {
      parar();
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    };
  }, [router, intervaloSegundos]);

  return null;
}

"use client";

import { useEffect, useRef, useState } from "react";

import { Botao } from "@/components/ui/botao";

/**
 * Bloco de texto com botão "Copiar" — as mensagens do grupo.
 *
 * Alguns navegadores recusam a área de transferência. Em vez de falhar calado,
 * o texto é selecionado para a pessoa copiar na mão.
 */
export function TextoCopiavel({ texto }: { texto: string }) {
  const [aviso, setAviso] = useState<string | null>(null);
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pre = useRef<HTMLPreElement>(null);

  useEffect(() => () => {
    if (relogio.current) clearTimeout(relogio.current);
  }, []);

  function avisar(mensagem: string) {
    setAviso(mensagem);
    if (relogio.current) clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setAviso(null), 2500);
  }

  function selecionar() {
    const alvo = pre.current;
    if (!alvo) return avisar("Copie o texto à mão.");
    const selecao = window.getSelection();
    const faixa = document.createRange();
    faixa.selectNodeContents(alvo);
    selecao?.removeAllRanges();
    selecao?.addRange(faixa);
    avisar("Selecionado — use Cmd+C");
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      avisar("Copiado");
    } catch {
      selecionar();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <pre
        ref={pre}
        className="overflow-x-auto whitespace-pre-wrap break-words rounded-campo bg-superficie-suave px-3.5 py-3 font-mono text-xs leading-relaxed text-texto-2"
      >
        {texto}
      </pre>
      {/* Tamanho cheio (44px): é um botão de dedo, no celular. */}
      <Botao onClick={copiar} larguraTotal>
        Copiar mensagem
      </Botao>
      {aviso ? (
        <p
          role="status"
          className="rounded-campo bg-sucesso-suave px-3 py-1.5 text-center text-xs text-sucesso-texto"
        >
          {aviso}
        </p>
      ) : null}
    </div>
  );
}

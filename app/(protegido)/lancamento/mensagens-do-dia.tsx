"use client";

import { useEffect, useRef, useState } from "react";

import { Cartao, RotuloCartao } from "@/components/ui/base";
import { Botao } from "@/components/ui/botao";

/**
 * As duas mensagens do grupo, prontas para copiar.
 *
 * O texto vem do servidor, montado a partir do que está SALVO — não do que
 * está sendo digitado ao lado. Copiar um número que ainda não foi gravado
 * mandaria para o grupo algo que o app não tem.
 */
export function MensagensDoDia({
  simples,
  detalhada,
}: {
  simples: string;
  detalhada: string;
}) {
  if (!simples) return null;

  return (
    <section className="flex flex-col gap-3">
      <Mensagem
        titulo="Frequência do dia"
        nota="Acumula os cultos já lançados."
        texto={simples}
      />
      <Mensagem
        titulo="Frequência detalhada"
        nota="Com quem serviu."
        texto={detalhada}
      />
    </section>
  );
}

function Mensagem({
  titulo,
  nota,
  texto,
}: {
  titulo: string;
  nota: string;
  texto: string;
}) {
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

  // Alguns navegadores recusam a área de transferência. Em vez de falhar
  // calado, selecionamos o texto para a pessoa copiar na mão.
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
    <Cartao as="article">
      <div className="flex items-start justify-between gap-3">
        <div>
          <RotuloCartao>{titulo}</RotuloCartao>
          <p className="mt-1 text-xs text-texto-3">{nota}</p>
        </div>
        {/* Tamanho cheio (44px): é um botão de dedo, no celular, e o "sm"
            deixava o alvo em 36px. */}
        <Botao onClick={copiar}>Copiar</Botao>
      </div>

      {aviso ? (
        <p
          role="status"
          className="mt-3 rounded-campo bg-sucesso-suave px-3 py-1.5 text-xs text-sucesso-texto"
        >
          {aviso}
        </p>
      ) : null}

      <pre
        ref={pre}
        className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-campo bg-superficie-suave px-3.5 py-3 font-mono text-xs leading-relaxed text-texto-2"
      >
        {texto}
      </pre>
    </Cartao>
  );
}

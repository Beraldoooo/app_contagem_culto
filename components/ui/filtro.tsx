"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from "react";

import { IconeConfirmado, IconeSetaBaixo } from "@/components/icones";

/**
 * Filtros no formato "Rótulo: Valor ▾" — caixa arredondada, rótulo em cinza e
 * valor em negrito.
 *
 * A lista é desenhada aqui, e não pelo <select> do navegador: o menu nativo
 * sai com a cara do sistema (Windows, macOS), fora do padrão do app, e só
 * abria clicando em cima do valor. Aqui a caixa inteira abre a lista.
 */
const caixa =
  "relative flex h-11 w-full min-w-0 items-center gap-1.5 rounded-campo border border-borda bg-superficie pl-3.5 text-left text-sm shadow-cartao transition hover:border-borda-forte focus-visible:border-marca focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-marca/15";

export type OpcaoFiltro = { valor: string; rotulo: string };

export function FiltroSelect({
  rotulo,
  id,
  name,
  opcoes,
  defaultValue,
  className = "",
}: {
  rotulo: string;
  id: string;
  name: string;
  opcoes: OpcaoFiltro[];
  defaultValue?: string;
  className?: string;
}) {
  const [valor, setValor] = useState(defaultValue ?? opcoes[0]?.valor ?? "");
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const idLista = useId();

  const indiceAtual = Math.max(0, opcoes.findIndex((o) => o.valor === valor));
  const escolhida = opcoes[indiceAtual];

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return;
    function fora(e: PointerEvent) {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [aberto]);

  // Mantém a opção ativa visível em listas longas (meses).
  useEffect(() => {
    if (!aberto) return;
    lista.current
      ?.querySelector<HTMLElement>(`[data-indice="${ativo}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [aberto, ativo]);

  function abrir() {
    setAtivo(indiceAtual);
    setAberto(true);
  }

  function escolher(i: number) {
    setValor(opcoes[i].valor);
    setAberto(false);
  }

  function teclado(e: KeyboardEvent<HTMLButtonElement>) {
    if (!aberto) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        abrir();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtivo((i) => Math.min(opcoes.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setAtivo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setAtivo(opcoes.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      escolher(ativo);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setAberto(false);
    }
  }

  return (
    <div ref={raiz} className={`relative min-w-0 ${className}`}>
      <input type="hidden" name={name} value={valor} />
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={idLista}
        aria-activedescendant={aberto ? `${idLista}-${ativo}` : undefined}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={teclado}
        className={`${caixa} cursor-pointer pr-9 ${aberto ? "border-marca ring-3 ring-marca/15" : ""}`}
      >
        <span className="shrink-0 text-texto-2">{rotulo}:</span>
        <span className="min-w-0 flex-1 truncate font-semibold text-texto">
          {escolhida?.rotulo}
        </span>
        <IconeSetaBaixo
          tamanho={16}
          className={`pointer-events-none absolute right-3 text-texto-2 transition ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {aberto ? (
        <ul
          ref={lista}
          id={idLista}
          role="listbox"
          aria-label={rotulo}
          className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-72 min-w-full overflow-y-auto rounded-campo border border-borda bg-superficie p-1 shadow-flutuante"
        >
          {opcoes.map((o, i) => {
            const selecionada = o.valor === valor;
            return (
              <li
                key={o.valor}
                id={`${idLista}-${i}`}
                data-indice={i}
                role="option"
                aria-selected={selecionada}
                onPointerEnter={() => setAtivo(i)}
                onClick={() => escolher(i)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[calc(var(--radius-campo)-4px)] px-3 text-sm ${
                  i === ativo ? "bg-superficie-suave" : ""
                } ${selecionada ? "font-semibold text-marca-texto" : "text-texto"}`}
              >
                <span className="truncate">{o.rotulo}</span>
                {selecionada ? <IconeConfirmado tamanho={16} className="shrink-0" /> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Campo de data no mesmo formato. Clicar em qualquer ponto da caixa abre o
 * calendário (antes só abria clicando no ícone ou nos números).
 */
export function FiltroData({
  rotulo,
  id,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { rotulo: string; id: string }) {
  const campo = useRef<HTMLInputElement>(null);
  return (
    <label
      htmlFor={id}
      onClick={(e) => {
        e.preventDefault();
        abrirCalendario(campo.current);
      }}
      className={`${caixa} cursor-pointer pr-2 focus-within:border-marca focus-within:ring-3 focus-within:ring-marca/15 ${className}`}
    >
      <span className="shrink-0 text-texto-2">{rotulo}:</span>
      <input
        ref={campo}
        id={id}
        type="date"
        className="min-w-0 flex-1 cursor-pointer bg-transparent font-semibold text-texto outline-none"
        {...props}
      />
    </label>
  );
}

/** showPicker não existe em navegador antigo; aí o foco basta. */
export function abrirCalendario(campo: HTMLInputElement | null) {
  if (!campo) return;
  campo.focus();
  try {
    campo.showPicker?.();
  } catch {
    // Alguns navegadores só deixam abrir a partir de um clique direto.
  }
}

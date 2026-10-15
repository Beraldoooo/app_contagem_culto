"use client";

import { useSyncExternalStore } from "react";

import { CHAVE_TEMA, COR_BARRA, TEMA_PADRAO, type Tema } from "@/lib/tema";

const ouvintes = new Set<() => void>();

function assinar(aoMudar: () => void) {
  ouvintes.add(aoMudar);
  return () => ouvintes.delete(aoMudar);
}

function temaAtual(): Tema {
  return document.documentElement.dataset.tema === "claro" ? "claro" : "escuro";
}

function aplicar(tema: Tema) {
  document.documentElement.dataset.tema = tema;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", COR_BARRA[tema]);
  try {
    localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    // Navegação privada sem storage: vale só até fechar a aba.
  }
  ouvintes.forEach((ouvinte) => ouvinte());
}

const OPCOES: { valor: Tema; rotulo: string; fundo: string; cartao: string; linha: string }[] = [
  { valor: "escuro", rotulo: "Escuro", fundo: "#0b0d12", cartao: "#14171e", linha: "#343a47" },
  { valor: "claro", rotulo: "Claro", fundo: "#f4f5f7", cartao: "#ffffff", linha: "#d4d8e0" },
];

/** Escolha entre tema escuro e claro, com uma miniatura de cada um. */
export function SeletorTema() {
  // No servidor não há como saber a escolha: parte do padrão e corrige na
  // hidratação, sem aviso de divergência.
  const tema = useSyncExternalStore(assinar, temaAtual, () => TEMA_PADRAO);

  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-2 gap-3 sm:max-w-md">
      {OPCOES.map((opcao) => {
        const ativo = tema === opcao.valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => aplicar(opcao.valor)}
            className={`flex flex-col gap-3 rounded-cartao border-2 p-3 text-left transition ${
              ativo ? "border-marca" : "border-borda hover:border-borda-forte"
            }`}
          >
            <span
              aria-hidden
              className="flex h-20 gap-1.5 rounded-campo p-2"
              style={{ background: opcao.fundo }}
            >
              <span className="w-1/4 rounded-md" style={{ background: opcao.cartao }} />
              <span className="flex flex-1 flex-col gap-1.5">
                <span className="h-1/2 rounded-md" style={{ background: opcao.cartao }} />
                <span className="flex-1 rounded-md border" style={{ background: opcao.cartao, borderColor: opcao.linha }} />
              </span>
            </span>
            <span className="flex items-center gap-2 text-sm font-medium">
              <span
                aria-hidden
                className={`flex size-4 items-center justify-center rounded-full border-2 ${
                  ativo ? "border-marca" : "border-borda-forte"
                }`}
              >
                {ativo ? <span className="size-2 rounded-full bg-marca" /> : null}
              </span>
              {opcao.rotulo}
            </span>
          </button>
        );
      })}
    </div>
  );
}

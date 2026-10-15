"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { IconeFechar, IconeReticencias } from "@/components/icones";

import {
  estaAtivo,
  itemPorHref,
  itensVisiveis,
  type ItemMenu,
  type Permissoes,
} from "./itens";

/** Itens fixos da barra; o resto vai para o painel "Mais". */
const NA_BARRA = ["/", "/historico", "/relatorios"];
const CENTRAL = "/lancamento";

const classeAba =
  "flex h-full flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition";

function Aba({ item, ativo }: { item: ItemMenu; ativo: boolean }) {
  const Icone = item.icone;
  return (
    <Link
      href={item.href}
      aria-current={ativo ? "page" : undefined}
      className={`${classeAba} ${ativo ? "text-marca-texto" : "text-texto-3"}`}
    >
      <Icone tamanho={22} strokeWidth={ativo ? 2.2 : 1.9} />
      {item.rotuloCurto}
    </Link>
  );
}

/**
 * Navegação do celular: barra fixa embaixo, com "Lançar contagem" em destaque
 * no centro para quem pode lançar. Some no desktop (lg+), onde entra o menu
 * lateral.
 */
export function BarraInferior({
  permissoes,
  conta,
}: {
  permissoes: Permissoes;
  conta: ReactNode;
}) {
  const pathname = usePathname();
  // Guarda em qual página o painel foi aberto: navegar fecha sozinho, sem
  // precisar de efeito para sincronizar.
  const [abertoEm, setAbertoEm] = useState<string | null>(null);
  const aberto = abertoEm === pathname;

  const visiveis = itensVisiveis(permissoes);
  const extras = visiveis.filter(
    (i) => !NA_BARRA.includes(i.href) && i.href !== CENTRAL,
  );
  const maisAtivo = extras.some((i) => estaAtivo(pathname, i.href));

  const [inicio, historico, relatorios] = NA_BARRA.map(itemPorHref);
  const central = permissoes.lanca ? itemPorHref(CENTRAL) : null;

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbertoEm(null);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    <div className="lg:hidden">
      {aberto ? (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setAbertoEm(null)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mais opções"
            className="relative flex flex-col gap-4 rounded-t-3xl bg-superficie px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-flutuante"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 text-base font-semibold">Mais opções</span>
              <button
                type="button"
                onClick={() => setAbertoEm(null)}
                aria-label="Fechar"
                className="flex size-10 items-center justify-center rounded-full text-texto-2 hover:bg-superficie-suave"
              >
                <IconeFechar />
              </button>
            </div>

            {extras.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {extras.map((item) => {
                  const Icone = item.icone;
                  const ativo = estaAtivo(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={ativo ? "page" : undefined}
                        className={`flex h-12 items-center gap-3 rounded-campo px-3 text-[15px] font-medium ${
                          ativo
                            ? "bg-marca-suave text-marca-texto"
                            : "text-texto hover:bg-superficie-suave"
                        }`}
                      >
                        <Icone />
                        {item.rotulo}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            <div className="border-t border-borda pt-4">{conta}</div>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Menu principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch px-2">
          <Aba item={inicio} ativo={estaAtivo(pathname, inicio.href)} />
          <Aba item={historico} ativo={estaAtivo(pathname, historico.href)} />

          {central ? (
            <div className="flex flex-1 justify-center">
              <Link
                href={central.href}
                aria-label={central.rotulo}
                aria-current={estaAtivo(pathname, central.href) ? "page" : undefined}
                className="-mt-5 flex size-14 items-center justify-center rounded-full bg-marca text-white shadow-flutuante ring-4 ring-fundo transition active:scale-95"
              >
                <central.icone tamanho={26} strokeWidth={2.4} />
              </Link>
            </div>
          ) : null}

          <Aba item={relatorios} ativo={estaAtivo(pathname, relatorios.href)} />

          <button
            type="button"
            onClick={() => setAbertoEm(pathname)}
            aria-expanded={aberto}
            className={`${classeAba} ${maisAtivo ? "text-marca-texto" : "text-texto-3"}`}
          >
            <IconeReticencias tamanho={22} />
            Mais
          </button>
        </div>
      </nav>
    </div>
  );
}

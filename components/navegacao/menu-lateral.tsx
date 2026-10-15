"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Marca } from "@/components/marca";

import { estaAtivo, itensVisiveis, type ItemMenu, type Permissoes } from "./itens";

function LinkMenu({ item, ativo }: { item: ItemMenu; ativo: boolean }) {
  const Icone = item.icone;

  return (
    <Link
      href={item.href}
      aria-current={ativo ? "page" : undefined}
      className={`flex h-11 items-center gap-3 rounded-campo px-3 text-[15px] font-medium transition ${
        ativo
          ? "bg-marca-suave text-marca-texto"
          : "text-texto-2 hover:bg-superficie-suave hover:text-texto"
      }`}
    >
      <Icone />
      {item.rotulo}
    </Link>
  );
}

/** Menu fixo à esquerda, só no desktop (lg+). */
export function MenuLateral({
  permissoes,
  conta,
}: {
  permissoes: Permissoes;
  /** Bloco com e-mail, papel e Sair — renderizado no servidor. */
  conta: ReactNode;
}) {
  const pathname = usePathname();
  const itens = itensVisiveis(permissoes);
  const principais = itens.filter((i) => i.grupo === "principal");
  const administracao = itens.filter((i) => i.grupo === "administracao");

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-borda bg-superficie px-4 py-6 lg:flex">
      <div className="px-3 pb-8">
        <Marca />
      </div>

      <nav aria-label="Menu principal" className="flex flex-1 flex-col gap-8 overflow-y-auto">
        <ul className="flex flex-col gap-1">
          {principais.map((item) => (
            <li key={item.href}>
              <LinkMenu item={item} ativo={estaAtivo(pathname, item.href)} />
            </li>
          ))}
        </ul>

        {administracao.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-texto-3">
              Administração
            </p>
            <ul className="flex flex-col gap-1">
              {administracao.map((item) => (
                <li key={item.href}>
                  <LinkMenu item={item} ativo={estaAtivo(pathname, item.href)} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </nav>

      <div className="border-t border-borda pt-4">{conta}</div>
    </aside>
  );
}

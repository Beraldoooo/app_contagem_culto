import {
  IconeConfiguracoes,
  IconeEvento,
  IconeHistorico,
  IconeInicio,
  IconeMais,
  IconeRelatorios,
  IconeUsuarios,
  type Icone,
} from "@/components/icones";

/** O que o usuário logado pode fazer — calculado no servidor pelo layout. */
export type Permissoes = {
  /** Contador ou Administrador Geral. */
  lanca: boolean;
  /** Administrador Geral. */
  admin: boolean;
};

export type ItemMenu = {
  href: string;
  rotulo: string;
  /** Rótulo da barra inferior do celular, onde o espaço é curto. */
  rotuloCurto: string;
  icone: Icone;
  /** "conta" fica no pé do menu lateral, junto do e-mail e do Sair. */
  grupo: "principal" | "administracao" | "conta";
  visivel: (p: Permissoes) => boolean;
};

/**
 * Lista única de destinos, usada pelo menu lateral (desktop) e pela barra
 * inferior (celular). Esconder um item aqui é só conforto visual: quem barra
 * de verdade são as checagens no servidor e a RLS.
 */
export const ITENS_MENU: ItemMenu[] = [
  {
    href: "/",
    rotulo: "Início",
    rotuloCurto: "Início",
    icone: IconeInicio,
    grupo: "principal",
    visivel: () => true,
  },
  {
    href: "/lancamento",
    rotulo: "Lançar contagem",
    rotuloCurto: "Lançar",
    icone: IconeMais,
    grupo: "principal",
    visivel: (p) => p.lanca,
  },
  {
    href: "/historico",
    rotulo: "Histórico",
    rotuloCurto: "Histórico",
    icone: IconeHistorico,
    grupo: "principal",
    visivel: () => true,
  },
  {
    href: "/evento-especial",
    rotulo: "Eventos especiais",
    rotuloCurto: "Eventos",
    icone: IconeEvento,
    grupo: "principal",
    visivel: (p) => p.lanca,
  },
  {
    href: "/relatorios",
    rotulo: "Relatórios",
    rotuloCurto: "Relatórios",
    icone: IconeRelatorios,
    grupo: "principal",
    visivel: () => true,
  },
  {
    href: "/admin/usuarios",
    rotulo: "Usuários",
    rotuloCurto: "Usuários",
    icone: IconeUsuarios,
    grupo: "administracao",
    visivel: (p) => p.admin,
  },
  {
    href: "/configuracoes",
    rotulo: "Configurações",
    rotuloCurto: "Configurações",
    icone: IconeConfiguracoes,
    grupo: "conta",
    visivel: () => true,
  },
];

export function itensVisiveis(p: Permissoes) {
  return ITENS_MENU.filter((item) => item.visivel(p));
}

export function itemPorHref(href: string) {
  const item = ITENS_MENU.find((i) => i.href === href);
  if (!item) throw new Error(`Item de menu inexistente: ${href}`);
  return item;
}

/** "/" só casa com a home; os demais casam com subpáginas também. */
export function estaAtivo(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Tema da interface: escuro (padrão) ou claro.
 *
 * A escolha fica no `localStorage` do aparelho — é uma preferência de tela,
 * não um dado da conta, então não passa pelo banco. Um script inline no
 * <head> aplica o tema antes da primeira pintura, sem piscar branco.
 */
export type Tema = "escuro" | "claro";

export const TEMA_PADRAO: Tema = "escuro";
export const CHAVE_TEMA = "tema";

/** Cor da barra de status do celular: a mesma da faixa do topo (--superficie). */
export const COR_BARRA: Record<Tema, string> = {
  escuro: "#14171e",
  claro: "#ffffff",
};

/** Roda no <head>, antes do conteúdo ser pintado. */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  CHAVE_TEMA,
)});if(t!=="claro"&&t!=="escuro")return;document.documentElement.setAttribute("data-tema",t);var c=${JSON.stringify(
  COR_BARRA,
)}[t];document.addEventListener("DOMContentLoaded",function(){var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",c)})}catch(e){}})()`;

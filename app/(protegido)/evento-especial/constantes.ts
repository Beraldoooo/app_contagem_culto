/**
 * Valor do select que significa "cadastrar um tipo novo".
 *
 * Fica fora de acoes.ts porque um arquivo "use server" só pode exportar
 * funções assíncronas — e a tela e a ação precisam do mesmo valor.
 */
export const NOVO_TIPO = "__novo__";

"use client";

import { IconeAlerta } from "@/components/icones";
import { Botao, LinkBotao } from "@/components/ui/botao";
import { TelaCentralizada } from "@/components/ui/tela-centralizada";

/**
 * Tela mostrada quando algo quebra. Fala do que a pessoa pode fazer, não do
 * que o servidor achou — a mensagem técnica fica no console.
 */
export function ErroAmigavel({
  titulo = "Algo deu errado",
  descricao = "Não conseguimos carregar esta tela. Pode ter sido uma falha momentânea de conexão.",
  aoTentarNovamente,
}: {
  titulo?: string;
  descricao?: string;
  aoTentarNovamente?: () => void;
}) {
  return (
    <TelaCentralizada icone={IconeAlerta} tom="aviso" titulo={titulo} descricao={descricao}>
      <div className="flex flex-col gap-2">
        {aoTentarNovamente ? (
          <Botao onClick={aoTentarNovamente} larguraTotal>
            Tentar de novo
          </Botao>
        ) : null}
        <LinkBotao href="/" variante="secundario" larguraTotal>
          Voltar ao início
        </LinkBotao>
      </div>

      <p className="text-xs text-texto-3">
        Se continuar acontecendo, avise o responsável pelo aplicativo.
      </p>
    </TelaCentralizada>
  );
}

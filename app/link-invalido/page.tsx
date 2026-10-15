import type { Metadata } from "next";
import { IconeAlerta } from "@/components/icones";
import { LinkBotao } from "@/components/ui/botao";
import { TelaCentralizada } from "@/components/ui/tela-centralizada";

export const metadata: Metadata = { title: "Link inválido" };

type Motivo = {
  titulo: string;
  texto: string;
  acao?: { href: string; rotulo: string };
};

const MOTIVOS: Record<string, Motivo> = {
  expirado: {
    titulo: "Link expirado",
    texto:
      "Este link de confirmação já foi usado ou passou da validade. Peça um novo tentando entrar de novo — o Supabase reenvia a confirmação.",
  },
  "outro-aparelho": {
    titulo: "Abra o link no mesmo aparelho",
    texto:
      "Este link precisa ser aberto no mesmo navegador em que a conta foi criada. Abra o e-mail naquele aparelho e clique de novo.",
  },
  incompleto: {
    titulo: "Link incompleto",
    texto:
      "O endereço veio sem as informações de confirmação. Abra o link direto do e-mail, sem copiar e colar pela metade.",
  },
  "recuperacao-expirada": {
    titulo: "Link de recuperação expirado",
    texto:
      "Este link para criar uma nova senha já foi usado ou passou de 1 hora. Peça um novo — leva menos de um minuto.",
    acao: { href: "/recuperar-senha", rotulo: "Pedir um novo link" },
  },
  "recuperacao-outro-aparelho": {
    titulo: "Abra o link no mesmo aparelho",
    texto:
      "Este link precisa ser aberto no mesmo navegador em que você pediu a recuperação. Abra o e-mail naquele aparelho ou peça um novo link aqui.",
    acao: { href: "/recuperar-senha", rotulo: "Pedir um novo link" },
  },
  configuracao: {
    titulo: "Aplicativo não configurado",
    texto:
      "As chaves do Supabase não estão definidas neste servidor. Avise o responsável pelo aplicativo.",
  },
};

const PADRAO: Motivo = {
  titulo: "Não foi possível confirmar",
  texto: "Tente entrar novamente para receber um novo link de confirmação.",
};

export default async function LinkInvalidoPage({
  searchParams,
}: PageProps<"/link-invalido">) {
  const { motivo } = await searchParams;
  const chave = typeof motivo === "string" ? motivo : "";
  const { titulo, texto, acao } = MOTIVOS[chave] ?? PADRAO;

  return (
    <TelaCentralizada icone={IconeAlerta} tom="aviso" titulo={titulo} descricao={texto}>
      <div className="flex flex-col gap-2">
        {acao ? (
          <LinkBotao href={acao.href} larguraTotal>
            {acao.rotulo}
          </LinkBotao>
        ) : null}
        <LinkBotao href="/login" variante={acao ? "secundario" : "principal"} larguraTotal>
          Ir para o login
        </LinkBotao>
      </div>
    </TelaCentralizada>
  );
}

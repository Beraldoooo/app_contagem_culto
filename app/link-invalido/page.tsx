import type { Metadata } from "next";
import { IconeAlerta } from "@/components/icones";
import { LinkBotao } from "@/components/ui/botao";
import { TelaCentralizada } from "@/components/ui/tela-centralizada";

export const metadata: Metadata = { title: "Link inválido" };

const MOTIVOS: Record<string, { titulo: string; texto: string }> = {
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
  configuracao: {
    titulo: "Aplicativo não configurado",
    texto:
      "As chaves do Supabase não estão definidas neste servidor. Avise o responsável pelo aplicativo.",
  },
};

const PADRAO = {
  titulo: "Não foi possível confirmar",
  texto: "Tente entrar novamente para receber um novo link de confirmação.",
};

export default async function LinkInvalidoPage({
  searchParams,
}: PageProps<"/link-invalido">) {
  const { motivo } = await searchParams;
  const chave = typeof motivo === "string" ? motivo : "";
  const { titulo, texto } = MOTIVOS[chave] ?? PADRAO;

  return (
    <TelaCentralizada icone={IconeAlerta} tom="aviso" titulo={titulo} descricao={texto}>
      <LinkBotao href="/login" larguraTotal>
        Ir para o login
      </LinkBotao>
    </TelaCentralizada>
  );
}

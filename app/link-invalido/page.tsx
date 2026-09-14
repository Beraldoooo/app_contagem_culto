import type { Metadata } from "next";
import Link from "next/link";

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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-10">
      <div className="flex flex-col gap-2">
        <span
          aria-hidden
          className="flex size-11 items-center justify-center rounded-full bg-amber-100 text-xl dark:bg-amber-950/60"
        >
          ⚠️
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{texto}</p>
      </div>

      <Link
        href="/login"
        className="flex h-11 items-center justify-center rounded-lg bg-slate-900 px-4 text-base font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
      >
        Ir para o login
      </Link>
    </main>
  );
}

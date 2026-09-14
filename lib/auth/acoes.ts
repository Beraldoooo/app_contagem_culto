"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { COOKIE_LEMBRAR } from "@/lib/supabase/cookies";
import { createClient } from "@/lib/supabase/server";

export type EstadoFormulario = {
  erro?: string;
  aviso?: string;
};

const UM_ANO = 400 * 24 * 60 * 60;

/** Traduz os erros do Supabase Auth para algo que faça sentido pra quem lê. */
function traduzirErro(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Já existe uma conta com este e-mail. Tente entrar.";
  if (m.includes("password should be at least"))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "E-mail inválido.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
  return "Não foi possível concluir. Tente novamente.";
}

function destinoSeguro(valor: FormDataEntryValue | null): string {
  const destino = typeof valor === "string" ? valor : "";
  // Só caminhos internos: bloqueia redirect para outro site.
  return destino.startsWith("/") && !destino.startsWith("//") ? destino : "/";
}

export async function entrar(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const lembrar = formData.get("lembrar") === "on";
  const destino = destinoSeguro(formData.get("redirecionar"));

  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha." };
  }

  // Grava a preferência antes de autenticar: o proxy lê este cookie para
  // decidir se os cookies de sessão renovados expiram ou não.
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_LEMBRAR, lembrar ? "1" : "0", {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    ...(lembrar ? { maxAge: UM_ANO } : {}),
  });

  const supabase = await createClient(lembrar);
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    return { erro: traduzirErro(error.message) };
  }

  redirect(destino);
}

export async function cadastrar(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha." };
  }
  if (senha.length < 6) {
    return { erro: "A senha precisa ter pelo menos 6 caracteres." };
  }
  if (senha !== confirmacao) {
    return { erro: "As senhas não conferem." };
  }

  // Conta nova nunca "lembra" por padrão — a escolha é feita no login.
  const supabase = await createClient(false);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
  });

  if (error) {
    return { erro: traduzirErro(error.message) };
  }

  // Sem sessão = o projeto exige confirmação de e-mail.
  if (!data.session) {
    return {
      aviso:
        "Conta criada. Confirme seu e-mail pelo link que enviamos e depois faça login — " +
        "seu acesso ainda precisará ser aprovado pelo administrador.",
    };
  }

  // O profile é criado pelo trigger `handle_new_user` como pendente/pendente.
  redirect("/aguardando");
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_LEMBRAR);

  redirect("/login");
}

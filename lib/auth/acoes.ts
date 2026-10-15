"use server";

import { cookies, headers } from "next/headers";
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
  if (m.includes("should be different from the old password"))
    return "A nova senha precisa ser diferente da atual.";
  if (m.includes("auth session missing") || m.includes("session not found"))
    return "Sua sessão expirou. Peça um novo link de recuperação.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
  // Falha de rede não é erro de senha: dizer "tente novamente" faria a pessoa
  // desconfiar do que digitou em vez de olhar para a conexão.
  if (
    m.includes("failed to fetch") ||
    m.includes("network") ||
    m.includes("fetch failed") ||
    m.includes("timeout") ||
    m.includes("enotfound") ||
    m.includes("econnrefused")
  ) {
    return "Não conseguimos falar com o servidor. Verifique sua conexão e tente de novo.";
  }
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
    // Para onde o link de confirmação volta. Sem isto, o modelo padrão do
    // Supabase manda para a raiz do site, que não sabe trocar o código por
    // sessão. (O modelo com token_hash do README monta o mesmo destino.)
    options: { emailRedirectTo: `${await origemDoApp()}/auth/confirm?next=/aguardando` },
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

/** Endereço do app nesta requisição (https://… em produção, localhost em dev). */
async function origemDoApp(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocolo =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

/**
 * Envia o e-mail com o link para criar uma senha nova.
 *
 * A resposta é a mesma exista a conta ou não: dizer "esse e-mail não está
 * cadastrado" ajudaria alguém a descobrir quem usa o app.
 */
export async function pedirRecuperacao(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { erro: "Informe o e-mail da sua conta." };

  const supabase = await createClient(false);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Usado pelo template padrão do Supabase; o template com token_hash (ver
    // README) monta o mesmo destino a partir da Site URL.
    redirectTo: `${await origemDoApp()}/auth/confirm?next=/nova-senha`,
  });

  if (error) {
    const traduzido = traduzirErro(error.message);
    // Só falha de rede ou excesso de tentativas viram erro na tela; o resto
    // cai na mesma resposta neutra.
    if (/conexão|tentativas/.test(traduzido)) return { erro: traduzido };
    console.error("Falha ao pedir recuperação de senha:", error.message);
  }

  return {
    aviso:
      "Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha. " +
      "Confira a caixa de entrada e também o spam. O link vale por 1 hora.",
  };
}

/**
 * Grava a senha nova de quem está logado — vindo do link de recuperação ou
 * de "Alterar senha" em Configurações.
 */
export async function definirNovaSenha(
  _estadoAnterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (senha.length < 6) {
    return { erro: "A senha precisa ter pelo menos 6 caracteres." };
  }
  if (senha !== confirmacao) {
    return { erro: "As senhas não conferem." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { erro: "Sua sessão expirou. Peça um novo link de recuperação." };
  }

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { erro: traduzirErro(error.message) };

  return { aviso: "Senha alterada. Use a nova senha nas próximas vezes que entrar." };
}

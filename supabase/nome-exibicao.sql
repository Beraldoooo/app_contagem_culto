-- =============================================================================
-- Nome de exibição dos usuários
--
-- Para quem já rodou o schema.sql antes desta mudança: rode este arquivo no
-- SQL Editor do Supabase. O schema.sql já inclui tudo isto para instalações
-- novas. É idempotente: rodar de novo não quebra nada.
--
-- O que faz:
--   1. Cria a coluna profiles.nome (opcional, até 60 caracteres).
--   2. O cadastro passa a gravar o nome informado no formulário.
--   3. Cria definir_meu_nome(), para cada pessoa trocar só o próprio nome —
--      sem abrir UPDATE em profiles, que deixaria alguém mudar o próprio papel.
-- =============================================================================

alter table public.profiles add column if not exists nome text;

alter table public.profiles drop constraint if exists profiles_nome_tamanho;
alter table public.profiles
  add constraint profiles_nome_tamanho
  check (nome is null or char_length(nome) between 1 and 60);

comment on column public.profiles.nome is
  'Nome de exibição (aparece no menu no lugar do e-mail). Opcional.';

-- O app manda o nome em options.data do signUp, que o Supabase guarda em
-- raw_user_meta_data. Vazio vira null; texto longo é cortado em 60.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, nome, role, status)
  values (
    new.id,
    new.email,
    left(nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''), 60),
    'pendente',
    'pendente'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Troca o nome de quem está logado, e só o nome. Funciona para qualquer
-- status (inclusive pendente), já que é só a própria linha.
create or replace function public.definir_meu_nome(p_nome text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  limpo text := nullif(btrim(p_nome), '');
begin
  if (select auth.uid()) is null then
    raise exception 'Sessão inválida.';
  end if;
  if limpo is not null and char_length(limpo) > 60 then
    raise exception 'O nome pode ter no máximo 60 caracteres.';
  end if;

  update public.profiles
     set nome = limpo
   where id = (select auth.uid());
end;
$$;

revoke execute on function public.definir_meu_nome(text) from public;
grant execute on function public.definir_meu_nome(text) to authenticated;

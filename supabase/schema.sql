-- =============================================================================
-- Contagem Culto — schema do banco (Supabase / PostgreSQL)
--
-- Como usar: cole este arquivo inteiro no SQL Editor do Supabase e execute.
-- O script é idempotente — pode ser rodado novamente sem quebrar o que já existe.
--
-- Depois de rodar, veja a seção "BOOTSTRAP" no final para promover o primeiro
-- Administrador Geral.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TIPOS (ENUMS)
-- -----------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum (
      'admin_geral',
      'contador',
      'visualizador',
      'pendente'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type public.user_status as enum (
      'pendente',
      'aprovado',
      'banido'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'evento_tipo') then
    create type public.evento_tipo as enum (
      'culto_fixo',
      'evento_especial'
    );
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- 2. TABELAS
-- -----------------------------------------------------------------------------

-- 2.1 profiles ---------------------------------------------------------------
-- Uma linha por usuário do auth.users. Criada automaticamente no cadastro
-- (trigger on_auth_user_created) já como 'pendente'/'pendente'.

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  role       public.user_role   not null default 'pendente',
  status     public.user_status not null default 'pendente',
  created_at timestamptz        not null default now()
);

comment on table  public.profiles        is 'Perfil e permissões de cada usuário.';
comment on column public.profiles.role   is 'Papel: admin_geral, contador, visualizador ou pendente.';
comment on column public.profiles.status is 'pendente (aguardando aprovação), aprovado ou banido.';

create index if not exists profiles_role_status_idx
  on public.profiles (role, status);

-- 2.2 horarios_padrao --------------------------------------------------------
-- Seed de REFERÊNCIA dos cultos fixos. Não são eventos: só descrevem quais
-- horários existem em cada dia da semana. As linhas em "eventos" são geradas
-- sob demanda quando alguém escolhe uma data (ver public.gerar_eventos_fixos).

create table if not exists public.horarios_padrao (
  id          uuid primary key default gen_random_uuid(),
  dia_semana  smallint not null check (dia_semana between 0 and 6), -- 0=domingo ... 6=sábado
  horario     time     not null,
  nome        text     not null,
  ativo       boolean  not null default true,
  created_at  timestamptz not null default now(),
  constraint horarios_padrao_dia_horario_key unique (dia_semana, horario)
);

comment on table public.horarios_padrao is
  'Referência dos cultos fixos (Domingo 8h/10h/18h e Quinta 20h). Não gera linhas em eventos automaticamente.';

-- 2.3 eventos ----------------------------------------------------------------
-- Um culto ou evento em uma data + horário específicos.

create table if not exists public.eventos (
  id         uuid primary key default gen_random_uuid(),
  tipo       public.evento_tipo not null,
  nome       text not null check (length(btrim(nome)) > 0),
  data       date not null,
  horario    time not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  -- evita cadastrar duas vezes o mesmo culto na mesma data/horário, mas
  -- permite dois eventos distintos no mesmo horário (nomes diferentes).
  constraint eventos_data_horario_nome_key unique (data, horario, nome)
);

comment on table  public.eventos      is 'Cultos fixos e eventos especiais, por data e horário.';
comment on column public.eventos.tipo is 'culto_fixo entra no comparativo regular; evento_especial fica separado.';

create index if not exists eventos_data_idx       on public.eventos (data desc);
create index if not exists eventos_tipo_data_idx  on public.eventos (tipo, data desc);

-- 2.4 contagens --------------------------------------------------------------
-- O número de pessoas de um evento. Uma contagem por evento: relançar o mesmo
-- horário é UPDATE, não uma segunda linha (evita total inflado).

create table if not exists public.contagens (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null unique references public.eventos (id) on delete cascade,
  quantidade  integer not null check (quantidade >= 0),
  lancado_por uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table  public.contagens           is 'Contagem de presença de cada evento.';
comment on column public.contagens.evento_id is 'UNIQUE: um evento tem no máximo uma contagem — corrigir é UPDATE.';

create index if not exists contagens_lancado_por_idx on public.contagens (lancado_por);

-- -----------------------------------------------------------------------------
-- 3. FUNÇÕES AUXILIARES DE PERMISSÃO
--
-- SECURITY DEFINER de propósito: as políticas de RLS de "profiles" precisam
-- consultar "profiles", e uma consulta comum entraria em recursão infinita.
-- Como o dono da tabela ignora RLS, a função quebra o ciclo.
-- -----------------------------------------------------------------------------

create or replace function public.perfil_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

create or replace function public.perfil_status()
returns public.user_status
language sql
stable
security definer
set search_path = ''
as $$
  select p.status from public.profiles p where p.id = (select auth.uid());
$$;

-- Aprovado e com papel de leitura ou acima: 'visualizador' e acima.
create or replace function public.tem_acesso()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'aprovado'
      and p.role in ('visualizador', 'contador', 'admin_geral')
  );
$$;

-- 'contador' e acima: pode lançar contagens e criar eventos.
create or replace function public.pode_lancar()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'aprovado'
      and p.role in ('contador', 'admin_geral')
  );
$$;

-- 'admin_geral': acesso total.
create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'aprovado'
      and p.role = 'admin_geral'
  );
$$;

revoke execute on function
  public.perfil_role(), public.perfil_status(),
  public.tem_acesso(), public.pode_lancar(), public.eh_admin()
  from public;

grant execute on function
  public.perfil_role(), public.perfil_status(),
  public.tem_acesso(), public.pode_lancar(), public.eh_admin()
  to authenticated;

-- -----------------------------------------------------------------------------
-- 4. TRIGGERS
-- -----------------------------------------------------------------------------

-- 4.1 Cria o profile assim que alguém se cadastra (cadastro aberto, mas o
--     usuário nasce 'pendente' e não enxerga nada além do próprio perfil).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role, status)
  values (new.id, new.email, 'pendente', 'pendente')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4.2 Mantém contagens.updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contagens_set_updated_at on public.contagens;
create trigger contagens_set_updated_at
  before update on public.contagens
  for each row execute function public.set_updated_at();

-- 4.3 Impede que o último Administrador Geral ativo perca o acesso — sem esta
--     trava, um clique errado deixaria o projeto sem ninguém que possa aprovar
--     usuários, e só a service_role conseguiria consertar.
create or replace function public.protege_ultimo_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ainda_ativo boolean;
begin
  if old.role = 'admin_geral' and old.status = 'aprovado' then
    if tg_op = 'DELETE'
       or new.role <> 'admin_geral'
       or new.status <> 'aprovado' then
      select exists (
        select 1 from public.profiles p
        where p.role = 'admin_geral'
          and p.status = 'aprovado'
          and p.id <> old.id
      ) into ainda_ativo;

      if not ainda_ativo then
        raise exception
          'Não é possível remover o último Administrador Geral ativo. Promova outro administrador antes.';
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protege_ultimo_admin on public.profiles;
create trigger profiles_protege_ultimo_admin
  before update or delete on public.profiles
  for each row execute function public.protege_ultimo_admin();

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
--
-- Regra geral: nada é visível por padrão. Um usuário 'pendente' ou 'banido'
-- enxerga somente a própria linha em profiles — nenhum evento, nenhuma contagem.
-- Todas as políticas são restritas ao papel "authenticated": anônimo não lê nada.
-- -----------------------------------------------------------------------------

-- 5.0 Privilégios de tabela ---------------------------------------------------
-- Num projeto Supabase novo o papel "authenticated" já recebe estes privilégios
-- por padrão; declarar aqui deixa o script autossuficiente. Quem decide o
-- acesso de fato são as políticas abaixo. "anon" não recebe nada.

grant select, insert, update, delete
  on public.profiles, public.horarios_padrao, public.eventos, public.contagens
  to authenticated;

alter table public.profiles       enable row level security;
alter table public.horarios_padrao enable row level security;
alter table public.eventos        enable row level security;
alter table public.contagens      enable row level security;

-- 5.1 profiles ---------------------------------------------------------------

drop policy if exists "profiles: lê o próprio perfil"      on public.profiles;
drop policy if exists "profiles: admin lê todos"           on public.profiles;
drop policy if exists "profiles: admin altera role/status" on public.profiles;
drop policy if exists "profiles: admin remove"             on public.profiles;

-- Qualquer usuário autenticado lê o próprio perfil — inclusive 'pendente' e
-- 'banido', para o app conseguir mostrar "sua conta aguarda aprovação".
create policy "profiles: lê o próprio perfil"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: admin lê todos"
  on public.profiles for select
  to authenticated
  using (public.eh_admin());

-- Só o Administrador Geral muda role e status (aprovar, promover, banir).
-- Ninguém edita o próprio papel.
create policy "profiles: admin altera role/status"
  on public.profiles for update
  to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());

create policy "profiles: admin remove"
  on public.profiles for delete
  to authenticated
  using (public.eh_admin());

-- Sem política de INSERT: profiles só nasce pelo trigger on_auth_user_created.

-- 5.2 horarios_padrao --------------------------------------------------------

drop policy if exists "horarios: leitura para aprovados" on public.horarios_padrao;
drop policy if exists "horarios: admin gerencia"         on public.horarios_padrao;

create policy "horarios: leitura para aprovados"
  on public.horarios_padrao for select
  to authenticated
  using (public.tem_acesso());

create policy "horarios: admin gerencia"
  on public.horarios_padrao for all
  to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());

-- 5.3 eventos ----------------------------------------------------------------

drop policy if exists "eventos: leitura para aprovados" on public.eventos;
drop policy if exists "eventos: contador cria"          on public.eventos;
drop policy if exists "eventos: contador edita"         on public.eventos;
drop policy if exists "eventos: admin remove"           on public.eventos;

-- 'visualizador' e acima leem.
create policy "eventos: leitura para aprovados"
  on public.eventos for select
  to authenticated
  using (public.tem_acesso());

-- 'contador' e acima criam (inclusive os cultos fixos gerados por data).
create policy "eventos: contador cria"
  on public.eventos for insert
  to authenticated
  with check (
    public.pode_lancar()
    and (created_by = (select auth.uid()) or public.eh_admin())
  );

create policy "eventos: contador edita"
  on public.eventos for update
  to authenticated
  using (public.pode_lancar())
  with check (public.pode_lancar());

-- Apagar um evento apaga a contagem junto (cascade): só o admin.
create policy "eventos: admin remove"
  on public.eventos for delete
  to authenticated
  using (public.eh_admin());

-- 5.4 contagens --------------------------------------------------------------

drop policy if exists "contagens: leitura para aprovados" on public.contagens;
drop policy if exists "contagens: contador lança"         on public.contagens;
drop policy if exists "contagens: contador corrige"       on public.contagens;
drop policy if exists "contagens: admin remove"           on public.contagens;

-- 'visualizador' e acima leem.
create policy "contagens: leitura para aprovados"
  on public.contagens for select
  to authenticated
  using (public.tem_acesso());

-- 'contador' e acima lançam, sempre em nome de si mesmos.
create policy "contagens: contador lança"
  on public.contagens for insert
  to authenticated
  with check (
    public.pode_lancar()
    and (lancado_por = (select auth.uid()) or public.eh_admin())
  );

-- 'contador' e acima corrigem qualquer contagem (o número certo importa mais
-- que quem digitou primeiro); o histórico de quem mexeu fica em updated_at.
create policy "contagens: contador corrige"
  on public.contagens for update
  to authenticated
  using (public.pode_lancar())
  with check (public.pode_lancar());

create policy "contagens: admin remove"
  on public.contagens for delete
  to authenticated
  using (public.eh_admin());

-- -----------------------------------------------------------------------------
-- 6. GERAÇÃO DINÂMICA DOS CULTOS FIXOS (usada na Fase 2)
--
-- Recebe uma data, cria em "eventos" só os horários fixos daquele dia da semana
-- que ainda não existem, e devolve os cultos fixos da data.
-- SECURITY INVOKER: roda com as permissões de quem chamou, então um
-- 'visualizador' não consegue criar nada por aqui.
-- -----------------------------------------------------------------------------

create or replace function public.gerar_eventos_fixos(p_data date)
returns setof public.eventos
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.eventos (tipo, nome, data, horario, created_by)
  select 'culto_fixo', h.nome, p_data, h.horario, (select auth.uid())
  from public.horarios_padrao h
  where h.ativo
    and h.dia_semana = extract(dow from p_data)::smallint
  on conflict (data, horario, nome) do nothing;

  return query
    select e.*
    from public.eventos e
    where e.data = p_data
      and e.tipo = 'culto_fixo'
    order by e.horario;
end;
$$;

revoke execute on function public.gerar_eventos_fixos(date) from public;
grant  execute on function public.gerar_eventos_fixos(date) to authenticated;

-- -----------------------------------------------------------------------------
-- 7. SEED — horários fixos padrão
--
-- Referência apenas. Domingo (dow = 0) 8h, 10h e 18h · Quinta (dow = 4) 20h.
-- -----------------------------------------------------------------------------

insert into public.horarios_padrao (dia_semana, horario, nome) values
  (0, '08:00', 'Culto Domingo 8h'),
  (0, '10:00', 'Culto Domingo 10h'),
  (0, '18:00', 'Culto Domingo 18h'),
  (4, '20:00', 'Culto Quinta 20h')
on conflict (dia_semana, horario) do nothing;

-- =============================================================================
-- BOOTSTRAP — primeiro Administrador Geral
--
-- Cadastre-se normalmente pelo app (ou em Authentication > Users), depois rode
-- o comando abaixo trocando o e-mail. Enquanto não existir um admin_geral,
-- ninguém consegue aprovar ninguém.
-- =============================================================================

-- update public.profiles
--    set role = 'admin_geral', status = 'aprovado'
--  where email = 'troque-pelo-seu-email@exemplo.com';

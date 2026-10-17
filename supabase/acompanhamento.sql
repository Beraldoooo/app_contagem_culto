-- =============================================================================
-- Acompanhamento: tipos de evento especial e "não teve culto"
--
-- Duas coisas que o cálculo de crescimento precisa (ver seção 0.2 do CLAUDE.md):
--
-- 1. TIPOS DE EVENTO. A Arena e o Culto Belas acontecem uma vez por mês, e são
--    comparados mês com mês, cada tipo com ele mesmo. Para isso o evento precisa
--    dizer de que tipo é — pelo nome livre não dá para agrupar.
-- 2. NÃO TEVE CULTO. Um culto que não aconteceu (Natal, por exemplo) não pode
--    contar como "pendente" nem como zero: sai da comparação sem alarme.
--
-- Rodar DEPOIS de schema.sql e contagem-por-categoria.sql.
-- Idempotente: rodar de novo não duplica nem perde nada.
-- Rodar no Supabase: SQL Editor > New query > Run.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. TIPOS DE EVENTO
-- -----------------------------------------------------------------------------

create table if not exists public.tipos_evento (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null check (length(trim(nome)) between 1 and 60),
  ativo      boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.tipos_evento is
  'Tipos de evento especial (Culto Arena, Culto Belas…), cadastrados uma vez e escolhidos ao criar o evento.';

-- "Culto Arena" e "culto arena" são o mesmo tipo.
create unique index if not exists tipos_evento_nome_unico
  on public.tipos_evento (lower(trim(nome)));

insert into public.tipos_evento (nome) values
  ('Culto Arena'),
  ('Culto Belas')
on conflict do nothing;

alter table public.tipos_evento enable row level security;

drop policy if exists "tipos: leitura para aprovados" on public.tipos_evento;
drop policy if exists "tipos: contador cadastra"      on public.tipos_evento;
drop policy if exists "tipos: contador edita"         on public.tipos_evento;
drop policy if exists "tipos: admin remove"           on public.tipos_evento;

create policy "tipos: leitura para aprovados"
  on public.tipos_evento for select
  to authenticated
  using (public.tem_acesso());

-- Quem cria o evento cadastra o tipo — senão o Leonardo teria que pedir ao
-- admin a cada evento novo.
create policy "tipos: contador cadastra"
  on public.tipos_evento for insert
  to authenticated
  with check (
    public.pode_lancar()
    and (created_by = (select auth.uid()) or public.eh_admin())
  );

create policy "tipos: contador edita"
  on public.tipos_evento for update
  to authenticated
  using (public.pode_lancar())
  with check (public.pode_lancar());

-- Apagar um tipo com eventos é recusado pela FK (on delete restrict); para
-- tirar da lista, desativa.
create policy "tipos: admin remove"
  on public.tipos_evento for delete
  to authenticated
  using (public.eh_admin());


-- -----------------------------------------------------------------------------
-- 2. EVENTOS: tipo e "não teve culto"
-- -----------------------------------------------------------------------------

alter table public.eventos
  add column if not exists tipo_evento_id uuid
    references public.tipos_evento (id) on delete restrict;

alter table public.eventos
  add column if not exists sem_culto boolean not null default false;

comment on column public.eventos.tipo_evento_id is
  'Tipo do evento especial. NULL em culto fixo — e em evento antigo sem tipo.';
comment on column public.eventos.sem_culto is
  'Não teve culto neste horário. Sai da comparação sem virar pendência nem zero.';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'eventos_tipo_so_em_especial') then
    alter table public.eventos
      add constraint eventos_tipo_so_em_especial
      check (tipo_evento_id is null or tipo = 'evento_especial');
  end if;
end$$;

create index if not exists eventos_tipo_evento_idx on public.eventos (tipo_evento_id);


-- -----------------------------------------------------------------------------
-- 3. "NÃO TEVE CULTO" e contagem não convivem
--
-- Ou o culto aconteceu e tem número, ou não aconteceu. Os dois juntos fariam o
-- mesmo horário entrar e sair da conta ao mesmo tempo.
-- -----------------------------------------------------------------------------

create or replace function public.contagem_exige_culto()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.eventos where id = new.evento_id and sem_culto) then
    raise exception 'Este horário está marcado como "não teve culto". Desmarque antes de lançar.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists contagens_exige_culto on public.contagens;
create trigger contagens_exige_culto
  before insert or update on public.contagens
  for each row execute function public.contagem_exige_culto();

create or replace function public.sem_culto_exige_vazio()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.sem_culto and not old.sem_culto and exists (
    select 1 from public.contagens c
     where c.evento_id = new.id and c.adultos is not null
  ) then
    raise exception 'Este horário já tem contagem lançada. Exclua a contagem antes de marcar "não teve culto".'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists eventos_sem_culto_exige_vazio on public.eventos;
create trigger eventos_sem_culto_exige_vazio
  before update of sem_culto on public.eventos
  for each row execute function public.sem_culto_exige_vazio();


-- -----------------------------------------------------------------------------
-- 4. RESUMO POR EVENTO — ganha tipo, "sem culto" e a situação
--
-- Recriado inteiro (a view de totais depende dele e cai junto no cascade).
-- As regras de soma são as mesmas de contagem-por-categoria.sql.
-- -----------------------------------------------------------------------------

drop view if exists public.resumo_por_evento cascade;

create view public.resumo_por_evento
with (security_invoker = true) as
with base as (
  select
    e.id          as evento_id,
    e.data,
    e.horario,
    e.tipo,
    e.nome,
    e.tipo_evento_id,
    te.nome       as tipo_evento,
    e.sem_culto,
    c.id          as contagem_id,
    c.adultos,
    c.homens,
    c.observacao,
    c.lancado_por,
    c.updated_at,
    sum(ci.publico)  filter (where i.soma_em = 'criancas')   as criancas,
    sum(ci.publico)  filter (where i.soma_em = 'pads')       as pads,
    sum(ci.publico)  filter (where i.soma_em = 'volts')      as volts,
    coalesce(sum(ci.servindo) filter (where i.grupo = 'fora'),     0) as servindo_fora,
    coalesce(sum(ci.servindo) filter (where i.grupo = 'dentro'),   0) as servindo_dentro,
    coalesce(sum(ci.servindo) filter (where i.grupo = 'pastoral'), 0) as pastoral
  from public.eventos e
  left join public.tipos_evento    te on te.id         = e.tipo_evento_id
  left join public.contagens       c  on c.evento_id   = e.id
  left join public.contagens_itens ci on ci.contagem_id = c.id
  left join public.itens_contagem  i  on i.id          = ci.item_id
  group by e.id, e.data, e.horario, e.tipo, e.nome, e.tipo_evento_id, te.nome, e.sem_culto,
           c.id, c.adultos, c.homens, c.observacao, c.lancado_por, c.updated_at
)
select
  b.*,
  (b.adultos is not null and not b.sem_culto) as lancado,
  case
    when b.sem_culto           then 'sem_culto'
    when b.adultos is not null then 'lancado'
    else                            'pendente'
  end as situacao,
  (coalesce(b.adultos,0) + coalesce(b.criancas,0)
   + coalesce(b.pads,0)  + coalesce(b.volts,0))::int as total_simples,
  (coalesce(b.adultos,0) + coalesce(b.criancas,0)
   + coalesce(b.pads,0)  + coalesce(b.volts,0)
   + b.servindo_fora + b.servindo_dentro + b.pastoral)::int as total_detalhado
from base b;

comment on view public.resumo_por_evento is
  'Um culto por linha, com as categorias somadas, os dois totais e a situação (lancado, sem_culto, pendente).';

grant select on public.resumo_por_evento to authenticated;


-- -----------------------------------------------------------------------------
-- 5. TOTAIS POR DATA — recriada (caiu no cascade), com "sem culto" à parte
-- -----------------------------------------------------------------------------

create view public.totais_por_data
with (security_invoker = true) as
select
  r.data,
  bool_or(r.tipo = 'culto_fixo')       as tem_culto_fixo,
  bool_or(r.tipo = 'evento_especial')  as tem_evento_especial,
  -- "horarios" conta só os que aconteceram: um culto que não houve não fica
  -- devendo lançamento.
  count(*) filter (where not r.sem_culto)::int as horarios,
  count(*) filter (where r.lancado)::int       as horarios_lancados,
  count(*) filter (where r.sem_culto)::int     as horarios_sem_culto,
  coalesce(sum(r.total_simples)   filter (where r.lancado), 0)::int as total,
  coalesce(sum(r.total_detalhado) filter (where r.lancado), 0)::int as total_detalhado,

  count(*) filter (where r.tipo = 'culto_fixo' and not r.sem_culto)::int as horarios_cultos,
  count(*) filter (where r.tipo = 'culto_fixo' and r.lancado)::int       as lancados_cultos,
  coalesce(sum(r.total_simples) filter (where r.tipo = 'culto_fixo' and r.lancado), 0)::int as total_cultos,

  count(*) filter (where r.tipo = 'evento_especial' and not r.sem_culto)::int as horarios_eventos,
  count(*) filter (where r.tipo = 'evento_especial' and r.lancado)::int       as lancados_eventos,
  coalesce(sum(r.total_simples) filter (where r.tipo = 'evento_especial' and r.lancado), 0)::int as total_eventos,

  coalesce(sum(r.homens) filter (where r.tipo = 'culto_fixo' and r.lancado), 0)::int as homens_cultos
from public.resumo_por_evento r
group by r.data;

comment on view public.totais_por_data is
  'Uma linha por data, com os totais separados por tipo. security_invoker: a RLS continua valendo para quem consulta.';

grant select on public.totais_por_data to authenticated;


-- -----------------------------------------------------------------------------
-- 6. CONFERÊNCIA
-- -----------------------------------------------------------------------------

select
  (select count(*) from public.tipos_evento)                       as tipos_de_evento,  -- 2
  (select count(*) from information_schema.columns
    where table_name = 'eventos' and column_name = 'sem_culto')     as coluna_sem_culto, -- 1
  (select count(*) from public.resumo_por_evento)                   as eventos;          -- 0

-- =============================================================================
-- Contagem por categoria e por ministério
--
-- Até aqui o app guardava UM número por horário (contagens.quantidade). A
-- igreja conta por categoria (Adultos, Crianças, PADS, Volts) e por ministério
-- (quem serviu dentro e fora), e manda duas mensagens diferentes no grupo, com
-- dois totais diferentes para o mesmo culto. Ver a seção 0.1 do CLAUDE.md.
--
-- Esta migração é ADITIVA de propósito: "quantidade" continua existindo, só
-- deixa de ser obrigatória. Assim o app que já está no ar não quebra enquanto
-- o código novo não sobe. A coluna sai depois, num script próprio.
--
-- Idempotente: rodar de novo não duplica nem perde nada.
-- Rodar no Supabase: SQL Editor > New query > Run.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. ITENS DE CONTAGEM
--
-- A lista do que se conta. Fica em tabela, e não no código, porque a igreja
-- muda de ministério com o tempo: em fev/2024 não existia "Adolescentes", que
-- apareceu em mar/2024. Categoria nova é uma linha aqui, não uma migração.
-- -----------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'item_grupo') then
    create type public.item_grupo as enum ('fora', 'dentro', 'pastoral');
  end if;
end$$;

comment on type public.item_grupo is
  'Onde a equipe serve. "pastoral" é separado de "dentro" porque as mensagens do grupo listam os pastores à parte.';

create table if not exists public.itens_contagem (
  id       uuid primary key default gen_random_uuid(),
  codigo   text    not null unique,
  nome     text    not null,
  grupo    public.item_grupo not null,

  -- Quais colunas o item usa na ficha. Estacionamento só tem gente servindo;
  -- "Crianças no culto" só tem público.
  tem_servindo boolean not null default true,
  tem_publico  boolean not null default false,

  -- Em qual linha do resumo o público deste item é somado. Berçário, Maternal,
  -- Kids e "Crianças no culto" somam em "Crianças"; PADS e Volts têm linha
  -- própria. NULL = não soma em lugar nenhum.
  soma_em  text check (soma_em in ('criancas', 'pads', 'volts')),

  ordem    smallint not null,
  ativo    boolean  not null default true,
  created_at timestamptz not null default now()
);

comment on table public.itens_contagem is
  'Referência do que se conta em cada culto: ministérios de fora, de dentro e a equipe pastoral.';

insert into public.itens_contagem (codigo, nome, grupo, tem_servindo, tem_publico, soma_em, ordem) values
  -- Fora do salão: duas colunas (quem serviu | quantas crianças havia).
  ('criancas_no_culto', 'Crianças no culto', 'fora',     false, true,  'criancas',  1),
  ('estacionamento',    'Estacionamento',    'fora',     true,  false, null,        2),
  ('bercario',          'Berçário',          'fora',     true,  true,  'criancas',  3),
  ('maternal',          'Maternal',          'fora',     true,  true,  'criancas',  4),
  ('kids',              'Kids',              'fora',     true,  true,  'criancas',  5),
  ('pads',              'Pads',              'fora',     true,  true,  'pads',      6),
  ('volts',             'Volts',             'fora',     true,  true,  'volts',     7),
  -- A equipe pastoral é "dentro", mas vai em linha própria nas mensagens.
  ('pastores',          'Pastores',          'pastoral', true,  false, null,        1),
  -- Dentro do salão: só quem serviu.
  ('louvor',            'Louvor',            'dentro',   true,  false, null,        1),
  ('projecao',          'Projeção',          'dentro',   true,  false, null,        2),
  ('audio',             'Áudio',             'dentro',   true,  false, null,        3),
  ('iluminacao',        'Iluminação',        'dentro',   true,  false, null,        4),
  ('midias',            'Mídias',            'dentro',   true,  false, null,        5),
  ('hospitalidade',     'Hospitalidade',     'dentro',   true,  false, null,        6),
  ('dizimos',           'Dízimos',           'dentro',   true,  false, null,        7),
  ('livraria',          'Livraria',          'dentro',   true,  false, null,        8)
-- do update, e não do nothing: assim rodar o script de novo sincroniza nomes,
-- ordem e flags. A lista é referência mantida aqui, não dado do usuário.
on conflict (codigo) do update set
  nome         = excluded.nome,
  grupo        = excluded.grupo,
  tem_servindo = excluded.tem_servindo,
  tem_publico  = excluded.tem_publico,
  soma_em      = excluded.soma_em,
  ordem        = excluded.ordem;


-- -----------------------------------------------------------------------------
-- 2. CONTAGENS: o cabeçalho da ficha
--
-- "homens" é subconjunto de "adultos" — o pastor pediu para acompanhar quantos
-- homens vêm, para comparar com o ministério de homens (a Arena). Mulheres não
-- é contado, e de propósito não existe como coluna: subtrair daria um número
-- com cara de verificado sem ter sido.
-- -----------------------------------------------------------------------------

alter table public.contagens add column if not exists adultos    integer;
alter table public.contagens add column if not exists homens     integer;
alter table public.contagens add column if not exists observacao text;

-- NULL de propósito: vazio é "não foi contado", zero é "ninguém veio". Tratar
-- os dois como a mesma coisa inventa quedas no gráfico que nunca aconteceram.
comment on column public.contagens.adultos is
  'Congregação adulta, sem quem está servindo. NULL = não contado (diferente de 0).';
comment on column public.contagens.homens is
  'Quantos daqueles adultos eram homens. Nunca maior que adultos.';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'contagens_adultos_nao_negativo'
  ) then
    alter table public.contagens
      add constraint contagens_adultos_nao_negativo check (adultos is null or adultos >= 0),
      add constraint contagens_homens_nao_negativo  check (homens  is null or homens  >= 0),
      add constraint contagens_homens_ate_adultos
        check (homens is null or adultos is null or homens <= adultos);
  end if;
end$$;

-- A coluna velha para de ser obrigatória; o app que está no ar continua
-- gravando nela até o código novo subir. Ela sai num script posterior.
alter table public.contagens alter column quantidade drop not null;
comment on column public.contagens.quantidade is
  'OBSOLETA — substituída por adultos + itens. Mantida só para o código antigo não quebrar; remover depois do deploy.';


-- -----------------------------------------------------------------------------
-- 3. CONTAGENS_ITENS: uma linha por ministério
-- -----------------------------------------------------------------------------

create table if not exists public.contagens_itens (
  id          uuid primary key default gen_random_uuid(),
  contagem_id uuid not null references public.contagens (id)      on delete cascade,
  item_id     uuid not null references public.itens_contagem (id) on delete restrict,

  servindo integer check (servindo is null or servindo >= 0),
  publico  integer check (publico  is null or publico  >= 0),

  constraint contagens_itens_unicos unique (contagem_id, item_id),
  -- Linha sem número nenhum não deve existir: apagar é apagar.
  constraint contagens_itens_tem_algum check (servindo is not null or publico is not null)
);

comment on table public.contagens_itens is
  'Por culto e por ministério: quantos serviram e quantas pessoas foram atendidas.';
comment on column public.contagens_itens.publico is
  'Crianças/adolescentes atendidos por aquele ministério. É a coluna "CRIANÇAS" da ficha de papel.';

create index if not exists contagens_itens_contagem_idx on public.contagens_itens (contagem_id);
create index if not exists contagens_itens_item_idx     on public.contagens_itens (item_id);


-- -----------------------------------------------------------------------------
-- 4. RLS
-- -----------------------------------------------------------------------------

alter table public.itens_contagem  enable row level security;
alter table public.contagens_itens enable row level security;

drop policy if exists "itens: leitura para aprovados" on public.itens_contagem;
drop policy if exists "itens: admin gerencia"         on public.itens_contagem;

create policy "itens: leitura para aprovados"
  on public.itens_contagem for select
  to authenticated
  using (public.tem_acesso());

create policy "itens: admin gerencia"
  on public.itens_contagem for all
  to authenticated
  using (public.eh_admin())
  with check (public.eh_admin());

drop policy if exists "contagens_itens: leitura para aprovados" on public.contagens_itens;
drop policy if exists "contagens_itens: contador lança"         on public.contagens_itens;
drop policy if exists "contagens_itens: contador corrige"       on public.contagens_itens;
drop policy if exists "contagens_itens: contador apaga"         on public.contagens_itens;

create policy "contagens_itens: leitura para aprovados"
  on public.contagens_itens for select
  to authenticated
  using (public.tem_acesso());

create policy "contagens_itens: contador lança"
  on public.contagens_itens for insert
  to authenticated
  with check (public.pode_lancar());

create policy "contagens_itens: contador corrige"
  on public.contagens_itens for update
  to authenticated
  using (public.pode_lancar())
  with check (public.pode_lancar());

-- Aqui o DELETE é do contador, não só do admin: corrigir um lançamento é
-- regravar as linhas de ministério. Apagar o lançamento inteiro continua
-- restrito ao admin, pela política de "contagens".
create policy "contagens_itens: contador apaga"
  on public.contagens_itens for delete
  to authenticated
  using (public.pode_lancar());


-- -----------------------------------------------------------------------------
-- 5. RESUMO POR EVENTO
--
-- É daqui que saem as duas mensagens do grupo. As regras foram conferidas
-- contra as fichas e as mensagens reais de 11/10/2026:
--
--   Crianças       = crianças no culto + berçário + maternal + kids
--   Servindo Fora  = soma de "servindo" dos ministérios de fora
--   Servindo Dentro= soma de "servindo" de dentro, SEM os pastores
--   Total simples  = Adultos + Crianças + PADS + Volts        (só congregação)
--   Total detalhado= simples + fora + dentro + pastoral       (com quem serviu)
--
-- sum() filter devolve NULL quando não há linha: é o que mantém "não contado"
-- diferente de "zero".
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
  left join public.contagens       c  on c.evento_id   = e.id
  left join public.contagens_itens ci on ci.contagem_id = c.id
  left join public.itens_contagem  i  on i.id          = ci.item_id
  group by e.id, e.data, e.horario, e.tipo, e.nome,
           c.id, c.adultos, c.homens, c.observacao, c.lancado_por, c.updated_at
)
select
  b.*,
  -- O culto só entra nas mensagens depois de ter adultos lançados.
  (b.adultos is not null) as lancado,
  (coalesce(b.adultos,0) + coalesce(b.criancas,0)
   + coalesce(b.pads,0)  + coalesce(b.volts,0))::int as total_simples,
  (coalesce(b.adultos,0) + coalesce(b.criancas,0)
   + coalesce(b.pads,0)  + coalesce(b.volts,0)
   + b.servindo_fora + b.servindo_dentro + b.pastoral)::int as total_detalhado
from base b;

comment on view public.resumo_por_evento is
  'Um culto por linha, com as categorias somadas e os dois totais. Base das mensagens do grupo.';

grant select on public.resumo_por_evento to authenticated;


-- -----------------------------------------------------------------------------
-- 6. TOTAIS POR DATA
--
-- Mesmas colunas de antes, para as telas que já existem continuarem lendo —
-- mas agora "total" é o total simples da estrutura nova.
-- -----------------------------------------------------------------------------

drop view if exists public.totais_por_data cascade;

create view public.totais_por_data
with (security_invoker = true) as
select
  r.data,
  bool_or(r.tipo = 'culto_fixo')       as tem_culto_fixo,
  bool_or(r.tipo = 'evento_especial')  as tem_evento_especial,
  count(*)::int                        as horarios,
  count(*) filter (where r.lancado)::int as horarios_lancados,
  coalesce(sum(r.total_simples)   filter (where r.lancado), 0)::int as total,
  coalesce(sum(r.total_detalhado) filter (where r.lancado), 0)::int as total_detalhado,

  count(*) filter (where r.tipo = 'culto_fixo')::int               as horarios_cultos,
  count(*) filter (where r.tipo = 'culto_fixo' and r.lancado)::int as lancados_cultos,
  coalesce(sum(r.total_simples) filter (where r.tipo = 'culto_fixo' and r.lancado), 0)::int as total_cultos,

  count(*) filter (where r.tipo = 'evento_especial')::int               as horarios_eventos,
  count(*) filter (where r.tipo = 'evento_especial' and r.lancado)::int as lancados_eventos,
  coalesce(sum(r.total_simples) filter (where r.tipo = 'evento_especial' and r.lancado), 0)::int as total_eventos,

  coalesce(sum(r.homens) filter (where r.tipo = 'culto_fixo'), 0)::int as homens_cultos
from public.resumo_por_evento r
group by r.data;

comment on view public.totais_por_data is
  'Uma linha por data, com os totais separados por tipo. security_invoker: a RLS continua valendo para quem consulta.';

grant select on public.totais_por_data to authenticated;


-- -----------------------------------------------------------------------------
-- 7. CULTO DA ESPERANÇA — quarta, 14h30
--
-- gerar_eventos_fixos() lê horarios_padrao, então a quarta passa a funcionar
-- sozinha, sem mudar uma linha de código.
-- -----------------------------------------------------------------------------

insert into public.horarios_padrao (dia_semana, horario, nome) values
  (3, '14:30', 'Culto da Esperança')
on conflict (dia_semana, horario) do nothing;


-- -----------------------------------------------------------------------------
-- 8. CONFERÊNCIA
-- -----------------------------------------------------------------------------

select
  (select count(*) from public.itens_contagem)  as itens_cadastrados,   -- 16
  (select count(*) from public.horarios_padrao) as horarios_fixos,      -- 5
  (select count(*) from public.contagens)       as contagens,
  (select count(*) from public.contagens_itens) as linhas_de_item;

-- =============================================================================
-- Contagem Culto — view de totais por data
--
-- Rode este arquivo no SQL Editor do Supabase. É idempotente.
--
-- Por que existe: o PostgREST não agrupa, então sem esta view o app teria que
-- baixar todas as linhas e somar no navegador — e o Supabase corta consultas
-- em 1000 linhas por padrão, o que faria o histórico perder datas em silêncio
-- depois de alguns anos.
-- =============================================================================

create or replace view public.totais_por_data
with (security_invoker = true) as
select
  e.data,

  bool_or(e.tipo = 'culto_fixo')      as tem_culto_fixo,
  bool_or(e.tipo = 'evento_especial') as tem_evento_especial,

  count(*)::int                       as horarios,
  count(c.id)::int                    as horarios_lancados,
  coalesce(sum(c.quantidade), 0)::int as total,

  count(*) filter (where e.tipo = 'culto_fixo')::int    as horarios_cultos,
  count(c.id) filter (where e.tipo = 'culto_fixo')::int as lancados_cultos,
  coalesce(sum(c.quantidade) filter (where e.tipo = 'culto_fixo'), 0)::int
    as total_cultos,

  count(*) filter (where e.tipo = 'evento_especial')::int    as horarios_eventos,
  count(c.id) filter (where e.tipo = 'evento_especial')::int as lancados_eventos,
  coalesce(sum(c.quantidade) filter (where e.tipo = 'evento_especial'), 0)::int
    as total_eventos

from public.eventos e
left join public.contagens c on c.evento_id = e.id
group by e.data;

comment on view public.totais_por_data is
  'Uma linha por data, com os totais separados por tipo. security_invoker: a RLS de eventos e contagens continua valendo para quem consulta.';

-- security_invoker = true é o que faz a RLS das tabelas de baixo continuar
-- valendo. Sem isso, a view rodaria com as permissões do dono e qualquer
-- usuário pendente ou banido enxergaria todos os totais.
grant select on public.totais_por_data to authenticated;

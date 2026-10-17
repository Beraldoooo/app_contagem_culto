-- =============================================================================
-- Setembro de 2026 — contagens REAIS, da planilha do Leonardo
-- ("Relatório de contagem 2026.xlsx", abas de 02/09 a 30/09).
--
-- 21 cultos: 4 domingos (8h, 10h, 18h), 4 quintas e 5 quartas.
-- Importa as PEÇAS (adultos e cada ministério); o app calcula os totais. As
-- células de TOTAL da planilha não são usadas — elas têm erro de fórmula.
--
-- Conferido antes de gerar: o que o app calcula bate, culto a culto e campo a
-- campo, com o painel da mensagem detalhada que o Leonardo mandou no grupo.
-- Duas diferenças de FORMATO da planilha, tratadas na leitura:
--   - até meados de setembro o "Crianças" da mensagem incluía o Pads;
--   - nos domingos o Volts estava como "Equipe adolescentes Volts".
--
-- Homens: não estava na planilha em setembro (só anotado na margem, às vezes)
-- — fica vazio, que é "não contado", e não zero.
--
-- Pode rodar de novo: atualiza em vez de duplicar.
-- Rodar no Supabase: SQL Editor > New query > Run.
-- =============================================================================

-- 2026-09-02 14:30 · Culto da Esperança
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto da Esperança', '2026-09-02', '14:30')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 55 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('louvor', 3, null),
      ('pastores', 5, null),
      ('projecao', 1, null),
      ('hospitalidade', 4, null),
      ('dizimos', 5, null),
      ('livraria', 3, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-03 20:00 · Culto Quinta 20h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Quinta 20h', '2026-09-03', '20:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 425 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('estacionamento', 7, null),
      ('criancas_no_culto', null, 10),
      ('bercario', 7, 2),
      ('maternal', 6, 8),
      ('kids', 25, 53),
      ('pads', 10, 40),
      ('louvor', 7, null),
      ('pastores', 11, null),
      ('projecao', 5, null),
      ('audio', 2, null),
      ('iluminacao', 1, null),
      ('midias', 2, null),
      ('hospitalidade', 9, null),
      ('dizimos', 15, null),
      ('livraria', 3, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-06 08:00 · Culto Domingo 8h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Domingo 8h', '2026-09-06', '08:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 155 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('estacionamento', 3, null),
      ('louvor', 4, null),
      ('pastores', 11, null),
      ('projecao', 1, null),
      ('audio', 1, null),
      ('hospitalidade', 7, null),
      ('dizimos', 8, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-06 10:00 · Culto Domingo 10h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Domingo 10h', '2026-09-06', '10:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 535 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('volts', 6, 63),
      ('estacionamento', 4, null),
      ('criancas_no_culto', null, 5),
      ('bercario', 5, 5),
      ('maternal', 4, 11),
      ('kids', 28, 60),
      ('pads', 14, 38),
      ('louvor', 8, null),
      ('pastores', 11, null),
      ('projecao', 5, null),
      ('audio', 2, null),
      ('iluminacao', 1, null),
      ('midias', 2, null),
      ('hospitalidade', 10, null),
      ('dizimos', 11, null),
      ('livraria', 5, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-06 18:00 · Culto Domingo 18h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Domingo 18h', '2026-09-06', '18:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 613 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('estacionamento', 4, null),
      ('criancas_no_culto', null, 7),
      ('bercario', 3, 1),
      ('maternal', 7, 12),
      ('kids', 14, 56),
      ('pads', 6, 29),
      ('louvor', 8, null),
      ('pastores', 12, null),
      ('projecao', 4, null),
      ('audio', 2, null),
      ('iluminacao', 1, null),
      ('midias', 1, null),
      ('hospitalidade', 6, null),
      ('dizimos', 9, null),
      ('livraria', 4, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-09 14:30 · Culto da Esperança
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto da Esperança', '2026-09-09', '14:30')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 54 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('louvor', 3, null),
      ('pastores', 6, null),
      ('hospitalidade', 4, null),
      ('dizimos', 5, null),
      ('livraria', 1, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-10 20:00 · Culto Quinta 20h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Quinta 20h', '2026-09-10', '20:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 232 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('estacionamento', 3, null),
      ('criancas_no_culto', null, 1),
      ('bercario', 4, 1),
      ('maternal', 7, 4),
      ('kids', 22, 27),
      ('pads', 13, 17),
      ('louvor', 7, null),
      ('pastores', 11, null),
      ('projecao', 4, null),
      ('audio', 1, null),
      ('iluminacao', 1, null),
      ('midias', 2, null),
      ('hospitalidade', 4, null),
      ('dizimos', 11, null),
      ('livraria', 4, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-13 08:00 · Culto Domingo 8h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Domingo 8h', '2026-09-13', '08:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 232 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('estacionamento', 2, null),
      ('criancas_no_culto', null, 3),
      ('louvor', 3, null),
      ('pastores', 10, null),
      ('audio', 1, null),
      ('hospitalidade', 6, null),
      ('dizimos', 7, null),
      ('livraria', 1, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-13 10:00 · Culto Domingo 10h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Domingo 10h', '2026-09-13', '10:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 786 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('volts', 0, 103),
      ('estacionamento', 3, null),
      ('criancas_no_culto', null, 6),
      ('bercario', 6, 7),
      ('maternal', 10, 31),
      ('kids', 33, 87),
      ('pads', 10, 58),
      ('louvor', 8, null),
      ('pastores', 9, null),
      ('projecao', 6, null),
      ('audio', 2, null),
      ('iluminacao', 1, null),
      ('midias', 3, null),
      ('hospitalidade', 11, null),
      ('dizimos', 15, null),
      ('livraria', 3, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-13 18:00 · Culto Domingo 18h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Domingo 18h', '2026-09-13', '18:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 466 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('estacionamento', 2, null),
      ('criancas_no_culto', null, 17),
      ('bercario', 2, 1),
      ('maternal', 3, 4),
      ('kids', 15, 55),
      ('pads', 5, 33),
      ('louvor', 8, null),
      ('pastores', 10, null),
      ('projecao', 2, null),
      ('audio', 1, null),
      ('iluminacao', 1, null),
      ('midias', 1, null),
      ('hospitalidade', 6, null),
      ('dizimos', 10, null),
      ('livraria', 2, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-16 14:30 · Culto da Esperança
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto da Esperança', '2026-09-16', '14:30')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 66 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('criancas_no_culto', null, 1),
      ('louvor', 3, null),
      ('pastores', 5, null),
      ('projecao', 1, null),
      ('hospitalidade', 3, null),
      ('dizimos', 5, null),
      ('livraria', 1, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-17 20:00 · Culto Quinta 20h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Quinta 20h', '2026-09-17', '20:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 357 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('estacionamento', 8, null),
      ('criancas_no_culto', null, 8),
      ('bercario', 4, 1),
      ('maternal', 5, 6),
      ('kids', 22, 49),
      ('pads', 8, 38),
      ('louvor', 8, null),
      ('pastores', 8, null),
      ('projecao', 6, null),
      ('audio', 3, null),
      ('iluminacao', 1, null),
      ('midias', 2, null),
      ('hospitalidade', 8, null),
      ('dizimos', 10, null),
      ('livraria', 3, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-20 08:00 · Culto Domingo 8h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Domingo 8h', '2026-09-20', '08:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 185 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('estacionamento', 3, null),
      ('criancas_no_culto', null, 2),
      ('louvor', 3, null),
      ('pastores', 8, null),
      ('projecao', 1, null),
      ('audio', 1, null),
      ('hospitalidade', 9, null),
      ('dizimos', 8, null),
      ('livraria', 0, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-20 10:00 · Culto Domingo 10h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Domingo 10h', '2026-09-20', '10:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 650 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('volts', 0, 0),
      ('estacionamento', 6, null),
      ('criancas_no_culto', null, 11),
      ('bercario', 7, 7),
      ('maternal', 6, 23),
      ('kids', 20, 79),
      ('pads', 8, 51),
      ('louvor', 8, null),
      ('pastores', 7, null),
      ('projecao', 5, null),
      ('audio', 2, null),
      ('iluminacao', 1, null),
      ('midias', 2, null),
      ('hospitalidade', 11, null),
      ('dizimos', 9, null),
      ('livraria', 5, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-20 18:00 · Culto Domingo 18h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Domingo 18h', '2026-09-20', '18:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 416 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('estacionamento', 3, null),
      ('criancas_no_culto', null, 4),
      ('bercario', 3, 2),
      ('maternal', 6, 10),
      ('kids', 10, 49),
      ('pads', 6, 23),
      ('louvor', 8, null),
      ('pastores', 8, null),
      ('projecao', 4, null),
      ('audio', 1, null),
      ('iluminacao', 1, null),
      ('midias', 2, null),
      ('hospitalidade', 9, null),
      ('dizimos', 9, null),
      ('livraria', 4, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-23 14:30 · Culto da Esperança
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto da Esperança', '2026-09-23', '14:30')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 60 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('louvor', 3, null),
      ('pastores', 4, null),
      ('projecao', 1, null),
      ('hospitalidade', 2, null),
      ('dizimos', 4, null),
      ('livraria', 2, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-24 20:00 · Culto Quinta 20h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Quinta 20h', '2026-09-24', '20:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 366 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('estacionamento', 8, null),
      ('criancas_no_culto', null, 6),
      ('bercario', 5, 0),
      ('maternal', 7, 10),
      ('kids', 22, 41),
      ('pads', 10, 38),
      ('louvor', 9, null),
      ('pastores', 9, null),
      ('projecao', 7, null),
      ('audio', 1, null),
      ('iluminacao', 1, null),
      ('midias', 2, null),
      ('hospitalidade', 7, null),
      ('dizimos', 13, null),
      ('livraria', 4, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-27 08:00 · Culto Domingo 8h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Domingo 8h', '2026-09-27', '08:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 192 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('estacionamento', 3, null),
      ('criancas_no_culto', null, 5),
      ('louvor', 4, null),
      ('pastores', 8, null),
      ('projecao', 2, null),
      ('audio', 1, null),
      ('hospitalidade', 7, null),
      ('dizimos', 7, null),
      ('livraria', 0, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-27 10:00 · Culto Domingo 10h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Domingo 10h', '2026-09-27', '10:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 897 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('estacionamento', 6, null),
      ('criancas_no_culto', null, 16),
      ('bercario', 6, 8),
      ('maternal', 10, 22),
      ('kids', 36, 103),
      ('pads', 10, 49),
      ('volts', 0, 0),
      ('louvor', 69, null),
      ('pastores', 9, null),
      ('projecao', 7, null),
      ('audio', 2, null),
      ('iluminacao', 1, null),
      ('midias', 2, null),
      ('hospitalidade', 13, null),
      ('dizimos', 13, null),
      ('livraria', 3, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-27 18:00 · Culto Domingo 18h
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto Domingo 18h', '2026-09-27', '18:00')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 469 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('estacionamento', 3, null),
      ('criancas_no_culto', null, 9),
      ('bercario', 3, 1),
      ('maternal', 4, 8),
      ('kids', 17, 42),
      ('pads', 6, 23),
      ('louvor', 69, null),
      ('pastores', 10, null),
      ('projecao', 6, null),
      ('audio', 1, null),
      ('iluminacao', 2, null),
      ('midias', 1, null),
      ('hospitalidade', 6, null),
      ('dizimos', 10, null),
      ('livraria', 3, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- 2026-09-30 14:30 · Culto da Esperança
with ev as (
  insert into public.eventos (tipo, nome, data, horario)
  values ('culto_fixo', 'Culto da Esperança', '2026-09-30', '14:30')
  on conflict (data, horario, nome) do update set nome = excluded.nome
  returning id
), ct as (
  insert into public.contagens (evento_id, adultos)
  select id, 66 from ev
  on conflict (evento_id) do update set adultos = excluded.adultos
  returning id
)
insert into public.contagens_itens (contagem_id, item_id, servindo, publico)
select ct.id, i.id, v.servindo::int, v.publico::int
  from ct, (values
      ('louvor', 3, null),
      ('pastores', 6, null),
      ('projecao', 1, null),
      ('hospitalidade', 3, null),
      ('dizimos', 5, null),
      ('livraria', 1, null)
    ) as v(codigo, servindo, publico)
  join public.itens_contagem i on i.codigo = v.codigo
on conflict (contagem_id, item_id) do update
  set servindo = excluded.servindo, publico = excluded.publico;

-- Conferência: deve mostrar 21 cultos, 21 lançados.
select count(*) as cultos, count(*) filter (where lancado) as lancados,
       sum(total_simples) as soma_simples, sum(total_detalhado) as soma_detalhada
  from public.resumo_por_evento
 where data between '2026-09-01' and '2026-09-30';

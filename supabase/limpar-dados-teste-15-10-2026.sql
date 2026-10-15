-- Apaga as contagens de teste criadas em 15/10/2026 pela sessao na nuvem.
-- Backup completo em backup-dados-15-10-2026.json (na pasta do projeto).
-- Rode no Supabase: SQL Editor > New query > Run.

-- 1) Confira o que sera apagado ANTES (deve listar 7 linhas):
select e.data, e.horario, c.quantidade
  from public.contagens c
  join public.eventos e on e.id = c.evento_id
 where c.id in (
   '92279bc2-3840-4e31-ab00-2e309b913f8e',
   '1a4fe1a3-1fd4-49bf-b4db-71bb2992fa57',
   '65e5bab2-58a7-40d4-a065-21d19b94b1a6',
   'e2a1fd1d-0d3f-4b4b-9c7d-56efba2a0c71',
   '0bb3041b-5f33-4a1a-b38d-31fdc4d04c8c',
   '79b86a23-0f40-4748-871a-a50e543c785f',
   '4c243b05-319b-428b-8cf4-e9ca9dceac3b'
 )
 order by e.data, e.horario;

-- 2) Se as 7 linhas estiverem certas, apague:
delete from public.contagens
 where id in (
   '92279bc2-3840-4e31-ab00-2e309b913f8e',
   '1a4fe1a3-1fd4-49bf-b4db-71bb2992fa57',
   '65e5bab2-58a7-40d4-a065-21d19b94b1a6',
   'e2a1fd1d-0d3f-4b4b-9c7d-56efba2a0c71',
   '0bb3041b-5f33-4a1a-b38d-31fdc4d04c8c',
   '79b86a23-0f40-4748-871a-a50e543c785f',
   '4c243b05-319b-428b-8cf4-e9ca9dceac3b'
 );

-- 3) Opcional: apagar tambem os horarios que ficaram sem contagem
--    (eles voltam sozinhos quando alguem abrir a data no app).
-- delete from public.eventos e
--  where not exists (select 1 from public.contagens c where c.evento_id = e.id);

-- 4) Confira que sobrou zero:
select (select count(*) from public.contagens) as contagens,
       (select count(*) from public.eventos)   as eventos;

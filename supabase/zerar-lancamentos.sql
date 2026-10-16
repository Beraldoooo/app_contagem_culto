-- =============================================================================
-- Zera os lançamentos: apaga todos os cultos/eventos e as contagens deles.
--
-- Fica: usuários, a lista de ministérios (itens_contagem) e os horários fixos
-- (horarios_padrao) — é deles que o app gera os cultos de novo quando alguém
-- abrir uma data. Nada de configuração se perde.
--
-- Usado em 16/10/2026 para limpar o que entrou durante os testes, antes de a
-- igreja começar a usar. Backup em backup-dados-16-10-2026.json (só no Mac).
--
-- Rodar no Supabase: SQL Editor > New query > Run.
-- =============================================================================

-- 1) O que vai sair (confira antes):
select
  (select count(*) from public.eventos)         as eventos,
  (select count(*) from public.contagens)       as contagens,
  (select count(*) from public.contagens_itens) as linhas_de_ministerio;

-- 2) Apaga. Os eventos levam junto as contagens e as linhas de ministério
--    (on delete cascade), então um comando basta.
delete from public.eventos;

-- 3) Confira: tudo zerado, e a configuração intacta.
select
  (select count(*) from public.eventos)         as eventos,             -- 0
  (select count(*) from public.contagens)       as contagens,           -- 0
  (select count(*) from public.contagens_itens) as linhas_de_ministerio,-- 0
  (select count(*) from public.itens_contagem)  as ministerios,         -- 16
  (select count(*) from public.horarios_padrao) as horarios_fixos;      -- 5

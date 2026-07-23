-- ============================================================
-- Categoria do ticket (pedida ao criar, para triagem mais rápida).
-- ============================================================

alter table public.tickets
  add column if not exists categoria text not null default 'duvidas'
  check (categoria in ('duvidas', 'devolucao', 'outro'));

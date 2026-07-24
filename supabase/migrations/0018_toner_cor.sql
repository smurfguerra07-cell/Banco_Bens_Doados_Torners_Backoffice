-- ============================================================
-- Cor do toner (ex: preto, ciano, magenta, amarelo), usada como
-- filtro no catálogo público.
-- ============================================================

alter table public.toners
  add column if not exists cor text;

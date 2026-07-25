-- ============================================================
-- Vídeo explicativo do toner (opcional), usado pela Aura quando
-- responde a tickets sobre esse produto.
-- ============================================================

alter table public.toners
  add column if not exists video_url text;

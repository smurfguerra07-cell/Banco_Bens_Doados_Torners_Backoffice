-- ============================================================
-- Código de identificação da instituição junto da Entrajuda, recolhido
-- no registo de conta do Portal (campo opcional — nem todas as
-- instituições o sabem de cor no momento do registo).
-- ============================================================

alter table public.empresas
  add column if not exists codigo_entrajuda text;

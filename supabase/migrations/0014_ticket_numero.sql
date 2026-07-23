-- ============================================================
-- Número sequencial legível do ticket (ex: #12), tal como já existe
-- em "pedidos.numero".
-- ============================================================

alter table public.tickets
  add column if not exists numero bigint generated always as identity;

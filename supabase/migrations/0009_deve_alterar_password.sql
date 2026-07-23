-- ============================================================
-- Suporte para criação de utilizadores diretamente pelo BackOffice
-- e para forçar a troca de palavra-passe no primeiro login.
-- ============================================================

alter table public.profiles
  add column if not exists deve_alterar_password boolean not null default false;

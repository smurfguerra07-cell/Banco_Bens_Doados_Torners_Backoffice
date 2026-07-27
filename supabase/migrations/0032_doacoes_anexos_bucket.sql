-- ============================================================
-- Cria o bucket "doacoes-anexos" via SQL (equivalente a criá-lo no
-- Dashboard) — evita o passo manual para este bucket em concreto.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('doacoes-anexos', 'doacoes-anexos', true)
on conflict (id) do nothing;

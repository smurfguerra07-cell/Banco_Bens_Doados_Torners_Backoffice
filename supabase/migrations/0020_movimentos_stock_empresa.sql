-- ============================================================
-- De onde veio cada entrada de stock (ex: "veio da EDP", "veio da
-- Galp") — regista a empresa doadora em cada movimento de stock, para
-- se conseguir ver o histórico de origem de um toner.
-- ============================================================

alter table public.movimentos_stock
  add column if not exists empresa_id uuid references public.empresas (id);

create index if not exists idx_movimentos_empresa on public.movimentos_stock (empresa_id);

-- Até agora só existia a policy de SELECT para staff — os únicos inserts
-- eram feitos pelas funções SECURITY DEFINER dos triggers de pedidos.
-- Agora o BackOffice também regista entradas manualmente (importação e
-- criação/edição de toners), por isso precisa de poder inserir.
create policy "Staff regista movimentos de stock"
  on public.movimentos_stock for insert
  to authenticated
  with check (public.can_write_staff());

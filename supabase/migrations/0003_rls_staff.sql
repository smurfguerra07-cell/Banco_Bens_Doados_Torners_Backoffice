-- ============================================================
-- Fase 3 (continuação): políticas RLS para utilizadores de staff
-- do BackOffice (administrador, gestor, operador, leitor).
-- ============================================================
-- leitor: só leitura em tudo.
-- operador/gestor/administrador: leitura + escrita em toners,
-- empresas e pedidos. (Distinções mais finas entre estes três
-- papéis — ex: só administrador gerir utilizadores — ficam para
-- quando existir a gestão de utilizadores.)

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('administrador', 'gestor', 'operador', 'leitor')
  );
$$;

create or replace function public.can_write_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('administrador', 'gestor', 'operador')
  );
$$;

-- ---------- PROFILES ----------
create policy "Staff vê todos os perfis"
  on public.profiles for select
  to authenticated
  using (public.is_staff());

-- ---------- EMPRESAS ----------
create policy "Staff vê todas as empresas"
  on public.empresas for select
  to authenticated
  using (public.is_staff());

create policy "Staff gere empresas"
  on public.empresas for all
  to authenticated
  using (public.can_write_staff())
  with check (public.can_write_staff());

-- ---------- TONERS ----------
create policy "Staff vê todos os toners"
  on public.toners for select
  to authenticated
  using (public.is_staff());

create policy "Staff gere toners"
  on public.toners for all
  to authenticated
  using (public.can_write_staff())
  with check (public.can_write_staff());

-- ---------- TONER_IMAGENS ----------
create policy "Staff vê todas as imagens"
  on public.toner_imagens for select
  to authenticated
  using (public.is_staff());

create policy "Staff gere imagens de toners"
  on public.toner_imagens for all
  to authenticated
  using (public.can_write_staff())
  with check (public.can_write_staff());

-- ---------- PEDIDOS ----------
create policy "Staff vê todos os pedidos"
  on public.pedidos for select
  to authenticated
  using (public.is_staff());

create policy "Staff atualiza pedidos"
  on public.pedidos for update
  to authenticated
  using (public.can_write_staff())
  with check (public.can_write_staff());

-- ---------- PEDIDO_ITENS ----------
create policy "Staff vê todos os itens de pedidos"
  on public.pedido_itens for select
  to authenticated
  using (public.is_staff());

-- ---------- MOVIMENTOS DE STOCK ----------
create policy "Staff vê movimentos de stock"
  on public.movimentos_stock for select
  to authenticated
  using (public.is_staff());

-- ---------- AUDITORIA ----------
create policy "Staff vê auditoria"
  on public.audit_logs for select
  to authenticated
  using (public.is_staff());

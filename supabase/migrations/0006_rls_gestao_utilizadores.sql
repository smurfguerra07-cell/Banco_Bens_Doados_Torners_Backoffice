-- ============================================================
-- Permite que staff com permissão de escrita (administrador,
-- gestor, operador) crie e edite perfis de OUTROS utilizadores.
-- Antes só existiam políticas para o próprio utilizador se gerir.
-- ============================================================

create policy "Staff cria perfis de utilizadores"
  on public.profiles for insert
  to authenticated
  with check (public.can_write_staff());

create policy "Staff atualiza perfis de utilizadores"
  on public.profiles for update
  to authenticated
  using (public.can_write_staff())
  with check (public.can_write_staff());

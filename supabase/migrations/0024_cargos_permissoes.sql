-- ============================================================
-- Restringe a gestão de OUTROS utilizadores (criar/editar perfis
-- alheios) a administrador — antes qualquer staff com permissão de
-- escrita (administrador, gestor, operador) podia. Gestor e operador
-- continuam a poder editar o seu PRÓPRIO perfil (política "Utilizador
-- atualiza o seu próprio perfil", de 0002_rls_cliente.sql, inalterada
-- e independente desta).
--
-- Tickets e Instituições continuam com leitura is_staff() (todos os
-- cargos) porque essa política também é usada indiretamente por
-- junções noutras páginas (ex: nome da empresa num pedido) — a
-- restrição de "operador não vê Tickets/Instituições" pedida é feita
-- só a nível de navegação/rota no frontend, não aqui.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'administrador'
  );
$$;

drop policy if exists "Staff cria perfis de utilizadores" on public.profiles;
create policy "Administrador cria perfis de utilizadores"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Staff atualiza perfis de utilizadores" on public.profiles;
create policy "Administrador atualiza perfis de utilizadores"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

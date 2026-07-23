-- ============================================================
-- Fix: cliente conseguia VER a sua empresa (morada de entrega) mas
-- nunca teve permissão para a ATUALIZAR. O update na página de
-- Configurações não dava erro (RLS simplesmente filtra a linha,
-- não é tratado como falha pelo supabase-js sem .select()), mas
-- também nunca gravava nada.
-- ============================================================

create policy "Cliente atualiza a sua própria empresa"
  on public.empresas for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.empresa_id = empresas.id
        and profiles.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.empresa_id = empresas.id
        and profiles.id = auth.uid()
    )
  );

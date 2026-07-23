-- ============================================================
-- Fase 3 (arranque): políticas RLS para o fluxo de autoregisto e
-- autoatendimento de clientes (entidades beneficiárias).
-- ============================================================
-- Nota: por agora o registo é feito pelo próprio cliente (self-service),
-- para permitir testar o fluxo de carrinho → login → pedido de ponta a
-- ponta. A validação/aprovação de novas entidades pelo BackOffice fica
-- para revisão nesta fase mais à frente — as políticas de gestão e
-- Administrador/Gestor/Operador/Leitor completas também.

-- ---------- EMPRESAS ----------
-- Qualquer utilizador autenticado pode criar a "sua" empresa no registo.
create policy "Utilizador autenticado pode criar empresa"
  on public.empresas for insert
  to authenticated
  with check (true);

-- ---------- PROFILES ----------
create policy "Utilizador vê o seu próprio perfil"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Utilizador cria o seu próprio perfil"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "Utilizador atualiza o seu próprio perfil"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- PEDIDOS ----------
create policy "Cliente vê os seus próprios pedidos"
  on public.pedidos for select
  to authenticated
  using (solicitante_id = auth.uid());

create policy "Cliente cria pedidos em seu nome"
  on public.pedidos for insert
  to authenticated
  with check (
    solicitante_id = auth.uid()
    and empresa_id = (select empresa_id from public.profiles where id = auth.uid())
  );

-- ---------- PEDIDO_ITENS ----------
create policy "Cliente vê os itens dos seus próprios pedidos"
  on public.pedido_itens for select
  to authenticated
  using (
    exists (
      select 1 from public.pedidos
      where pedidos.id = pedido_itens.pedido_id
        and pedidos.solicitante_id = auth.uid()
    )
  );

create policy "Cliente adiciona itens aos seus próprios pedidos"
  on public.pedido_itens for insert
  to authenticated
  with check (
    exists (
      select 1 from public.pedidos
      where pedidos.id = pedido_itens.pedido_id
        and pedidos.solicitante_id = auth.uid()
    )
  );

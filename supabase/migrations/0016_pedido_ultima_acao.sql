-- ============================================================
-- Regista qual membro da equipa fez a última alteração a um pedido
-- (aprovar, recusar, avançar estado, agendar entrega, etc.), para
-- mostrar "Última ação por: <nome>" no BackOffice.
-- ============================================================

alter table public.pedidos
  add column if not exists ultima_acao_por uuid references public.profiles (id);

create or replace function public.set_ultima_acao_pedido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.ultima_acao_por := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_pedidos_ultima_acao on public.pedidos;

create trigger trg_pedidos_ultima_acao
  before update on public.pedidos
  for each row execute function public.set_ultima_acao_pedido();

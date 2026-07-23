-- ============================================================
-- Fix: triggers de reserva/baixa de stock falhavam para clientes.
-- ============================================================
-- Os triggers reservar_stock_ao_criar_item() e
-- aplicar_transicao_estado_pedido() escrevem em "toners" e
-- "movimentos_stock". Como não são SECURITY DEFINER, corriam com
-- os privilégios de quem despoletou o trigger — e um cliente comum
-- não tem (nem deve ter) permissão direta para editar "toners" ou
-- "movimentos_stock". Resultado: RLS bloqueava a escrita e o
-- pedido falhava com "Não foi possível submeter o pedido."
--
-- Corrigido com SECURITY DEFINER: os triggers passam a correr com
-- os privilégios do dono, ignorando RLS apenas para estas escritas
-- controladas e bem definidas (não expõe nada novo ao cliente).

create or replace function public.reservar_stock_ao_criar_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  disponivel integer;
begin
  select (quantidade - quantidade_reservada) into disponivel
  from public.toners
  where id = new.toner_id
  for update;

  if disponivel is null then
    raise exception 'Toner % não encontrado', new.toner_id;
  end if;

  if new.quantidade > disponivel then
    raise exception 'Quantidade pedida (%) excede o stock disponível (%)', new.quantidade, disponivel;
  end if;

  update public.toners
  set quantidade_reservada = quantidade_reservada + new.quantidade
  where id = new.toner_id;

  return new;
end;
$$;

create or replace function public.aplicar_transicao_estado_pedido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  if new.estado = old.estado then
    return new;
  end if;

  if new.estado in ('recusado', 'cancelado') and old.estado not in ('recusado', 'cancelado', 'concluido') then
    for item in select toner_id, quantidade from public.pedido_itens where pedido_id = new.id loop
      update public.toners
      set quantidade_reservada = quantidade_reservada - item.quantidade
      where id = item.toner_id;
    end loop;
  end if;

  if new.estado = 'concluido' and old.estado <> 'concluido' then
    for item in select toner_id, quantidade from public.pedido_itens where pedido_id = new.id loop
      update public.toners
      set quantidade = quantidade - item.quantidade,
          quantidade_reservada = quantidade_reservada - item.quantidade
      where id = item.toner_id;

      insert into public.movimentos_stock (toner_id, tipo, quantidade, motivo, pedido_id, profile_id)
      values (item.toner_id, 'saida', item.quantidade, 'Pedido concluído', new.id, new.aprovado_por);
    end loop;
    new.concluido_em = now();
  end if;

  if new.estado = 'aprovado' and old.estado <> 'aprovado' then
    new.aprovado_em = now();
  end if;

  return new;
end;
$$;

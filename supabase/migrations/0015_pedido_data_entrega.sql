-- ============================================================
-- Agendamento de entrega: quando um pedido passa a "aprovado", a equipa
-- escolhe um dia de entrega (calendário no BackOffice). Guardamos essa
-- data para mostrar os eventos no calendário e gerar a guia de entrega.
-- ============================================================

alter table public.pedidos
  add column if not exists data_entrega date;

create index if not exists idx_pedidos_data_entrega on public.pedidos (data_entrega);

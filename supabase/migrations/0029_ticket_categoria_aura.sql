-- ============================================================
-- Adiciona a categoria "aura" aos tickets — usada quando a Aura no
-- Portal escala uma pergunta para a equipa de suporte por não ter
-- confiança suficiente para responder. Alteração aditiva ao check
-- constraint existente, sem tocar na forma da tabela nem no resto
-- das políticas de tickets/ticket_mensagens.
-- ============================================================

alter table public.tickets
  drop constraint if exists tickets_categoria_check;

alter table public.tickets
  add constraint tickets_categoria_check
  check (categoria in ('duvidas', 'devolucao', 'outro', 'aura'));

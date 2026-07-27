-- ============================================================
-- Permite à Aura responder diretamente dentro dos tickets (não só
-- na sua bolha de chat). As suas mensagens ficam com autor_id NULL
-- — não é criado nenhum utilizador/perfil falso para a representar
-- (profiles.id tem FK direta a auth.users, o que exigiria um login
-- a sério). Só a Edge Function aura-responder-ticket (service_role,
-- ignora RLS) insere mensagens com autor_id nulo.
--
-- Aproveita para corrigir um bug latente: o cliente tentava atualizar
-- tickets.updated_at a cada mensagem enviada, mas só há política de
-- UPDATE para staff ou para o cliente fechar o próprio ticket — dava
-- sempre 403 (silencioso, sem quebrar o envio da mensagem, mas o
-- ticket nunca "subia" na lista do staff quando o cliente respondia).
-- Em vez de abrir mais uma política, um trigger security definer
-- trata disto para qualquer autor (cliente, staff, ou a Aura).
-- ============================================================

alter table public.ticket_mensagens
  alter column autor_id drop not null;

create or replace function public.tocar_ticket()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.tickets set updated_at = now() where id = new.ticket_id;
  return new;
end;
$$;

create trigger trg_ticket_mensagens_toca_ticket
  after insert on public.ticket_mensagens
  for each row execute function public.tocar_ticket();

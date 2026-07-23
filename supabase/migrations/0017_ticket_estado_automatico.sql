-- ============================================================
-- Estado automático do ticket consoante quem responde por último:
-- mensagem do cliente -> "aberto" (precisa de atenção da equipa),
-- mensagem da equipa -> "em_espera" (à espera de resposta do cliente).
-- Não mexe em tickets já fechados. SECURITY DEFINER porque o cliente
-- não tem permissão de UPDATE genérica em "tickets" (só a de fechar).
-- ============================================================

create or replace function public.atualizar_estado_ticket_por_mensagem()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_estado_atual text;
begin
  select profile_id, estado into v_profile_id, v_estado_atual
  from public.tickets
  where id = new.ticket_id;

  if v_estado_atual is distinct from 'fechado' then
    if new.autor_id = v_profile_id then
      update public.tickets set estado = 'aberto' where id = new.ticket_id;
    else
      update public.tickets set estado = 'em_espera' where id = new.ticket_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_ticket_mensagens_estado on public.ticket_mensagens;

create trigger trg_ticket_mensagens_estado
  after insert on public.ticket_mensagens
  for each row execute function public.atualizar_estado_ticket_por_mensagem();

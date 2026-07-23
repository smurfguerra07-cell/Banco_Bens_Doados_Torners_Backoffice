-- ============================================================
-- Permite ao cliente fechar o seu próprio ticket, mas só enquanto
-- ainda não tiver nenhuma resposta de staff (ou seja, ainda não foi
-- atendido). Depois de haver resposta, só o staff pode alterar o
-- estado (política "Staff gere tickets", já existente).
-- ============================================================

create policy "Cliente fecha o seu ticket sem resposta"
  on public.tickets for update
  to authenticated
  using (
    profile_id = auth.uid()
    and not exists (
      select 1 from public.ticket_mensagens
      where ticket_mensagens.ticket_id = tickets.id
        and ticket_mensagens.autor_id <> tickets.profile_id
    )
  )
  with check (
    profile_id = auth.uid()
    and estado = 'fechado'
  );

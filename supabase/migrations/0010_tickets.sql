-- ============================================================
-- Tickets de suporte (chat entre cliente e staff).
-- ============================================================

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  assunto text not null,
  estado text not null default 'aberto' check (estado in ('aberto', 'em_espera', 'fechado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_tickets_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

create index idx_tickets_profile on public.tickets (profile_id);
create index idx_tickets_estado on public.tickets (estado);

create table public.ticket_mensagens (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  autor_id uuid not null references public.profiles (id),
  conteudo text,
  anexo_url text,
  anexo_tipo text check (anexo_tipo in ('imagem', 'audio')),
  created_at timestamptz not null default now(),
  constraint chk_mensagem_tem_conteudo check (conteudo is not null or anexo_url is not null)
);

create index idx_ticket_mensagens_ticket on public.ticket_mensagens (ticket_id, created_at);

alter table public.tickets enable row level security;
alter table public.ticket_mensagens enable row level security;

-- ---------- TICKETS ----------
create policy "Cliente vê os seus tickets"
  on public.tickets for select
  to authenticated
  using (profile_id = auth.uid());

create policy "Cliente cria tickets"
  on public.tickets for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "Staff vê todos os tickets"
  on public.tickets for select
  to authenticated
  using (public.is_staff());

create policy "Staff gere tickets"
  on public.tickets for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------- TICKET_MENSAGENS ----------
create policy "Participantes veem mensagens do ticket"
  on public.ticket_mensagens for select
  to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.tickets
      where tickets.id = ticket_mensagens.ticket_id
        and tickets.profile_id = auth.uid()
    )
  );

create policy "Participantes enviam mensagens"
  on public.ticket_mensagens for insert
  to authenticated
  with check (
    autor_id = auth.uid()
    and (
      public.is_staff()
      or exists (
        select 1 from public.tickets
        where tickets.id = ticket_mensagens.ticket_id
          and tickets.profile_id = auth.uid()
      )
    )
  );

-- ---------- STORAGE: anexos de tickets ----------
-- Pré-requisito: criar o bucket "ticket-anexos" no Supabase Dashboard
-- (Storage → New bucket → "ticket-anexos" → Public bucket: ON).
-- Tem de ser público para o link de anexo (imagem/áudio) funcionar
-- diretamente no chat sem gerar URLs assinadas a cada mensagem — o
-- caminho inclui o UUID do ticket, o que já dificulta adivinhar URLs.
-- As políticas abaixo continuam a proteger o acesso autenticado direto
-- (download via API), mesmo com o bucket marcado como público.
-- Convenção de caminho: {ticket_id}/{ficheiro}

create policy "Participantes veem anexos dos seus tickets"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'ticket-anexos'
    and (
      public.is_staff()
      or exists (
        select 1 from public.tickets
        where tickets.id::text = (storage.foldername(name))[1]
          and tickets.profile_id = auth.uid()
      )
    )
  );

create policy "Participantes enviam anexos para os seus tickets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ticket-anexos'
    and (
      public.is_staff()
      or exists (
        select 1 from public.tickets
        where tickets.id::text = (storage.foldername(name))[1]
          and tickets.profile_id = auth.uid()
      )
    )
  );

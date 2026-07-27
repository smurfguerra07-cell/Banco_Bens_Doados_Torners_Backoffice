-- ============================================================
-- Histórico de conversas da Aura no Portal. A Aura no Portal só
-- funciona com o utilizador autenticado (só assim é possível
-- escalar para ticket), por isso profile_id é NOT NULL e não há
-- políticas para "anon".
-- ============================================================

create table public.aura_conversas (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  session_id text not null,
  categoria_detectada text,
  estado text not null default 'em_curso' check (estado in ('em_curso', 'resolvida_auto', 'escalada', 'abandonada')),
  artigo_resolutivo_id uuid references public.kb_artigos (id),
  ticket_id uuid references public.tickets (id),
  iniciada_em timestamptz not null default now(),
  concluida_em timestamptz,
  updated_at timestamptz not null default now()
);

create trigger trg_aura_conversas_updated_at
  before update on public.aura_conversas
  for each row execute function public.set_updated_at();

create index idx_aura_conversas_profile on public.aura_conversas (profile_id);
create index idx_aura_conversas_estado on public.aura_conversas (estado);

create table public.aura_mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.aura_conversas (id) on delete cascade,
  autor text not null check (autor in ('utilizador', 'aura')),
  conteudo text not null,
  artigo_id uuid references public.kb_artigos (id),
  score_confianca numeric(4, 3),
  created_at timestamptz not null default now()
);

create index idx_aura_mensagens_conversa on public.aura_mensagens (conversa_id, created_at);

alter table public.aura_conversas enable row level security;
alter table public.aura_mensagens enable row level security;

-- ---------- AURA_CONVERSAS ----------
create policy "Cliente gere as suas conversas com a Aura"
  on public.aura_conversas for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "Staff vê todas as conversas com a Aura"
  on public.aura_conversas for select
  to authenticated
  using (public.is_staff());

-- ---------- AURA_MENSAGENS ----------
create policy "Cliente gere mensagens das suas conversas com a Aura"
  on public.aura_mensagens for all
  to authenticated
  using (
    exists (
      select 1 from public.aura_conversas
      where aura_conversas.id = aura_mensagens.conversa_id
        and aura_conversas.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.aura_conversas
      where aura_conversas.id = aura_mensagens.conversa_id
        and aura_conversas.profile_id = auth.uid()
    )
  );

create policy "Staff vê todas as mensagens da Aura"
  on public.aura_mensagens for select
  to authenticated
  using (public.is_staff());

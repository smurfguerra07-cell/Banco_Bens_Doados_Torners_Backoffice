-- ============================================================
-- Perguntas que a Aura no Portal não conseguiu responder com
-- confiança suficiente — alimenta a página "Perguntas sem
-- Resposta" no Centro de Conhecimento (BackOffice).
-- ============================================================

create table public.aura_perguntas_sem_resposta (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid references public.aura_conversas (id) on delete set null,
  mensagem_id uuid references public.aura_mensagens (id) on delete set null,
  pergunta text not null,
  categoria_detectada text,
  melhor_score numeric(4, 3),
  melhor_artigo_id uuid references public.kb_artigos (id),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  resolvida boolean not null default false,
  resolvida_por uuid references public.profiles (id),
  resolvida_em timestamptz,
  artigo_criado_id uuid references public.kb_artigos (id),
  created_at timestamptz not null default now()
);

create index idx_aura_perguntas_resolvida on public.aura_perguntas_sem_resposta (resolvida);

alter table public.aura_perguntas_sem_resposta enable row level security;

create policy "Cliente regista as suas perguntas sem resposta"
  on public.aura_perguntas_sem_resposta for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "Staff vê perguntas sem resposta"
  on public.aura_perguntas_sem_resposta for select
  to authenticated
  using (public.is_staff());

create policy "Staff atualiza perguntas sem resposta"
  on public.aura_perguntas_sem_resposta for update
  to authenticated
  using (public.can_write_staff())
  with check (public.can_write_staff());

-- ============================================================
-- Centro de Conhecimento da Aura: artigos da base de conhecimento
-- que alimentam a Aura no Portal (e, mais tarde, no BackOffice).
-- Autoria restrita a gestor/administrador (mesma decisão tomada
-- para Relatórios), leitura de artigos publicados é pública (a
-- Aura no Portal consulta sem exigir staff).
-- ============================================================

create or replace function public.can_manage_kb()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('administrador', 'gestor')
  );
$$;

create table public.kb_artigos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  subtitulo text,
  categoria text not null check (categoria in (
    'instalacao', 'problemas', 'pedidos', 'entregas', 'devolucoes',
    'doacoes', 'conta', 'plataforma', 'faq'
  )),
  resumo text,
  conteudo text not null,
  palavras_chave text[] not null default '{}',
  sinonimos text[] not null default '{}',
  prioridade integer not null default 0 check (prioridade between 0 and 100),
  estado text not null default 'rascunho' check (estado in ('publicado', 'rascunho', 'arquivado')),
  autor_id uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_kb_artigos_updated_at
  before update on public.kb_artigos
  for each row execute function public.set_updated_at();

create index idx_kb_artigos_categoria on public.kb_artigos (categoria);
create index idx_kb_artigos_estado on public.kb_artigos (estado);

create table public.kb_artigo_faqs_relacionadas (
  id uuid primary key default gen_random_uuid(),
  artigo_id uuid not null references public.kb_artigos (id) on delete cascade,
  artigo_relacionado_id uuid not null references public.kb_artigos (id) on delete cascade,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  constraint chk_faq_nao_autorreferencia check (artigo_id <> artigo_relacionado_id),
  constraint uq_faq_relacionada unique (artigo_id, artigo_relacionado_id)
);

alter table public.kb_artigos enable row level security;
alter table public.kb_artigo_faqs_relacionadas enable row level security;

-- ---------- KB_ARTIGOS ----------
create policy "Artigos publicados são públicos"
  on public.kb_artigos for select
  to anon, authenticated
  using (estado = 'publicado');

create policy "Staff vê todos os artigos"
  on public.kb_artigos for select
  to authenticated
  using (public.is_staff());

create policy "Gestor e administrador gerem artigos"
  on public.kb_artigos for all
  to authenticated
  using (public.can_manage_kb())
  with check (public.can_manage_kb());

-- ---------- KB_ARTIGO_FAQS_RELACIONADAS ----------
create policy "FAQs relacionadas de artigos publicados são públicas"
  on public.kb_artigo_faqs_relacionadas for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.kb_artigos
      where kb_artigos.id = kb_artigo_faqs_relacionadas.artigo_id
        and kb_artigos.estado = 'publicado'
    )
  );

create policy "Staff vê todas as FAQs relacionadas"
  on public.kb_artigo_faqs_relacionadas for select
  to authenticated
  using (public.is_staff());

create policy "Gestor e administrador gerem FAQs relacionadas"
  on public.kb_artigo_faqs_relacionadas for all
  to authenticated
  using (public.can_manage_kb())
  with check (public.can_manage_kb());

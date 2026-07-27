-- ============================================================
-- Anexos (polimórficos) e associações a produtos dos artigos da
-- base de conhecimento da Aura.
--
-- Pré-requisito: o bucket "kb-anexos" tem de existir
-- (Supabase Dashboard → Storage → New bucket → "kb-anexos" →
-- Public bucket: ON).
-- ============================================================

create table public.kb_anexos (
  id uuid primary key default gen_random_uuid(),
  artigo_id uuid not null references public.kb_artigos (id) on delete cascade,
  tipo text not null check (tipo in ('video_youtube', 'pdf', 'imagem', 'documento', 'link')),
  titulo text,
  url text,
  storage_path text,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  constraint chk_anexo_tem_origem check (
    (tipo in ('video_youtube', 'link') and url is not null)
    or (tipo in ('pdf', 'imagem', 'documento') and (url is not null or storage_path is not null))
  )
);

create index idx_kb_anexos_artigo on public.kb_anexos (artigo_id, ordem);

create table public.kb_associacoes_produto (
  id uuid primary key default gen_random_uuid(),
  artigo_id uuid not null references public.kb_artigos (id) on delete cascade,
  toner_id uuid references public.toners (id) on delete cascade,
  marca text,
  modelo text,
  referencia text,
  created_at timestamptz not null default now(),
  constraint chk_associacao_tem_alvo check (toner_id is not null or marca is not null or referencia is not null)
);

create index idx_kb_associacoes_artigo on public.kb_associacoes_produto (artigo_id);
create index idx_kb_associacoes_toner on public.kb_associacoes_produto (toner_id);
create index idx_kb_associacoes_marca on public.kb_associacoes_produto (lower(marca));

alter table public.kb_anexos enable row level security;
alter table public.kb_associacoes_produto enable row level security;

-- ---------- KB_ANEXOS ----------
create policy "Anexos de artigos publicados são públicos"
  on public.kb_anexos for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.kb_artigos
      where kb_artigos.id = kb_anexos.artigo_id
        and kb_artigos.estado = 'publicado'
    )
  );

create policy "Staff vê todos os anexos"
  on public.kb_anexos for select
  to authenticated
  using (public.is_staff());

create policy "Gestor e administrador gerem anexos"
  on public.kb_anexos for all
  to authenticated
  using (public.can_manage_kb())
  with check (public.can_manage_kb());

-- ---------- KB_ASSOCIACOES_PRODUTO ----------
create policy "Associações de artigos publicados são públicas"
  on public.kb_associacoes_produto for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.kb_artigos
      where kb_artigos.id = kb_associacoes_produto.artigo_id
        and kb_artigos.estado = 'publicado'
    )
  );

create policy "Staff vê todas as associações"
  on public.kb_associacoes_produto for select
  to authenticated
  using (public.is_staff());

create policy "Gestor e administrador gerem associações"
  on public.kb_associacoes_produto for all
  to authenticated
  using (public.can_manage_kb())
  with check (public.can_manage_kb());

-- ---------- STORAGE: anexos do Centro de Conhecimento ----------
create policy "Anexos da KB são publicamente legíveis"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'kb-anexos');

create policy "Gestor e administrador carregam anexos da KB"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'kb-anexos' and public.can_manage_kb());

create policy "Gestor e administrador atualizam anexos da KB"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'kb-anexos' and public.can_manage_kb())
  with check (bucket_id = 'kb-anexos' and public.can_manage_kb());

create policy "Gestor e administrador apagam anexos da KB"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'kb-anexos' and public.can_manage_kb());

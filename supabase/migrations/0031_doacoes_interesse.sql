-- ============================================================
-- Captação de interesse em doar toners/tinteiros — formulário
-- público no Portal ("Quero Doar"), sem exigir conta/login. Staff
-- vê e trata os pedidos no BackOffice.
--
-- Pré-requisito: criar o bucket "doacoes-anexos" no Supabase
-- Dashboard (Storage → New bucket → "doacoes-anexos" → Public: ON).
-- ============================================================

create table public.doacoes_interesse (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('empresa', 'pessoal')),
  nome text not null,
  nome_empresa text,
  email text not null,
  telefone text not null,
  mensagem text,
  anexo_url text,
  anexo_nome text,
  estado text not null default 'novo' check (estado in ('novo', 'contactado', 'concluido')),
  created_at timestamptz not null default now(),
  constraint chk_doacao_empresa_tem_nome check (tipo <> 'empresa' or nome_empresa is not null)
);

create index idx_doacoes_interesse_estado on public.doacoes_interesse (estado);

alter table public.doacoes_interesse enable row level security;

create policy "Qualquer pessoa regista interesse em doar"
  on public.doacoes_interesse for insert
  to anon, authenticated
  with check (true);

create policy "Staff vê os interesses de doação"
  on public.doacoes_interesse for select
  to authenticated
  using (public.is_staff());

create policy "Staff atualiza os interesses de doação"
  on public.doacoes_interesse for update
  to authenticated
  using (public.can_write_staff())
  with check (public.can_write_staff());

-- ---------- STORAGE: anexos do formulário "Quero Doar" ----------
create policy "Anexos de interesse de doação são legíveis"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'doacoes-anexos');

create policy "Qualquer pessoa anexa ficheiros de interesse de doação"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'doacoes-anexos');

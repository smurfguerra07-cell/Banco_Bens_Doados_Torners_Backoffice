-- ============================================================
-- Alertas de stock configuráveis pela Aura (ex: "avisa-me quando o
-- HP 85A chegar a stock crítico"). São verificados no sino de
-- notificações do BackOffice, comparando o stock disponível do toner
-- com o limite guardado — sem cron nem processo em background.
-- ============================================================

create table public.aura_alertas (
  id uuid primary key default gen_random_uuid(),
  toner_id uuid not null references public.toners (id) on delete cascade,
  limite integer not null check (limite >= 0),
  criado_por uuid references public.profiles (id),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_aura_alertas_toner on public.aura_alertas (toner_id);

alter table public.aura_alertas enable row level security;

create policy "Staff vê alertas"
  on public.aura_alertas for select
  to authenticated
  using (public.is_staff());

create policy "Staff cria alertas"
  on public.aura_alertas for insert
  to authenticated
  with check (public.can_write_staff());

create policy "Staff atualiza alertas"
  on public.aura_alertas for update
  to authenticated
  using (public.can_write_staff())
  with check (public.can_write_staff());

create policy "Staff apaga alertas"
  on public.aura_alertas for delete
  to authenticated
  using (public.can_write_staff());

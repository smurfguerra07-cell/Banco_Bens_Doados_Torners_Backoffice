-- ============================================================
-- Fase 2: Esquema principal da base de dados
-- Banco de Bens Doados — Plataforma de Reutilização de Toners
-- ============================================================
-- Cobre: empresas, perfis de utilizador, toners, pedidos e o
-- fluxo de reserva/saída de stock. RLS é ativado em todas as
-- tabelas, mas só a leitura pública do catálogo é configurada
-- aqui — as restantes políticas (por perfil/role) ficam para a
-- Fase 3 (Autenticação e Permissões).

-- ---------- ENUMS ----------

create type public.user_role as enum ('administrador','gestor','operador','leitor','cliente');
create type public.empresa_tipo as enum ('doadora','beneficiaria','ambas');
create type public.toner_estado as enum ('novo','usado','reconstruido');
create type public.pedido_estado as enum (
  'recebido','em_analise','aprovado','recusado',
  'em_preparacao','pronto_levantamento','concluido','cancelado'
);
create type public.movimento_tipo as enum ('entrada','saida','ajuste');

-- ---------- FUNÇÃO AUXILIAR: updated_at ----------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- EMPRESAS (doadoras e/ou beneficiárias) ----------

create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  nif text unique,
  tipo public.empresa_tipo not null default 'beneficiaria',
  morada text,
  codigo_postal text,
  cidade text,
  telefone text,
  email text,
  website text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_empresas_updated_at
  before update on public.empresas
  for each row execute function public.set_updated_at();

create index idx_empresas_tipo on public.empresas (tipo);
create index idx_empresas_nome_trgm on public.empresas using gin (nome gin_trgm_ops);

-- ---------- PROFILES (1:1 com auth.users) ----------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  empresa_id uuid references public.empresas (id) on delete set null,
  role public.user_role not null default 'cliente',
  full_name text not null,
  telefone text,
  avatar_url text,
  tema text not null default 'claro',
  idioma text not null default 'pt-PT',
  cor_principal text not null default '#1E4B8F',
  densidade_interface text not null default 'confortavel',
  animacoes_ativas boolean not null default true,
  notificacoes_email boolean not null default true,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_cliente_tem_empresa check (role <> 'cliente' or empresa_id is not null)
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index idx_profiles_empresa on public.profiles (empresa_id);
create index idx_profiles_role on public.profiles (role);

-- ---------- TONERS ----------

create table public.toners (
  id uuid primary key default gen_random_uuid(),
  marca text not null,
  modelo text not null,
  referencia text not null unique,
  compatibilidade text[] not null default '{}',
  quantidade integer not null default 0 check (quantidade >= 0),
  quantidade_reservada integer not null default 0 check (quantidade_reservada >= 0),
  estado public.toner_estado not null default 'novo',
  localizacao text,
  categoria text,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_reserva_nao_excede_stock check (quantidade_reservada <= quantidade)
);

create trigger trg_toners_updated_at
  before update on public.toners
  for each row execute function public.set_updated_at();

create index idx_toners_marca on public.toners (marca);
create index idx_toners_estado on public.toners (estado);
create index idx_toners_ativo on public.toners (ativo);
create index idx_toners_busca_trgm on public.toners using gin (
  (marca || ' ' || modelo || ' ' || referencia) gin_trgm_ops
);

-- ---------- IMAGENS DOS TONERS ----------

create table public.toner_imagens (
  id uuid primary key default gen_random_uuid(),
  toner_id uuid not null references public.toners (id) on delete cascade,
  storage_path text not null,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_toner_imagens_toner on public.toner_imagens (toner_id);

-- ---------- PEDIDOS ----------

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity,
  empresa_id uuid not null references public.empresas (id),
  solicitante_id uuid not null references public.profiles (id),
  estado public.pedido_estado not null default 'recebido',
  observacoes text,
  motivo_recusa text,
  aprovado_por uuid references public.profiles (id),
  aprovado_em timestamptz,
  concluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_pedidos_updated_at
  before update on public.pedidos
  for each row execute function public.set_updated_at();

create index idx_pedidos_empresa on public.pedidos (empresa_id);
create index idx_pedidos_solicitante on public.pedidos (solicitante_id);
create index idx_pedidos_estado on public.pedidos (estado);
create index idx_pedidos_created_at on public.pedidos (created_at desc);

-- ---------- ITENS DO PEDIDO ----------

create table public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  toner_id uuid not null references public.toners (id),
  quantidade integer not null check (quantidade > 0),
  created_at timestamptz not null default now(),
  unique (pedido_id, toner_id)
);

create index idx_pedido_itens_pedido on public.pedido_itens (pedido_id);
create index idx_pedido_itens_toner on public.pedido_itens (toner_id);

-- ---------- FAVORITOS ----------

create table public.favoritos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  toner_id uuid not null references public.toners (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, toner_id)
);

create index idx_favoritos_profile on public.favoritos (profile_id);

-- ---------- NOTIFICAÇÕES ----------

create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensagem text not null,
  link text,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notificacoes_profile on public.notificacoes (profile_id, lida);

-- ---------- LAYOUTS DE DASHBOARD (por utilizador) ----------

create table public.dashboard_layouts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  nome text not null default 'default',
  layout jsonb not null default '[]',
  widgets_visiveis jsonb not null default '[]',
  widgets_fixos jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, nome)
);

create trigger trg_dashboard_layouts_updated_at
  before update on public.dashboard_layouts
  for each row execute function public.set_updated_at();

-- ---------- MOVIMENTOS DE STOCK ----------

create table public.movimentos_stock (
  id uuid primary key default gen_random_uuid(),
  toner_id uuid not null references public.toners (id),
  tipo public.movimento_tipo not null,
  quantidade integer not null check (quantidade <> 0),
  motivo text,
  pedido_id uuid references public.pedidos (id),
  profile_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index idx_movimentos_toner on public.movimentos_stock (toner_id);
create index idx_movimentos_created_at on public.movimentos_stock (created_at desc);

-- ---------- AUDITORIA ----------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id),
  acao text not null,
  entidade text not null,
  entidade_id uuid,
  detalhes jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_entidade on public.audit_logs (entidade, entidade_id);
create index idx_audit_logs_profile on public.audit_logs (profile_id);
create index idx_audit_logs_created_at on public.audit_logs (created_at desc);

-- ============================================================
-- Reserva automática de stock
-- ============================================================

-- Ao adicionar um item a um pedido, reserva a quantidade pedida
-- (impede reservar mais do que o stock disponível).
create or replace function public.reservar_stock_ao_criar_item()
returns trigger
language plpgsql
as $$
declare
  disponivel integer;
begin
  select (quantidade - quantidade_reservada) into disponivel
  from public.toners
  where id = new.toner_id
  for update;

  if disponivel is null then
    raise exception 'Toner % não encontrado', new.toner_id;
  end if;

  if new.quantidade > disponivel then
    raise exception 'Quantidade pedida (%) excede o stock disponível (%)', new.quantidade, disponivel;
  end if;

  update public.toners
  set quantidade_reservada = quantidade_reservada + new.quantidade
  where id = new.toner_id;

  return new;
end;
$$;

create trigger trg_reservar_stock_ao_criar_item
  before insert on public.pedido_itens
  for each row execute function public.reservar_stock_ao_criar_item();

-- Ao mudar o estado do pedido: liberta a reserva se for recusado/cancelado;
-- confirma a saída de stock real (e regista o movimento) se for concluído.
create or replace function public.aplicar_transicao_estado_pedido()
returns trigger
language plpgsql
as $$
declare
  item record;
begin
  if new.estado = old.estado then
    return new;
  end if;

  if new.estado in ('recusado', 'cancelado') and old.estado not in ('recusado', 'cancelado', 'concluido') then
    for item in select toner_id, quantidade from public.pedido_itens where pedido_id = new.id loop
      update public.toners
      set quantidade_reservada = quantidade_reservada - item.quantidade
      where id = item.toner_id;
    end loop;
  end if;

  if new.estado = 'concluido' and old.estado <> 'concluido' then
    for item in select toner_id, quantidade from public.pedido_itens where pedido_id = new.id loop
      update public.toners
      set quantidade = quantidade - item.quantidade,
          quantidade_reservada = quantidade_reservada - item.quantidade
      where id = item.toner_id;

      insert into public.movimentos_stock (toner_id, tipo, quantidade, motivo, pedido_id, profile_id)
      values (item.toner_id, 'saida', item.quantidade, 'Pedido concluído', new.id, new.aprovado_por);
    end loop;
    new.concluido_em = now();
  end if;

  if new.estado = 'aprovado' and old.estado <> 'aprovado' then
    new.aprovado_em = now();
  end if;

  return new;
end;
$$;

create trigger trg_aplicar_transicao_estado_pedido
  before update of estado on public.pedidos
  for each row execute function public.aplicar_transicao_estado_pedido();

-- ============================================================
-- Row Level Security
-- ============================================================
-- Ativado em todas as tabelas por segurança. Só a leitura pública
-- do catálogo é definida aqui — o resto das políticas (por perfil
-- e role) fica para a Fase 3.

alter table public.empresas enable row level security;
alter table public.profiles enable row level security;
alter table public.toners enable row level security;
alter table public.toner_imagens enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;
alter table public.favoritos enable row level security;
alter table public.notificacoes enable row level security;
alter table public.dashboard_layouts enable row level security;
alter table public.movimentos_stock enable row level security;
alter table public.audit_logs enable row level security;

create policy "Catálogo de toners ativos é público"
  on public.toners for select
  using (ativo = true);

create policy "Imagens de toners ativos são públicas"
  on public.toner_imagens for select
  using (
    exists (
      select 1 from public.toners
      where toners.id = toner_imagens.toner_id and toners.ativo = true
    )
  );

# Banco de Bens Doados — Gestão de Toners (BackOffice)

Aplicação de gestão interna do Banco de Bens Doados: gestão de stock de toners, pedidos, empresas, utilizadores, relatórios, dashboard analítico e auditoria. Autenticação com perfis (Administrador, Gestor, Operador, Leitor).

## Stack

React 19 · Vite · TypeScript · Tailwind CSS · Shadcn/UI · Framer Motion · React Router · TanStack Query · React Hook Form · Zod · React Grid Layout · React DnD · Recharts · React Hot Toast · Lucide React · Supabase

## Base de dados e migrações

Este repositório é a **fonte da verdade** da configuração do Supabase partilhado com o [Portal](https://github.com/smurfguerra07-cell/Banco_Bens_Doados_Torners_Frontoffice) — ver pasta `supabase/`. Todas as migrações de base de dados (tabelas, RLS, functions, triggers, seeds) são criadas e versionadas aqui.

## Pré-requisitos

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)

## Configuração local

1. Clonar o repositório.
2. `cp .env.example .env.local` e preencher com os valores do projeto Supabase (Project Settings → API). A `secret key` nunca vai para este ficheiro — ver aviso em `.env.example`.
3. `supabase login` e `supabase link --project-ref <PROJECT_REF>` para ligar este repositório ao projeto Supabase remoto.
4. `pnpm install` (disponível a partir da Fase 4, quando o projeto Vite for criado).
5. `pnpm dev`.

## Branches

Trabalho direto em `main` (deploy automático para `admin.bancodebensdoados.pt`). `feature/*`/`fix/*`/`chore/*` são opcionais para testar algo isolado via Preview Deployment antes de ir para `main`.

Ver [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) para a convenção de commits e branches.

## Estado do projeto

🚧 Fase 1 — Infraestrutura. A estrutura de código da aplicação (`src/`) e o esquema completo da base de dados (tabelas de negócio) serão criados nas Fases 2 e 4.

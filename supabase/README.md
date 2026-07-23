# Supabase — configuração local

Este projeto (`Banco_Bens_Doados_Torners`, ref `rgeoxenmgnvzgladnrhj`) já existe no Supabase. Para ligar o Supabase CLI local a ele:

```bash
npm install -g supabase
supabase login
supabase init            # gera config.toml (não apaga a pasta migrations/ já existente)
supabase link --project-ref rgeoxenmgnvzgladnrhj
```

`config.toml` não é versionado propositadamente pela Fase 1 — é gerado localmente por `supabase init` e fica específico de cada máquina/ambiente de desenvolvimento (portas locais, etc.). Se preferires versioná-lo, adiciona-o ao git depois de gerado.

## Migrações

- `migrations/0000_extensions.sql` — ativa as extensões base (`pgcrypto`, `pg_trgm`). Ainda não há tabelas de negócio (toners, pedidos, empresas, utilizadores) — essas são criadas na **Fase 2 (Modelação da base de dados)**.

Para aplicar as migrações ao projeto remoto:

```bash
supabase db push
```

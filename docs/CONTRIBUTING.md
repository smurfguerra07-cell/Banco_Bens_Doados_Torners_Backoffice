# Convenção de Branches e Commits

## Branches

| Branch      | Propósito                                              | Protegida |
|-------------|---------------------------------------------------------|-----------|
| `main`      | Produção — reflete sempre o que está em `admin.bancodebensdoados.pt` | Sim |
| `develop`   | Integração — base para novas features                  | Sim |
| `feature/*` | Nova funcionalidade (ex: `feature/dashboard-widgets`)   | Não |
| `fix/*`     | Correção de bug (ex: `fix/reserva-stock`)               | Não |
| `chore/*`   | Manutenção, config, dependências, migrações (ex: `chore/migration-toners`) | Não |

Fluxo: `feature/*` / `fix/*` / `chore/*` → PR para `develop` → (após validação) PR de `develop` para `main`.

## Commits — Conventional Commits

Formato: `tipo(escopo opcional): descrição curta no imperativo`

Tipos usados neste projeto:

- `feat:` nova funcionalidade — ex: `feat(pedidos): adicionar aprovação em lote`
- `fix:` correção de bug — ex: `fix(stock): corrigir reserva automática ao aprovar pedido`
- `chore:` tarefas de manutenção/infra — ex: `chore: configurar eslint e prettier`
- `docs:` documentação — ex: `docs: atualizar README com passos de setup`
- `refactor:` refatoração sem alterar comportamento
- `style:` formatação, sem alteração de lógica
- `test:` testes automatizados
- `perf:` melhorias de performance
- `db:` migrações e alterações de esquema Supabase — ex: `db: criar tabela toners e relacionamentos`

Exemplo de histórico:

```
chore: initial repository scaffolding
db: ativar extensões pgcrypto e pg_trgm
db: criar tabelas de toners, pedidos e empresas
feat(dashboard): grelha de widgets arrastável
fix(pedidos): corrigir filtro por estado
```

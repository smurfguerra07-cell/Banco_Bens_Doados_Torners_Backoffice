# Convenção de Branches e Commits

## Branches

Repositório privado, trabalho solo — sem `develop` nem Pull Requests obrigatórios. Trabalha diretamente em `main`, que é a branch que o Vercel usa para produção (`admin.bancodebensdoados.pt`).

Branches como `feature/*` / `fix/*` / `chore/*` são opcionais, úteis quando quiseres testar algo isoladamente antes de ir para `main` — o Vercel gera automaticamente uma Preview Deployment para qualquer branch ou PR criado.

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

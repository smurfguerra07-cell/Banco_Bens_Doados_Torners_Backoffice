# Esquema da Base de Dados — Fase 2

Ver migração completa em [`migrations/0001_core_schema.sql`](migrations/0001_core_schema.sql).

## Diagrama relacional

```mermaid
erDiagram
    empresas ||--o{ profiles : "empresa_id"
    empresas ||--o{ pedidos : "empresa_id"
    profiles ||--o{ pedidos : "solicitante_id"
    profiles ||--o{ favoritos : "profile_id"
    profiles ||--o{ notificacoes : "profile_id"
    profiles ||--o{ dashboard_layouts : "profile_id"
    profiles ||--o{ audit_logs : "profile_id"
    toners ||--o{ toner_imagens : "toner_id"
    toners ||--o{ pedido_itens : "toner_id"
    toners ||--o{ favoritos : "toner_id"
    toners ||--o{ movimentos_stock : "toner_id"
    pedidos ||--|{ pedido_itens : "pedido_id"
    pedidos ||--o{ movimentos_stock : "pedido_id"

    empresas {
        uuid id PK
        text nome
        text nif
        empresa_tipo tipo
        boolean ativo
    }
    profiles {
        uuid id PK "= auth.users.id"
        uuid empresa_id FK
        user_role role
        text full_name
    }
    toners {
        uuid id PK
        text marca
        text modelo
        text referencia
        integer quantidade
        integer quantidade_reservada
        toner_estado estado
        boolean ativo
    }
    toner_imagens {
        uuid id PK
        uuid toner_id FK
        text storage_path
    }
    pedidos {
        uuid id PK
        bigint numero
        uuid empresa_id FK
        uuid solicitante_id FK
        pedido_estado estado
    }
    pedido_itens {
        uuid id PK
        uuid pedido_id FK
        uuid toner_id FK
        integer quantidade
    }
    favoritos {
        uuid id PK
        uuid profile_id FK
        uuid toner_id FK
    }
    notificacoes {
        uuid id PK
        uuid profile_id FK
        text tipo
        boolean lida
    }
    dashboard_layouts {
        uuid id PK
        uuid profile_id FK
        jsonb layout
    }
    movimentos_stock {
        uuid id PK
        uuid toner_id FK
        movimento_tipo tipo
        uuid pedido_id FK
    }
    audit_logs {
        uuid id PK
        uuid profile_id FK
        text acao
        text entidade
    }
```

## Fluxo de estados do pedido

```
recebido → em_analise → aprovado → em_preparacao → pronto_levantamento → concluido
                       ↘ recusado
(qualquer estado antes de concluido) → cancelado
```

## Reserva automática de stock

- Ao criar um `pedido_itens`, a trigger `reservar_stock_ao_criar_item` soma a quantidade a `toners.quantidade_reservada` (e recusa se exceder o disponível).
- Ao mudar `pedidos.estado` para `recusado`/`cancelado`, a trigger `aplicar_transicao_estado_pedido` liberta a reserva.
- Ao mudar para `concluido`, a mesma trigger dá baixa real ao stock (`quantidade`) e regista um `movimentos_stock` do tipo `saida`.

## O que falta (fases seguintes)

- **Fase 3**: políticas RLS completas por `role` (administrador/gestor/operador/leitor/cliente) em todas as tabelas — atualmente só o catálogo de toners ativos é público.
- **Fase 9**: ativar Realtime nas tabelas `pedidos` e `notificacoes`.
- Seeds de dados de exemplo (marcas, toners, empresas fictícias) para testes — a criar quando o CRUD do BackOffice existir.

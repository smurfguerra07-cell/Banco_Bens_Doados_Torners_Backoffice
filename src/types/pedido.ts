export type PedidoEstado =
  | "recebido"
  | "em_analise"
  | "aprovado"
  | "recusado"
  | "em_preparacao"
  | "pronto_levantamento"
  | "concluido"
  | "cancelado"

export const PEDIDO_ESTADO_LABEL: Record<PedidoEstado, string> = {
  recebido: "Recebido",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  recusado: "Recusado",
  em_preparacao: "Em preparação",
  pronto_levantamento: "Pronto para levantamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
}

export const PROXIMO_ESTADO: Partial<Record<PedidoEstado, PedidoEstado>> = {
  recebido: "em_analise",
  em_analise: "aprovado",
  aprovado: "em_preparacao",
  em_preparacao: "pronto_levantamento",
  pronto_levantamento: "concluido",
}

export interface PedidoItem {
  id: string
  toner_id: string
  quantidade: number
  toners: {
    marca: string
    modelo: string
    referencia: string
  } | null
}

export interface Pedido {
  id: string
  numero: number
  empresa_id: string
  solicitante_id: string
  estado: PedidoEstado
  observacoes: string | null
  motivo_recusa: string | null
  data_entrega: string | null
  created_at: string
  aprovado_em: string | null
  concluido_em: string | null
  empresas: {
    nome: string
    morada: string | null
    codigo_postal: string | null
    cidade: string | null
    telefone: string | null
  } | null
  profiles: { full_name: string; telefone: string | null } | null
  pedido_itens: PedidoItem[]
}

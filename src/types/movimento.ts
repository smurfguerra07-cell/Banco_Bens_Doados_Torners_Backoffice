export type MovimentoTipo = "entrada" | "saida" | "ajuste"

export const MOVIMENTO_TIPO_LABEL: Record<MovimentoTipo, string> = {
  entrada: "Entrada",
  saida: "Saída",
  ajuste: "Ajuste",
}

export interface MovimentoStock {
  id: string
  toner_id: string
  tipo: MovimentoTipo
  quantidade: number
  motivo: string | null
  pedido_id: string | null
  empresa_id: string | null
  profile_id: string | null
  created_at: string
  empresas: { nome: string } | null
  profiles: { full_name: string } | null
  pedidos: { numero: number } | null
  toners?: { marca: string; modelo: string; referencia: string } | null
}

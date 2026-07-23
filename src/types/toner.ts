export type TonerEstado = "novo" | "usado" | "reconstruido"

export interface TonerImagem {
  id: string
  toner_id: string
  storage_path: string
  ordem: number
}

export interface Toner {
  id: string
  marca: string
  modelo: string
  referencia: string
  compatibilidade: string[]
  quantidade: number
  quantidade_reservada: number
  estado: TonerEstado
  localizacao: string | null
  categoria: string | null
  observacoes: string | null
  ativo: boolean
  created_at: string
  toner_imagens?: TonerImagem[]
}

export const TONER_ESTADO_LABEL: Record<TonerEstado, string> = {
  novo: "Novo",
  usado: "Usado",
  reconstruido: "Reconstruído",
}

export interface TonerInput {
  marca: string
  modelo: string
  referencia: string
  compatibilidade: string[]
  quantidade: number
  estado: TonerEstado
  localizacao: string | null
  categoria: string | null
  observacoes: string | null
  ativo: boolean
}

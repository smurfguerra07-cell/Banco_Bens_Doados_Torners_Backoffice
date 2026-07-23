export type TicketEstado = "aberto" | "em_espera" | "fechado"

export const TICKET_ESTADO_LABEL: Record<TicketEstado, string> = {
  aberto: "Aberto",
  em_espera: "Em espera",
  fechado: "Fechado",
}

export type TicketCategoria = "duvidas" | "devolucao" | "outro"

export const TICKET_CATEGORIA_LABEL: Record<TicketCategoria, string> = {
  duvidas: "Dúvidas",
  devolucao: "Devolução",
  outro: "Outro",
}

export interface Ticket {
  id: string
  numero: number
  profile_id: string
  assunto: string
  categoria: TicketCategoria
  estado: TicketEstado
  created_at: string
  updated_at: string
  profiles: { full_name: string; telefone: string | null } | null
}

export type AnexoTipo = "imagem" | "audio"

export interface TicketMensagem {
  id: string
  ticket_id: string
  autor_id: string
  conteudo: string | null
  anexo_url: string | null
  anexo_tipo: AnexoTipo | null
  created_at: string
}

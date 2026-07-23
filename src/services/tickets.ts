import { supabase } from "@/lib/supabase"
import type { AnexoTipo, Ticket, TicketEstado, TicketMensagem } from "@/types/ticket"

const SELECT_COMPLETO = `
  *,
  profiles!tickets_profile_id_fkey ( full_name, telefone )
`

export async function fetchTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select(SELECT_COMPLETO)
    .order("updated_at", { ascending: false })
  if (error) throw error
  return data as unknown as Ticket[]
}

export async function alterarEstadoTicket(ticketId: string, estado: TicketEstado) {
  const { error } = await supabase.from("tickets").update({ estado }).eq("id", ticketId)
  if (error) throw error
}

export async function fetchMensagens(ticketId: string): Promise<TicketMensagem[]> {
  const { data, error } = await supabase
    .from("ticket_mensagens")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return data as TicketMensagem[]
}

export async function enviarMensagem(params: {
  ticketId: string
  autorId: string
  conteudo?: string
  anexoUrl?: string
  anexoTipo?: AnexoTipo
}): Promise<TicketMensagem> {
  const { data, error } = await supabase
    .from("ticket_mensagens")
    .insert({
      ticket_id: params.ticketId,
      autor_id: params.autorId,
      conteudo: params.conteudo || null,
      anexo_url: params.anexoUrl || null,
      anexo_tipo: params.anexoTipo || null,
    })
    .select()
    .single()
  if (error) throw error
  return data as TicketMensagem
}

export async function uploadAnexoTicket(
  ticketId: string,
  file: File | Blob,
  nomeFicheiro: string
): Promise<string> {
  const caminho = `${ticketId}/${Date.now()}-${nomeFicheiro}`
  const { error: uploadError } = await supabase.storage
    .from("ticket-anexos")
    .upload(caminho, file)
  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from("ticket-anexos").getPublicUrl(caminho)
  return publicUrl
}

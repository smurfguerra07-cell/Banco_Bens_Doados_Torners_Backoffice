import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import {
  alterarEstadoTicket,
  enviarMensagem,
  fetchMensagens,
  fetchTickets,
} from "@/services/tickets"
import type { AnexoTipo, TicketEstado } from "@/types/ticket"

export function useTickets() {
  return useQuery({
    queryKey: ["admin-tickets"],
    queryFn: fetchTickets,
    refetchInterval: 15000,
  })
}

export function useAlterarEstadoTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: TicketEstado }) =>
      alterarEstadoTicket(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] })
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useMensagens(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["ticket-mensagens", ticketId],
    queryFn: () => fetchMensagens(ticketId as string),
    enabled: Boolean(ticketId),
    refetchInterval: ticketId ? 4000 : false,
  })
}

export function useEnviarMensagem(ticketId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { conteudo?: string; anexoUrl?: string; anexoTipo?: AnexoTipo }) =>
      enviarMensagem({
        ticketId: ticketId as string,
        autorId: userId as string,
        ...params,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-mensagens", ticketId] })
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] })
    },
  })
}

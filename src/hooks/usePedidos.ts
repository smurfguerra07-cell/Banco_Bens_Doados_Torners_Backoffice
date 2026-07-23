import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { atualizarEstadoPedido, fetchPedidos } from "@/services/pedidos"
import type { PedidoEstado } from "@/types/pedido"

export function usePedidos() {
  return useQuery({
    queryKey: ["admin-pedidos"],
    queryFn: fetchPedidos,
  })
}

export function useAtualizarEstadoPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      estado,
      motivoRecusa,
    }: {
      id: string
      estado: PedidoEstado
      motivoRecusa?: string
    }) => atualizarEstadoPedido(id, estado, motivoRecusa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pedidos"] })
      queryClient.invalidateQueries({ queryKey: ["admin-toners"] })
      toast.success("Estado do pedido atualizado.")
    },
    onError: (err) => toast.error(err.message),
  })
}

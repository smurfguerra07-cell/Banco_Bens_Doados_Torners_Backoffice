import { supabase } from "@/lib/supabase"
import type { Pedido, PedidoEstado } from "@/types/pedido"

const SELECT_COMPLETO = `
  *,
  empresas ( nome ),
  profiles!pedidos_solicitante_id_fkey ( full_name ),
  pedido_itens (
    id,
    toner_id,
    quantidade,
    toners ( marca, modelo, referencia )
  )
`

export async function fetchPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select(SELECT_COMPLETO)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as unknown as Pedido[]
}

export async function atualizarEstadoPedido(
  id: string,
  estado: PedidoEstado,
  motivoRecusa?: string
) {
  const { error } = await supabase
    .from("pedidos")
    .update({
      estado,
      motivo_recusa: estado === "recusado" ? motivoRecusa ?? null : null,
    })
    .eq("id", id)

  if (error) throw error
}

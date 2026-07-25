import { supabase } from "@/lib/supabase"
import type { MovimentoStock } from "@/types/movimento"

export async function fetchMovimentosToner(tonerId: string): Promise<MovimentoStock[]> {
  const { data, error } = await supabase
    .from("movimentos_stock")
    .select("*, empresas ( nome ), profiles ( full_name ), pedidos ( numero )")
    .eq("toner_id", tonerId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as unknown as MovimentoStock[]
}

/**
 * Movimentos de entrada (doações) com empresa associada, de todos os
 * toners — usado pela Aura para responder sobre histórico de doadores.
 */
export async function fetchMovimentosDoacao(): Promise<MovimentoStock[]> {
  const { data, error } = await supabase
    .from("movimentos_stock")
    .select("*, empresas ( nome ), toners ( marca, modelo, referencia )")
    .eq("tipo", "entrada")
    .not("empresa_id", "is", null)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as unknown as MovimentoStock[]
}

export async function registarMovimentoEntrada(params: {
  tonerId: string
  quantidade: number
  empresaId: string | null
  profileId: string
  motivo?: string
}) {
  if (params.quantidade <= 0) return
  const { error } = await supabase.from("movimentos_stock").insert({
    toner_id: params.tonerId,
    tipo: "entrada",
    quantidade: params.quantidade,
    empresa_id: params.empresaId,
    profile_id: params.profileId,
    motivo: params.motivo || null,
  })
  if (error) throw error
}

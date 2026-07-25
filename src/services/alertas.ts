import { supabase } from "@/lib/supabase"
import type { AlertaStock } from "@/types/alerta"

export async function fetchAlertas(): Promise<AlertaStock[]> {
  const { data, error } = await supabase
    .from("aura_alertas")
    .select("*, toners ( marca, modelo, referencia )")
    .eq("ativo", true)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as unknown as AlertaStock[]
}

export async function criarAlerta(params: { tonerId: string; limite: number; criadoPor: string }) {
  const { error } = await supabase.from("aura_alertas").insert({
    toner_id: params.tonerId,
    limite: params.limite,
    criado_por: params.criadoPor,
  })
  if (error) throw error
}

export async function removerAlerta(id: string) {
  const { error } = await supabase.from("aura_alertas").delete().eq("id", id)
  if (error) throw error
}

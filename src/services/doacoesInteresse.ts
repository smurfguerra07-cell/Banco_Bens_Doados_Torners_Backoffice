import { supabase } from "@/lib/supabase"
import type { DoacaoInteresse, DoacaoInteresseEstado } from "@/types/doacaoInteresse"

export async function fetchDoacoesInteresse(): Promise<DoacaoInteresse[]> {
  const { data, error } = await supabase
    .from("doacoes_interesse")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as DoacaoInteresse[]
}

export async function atualizarEstadoDoacaoInteresse(id: string, estado: DoacaoInteresseEstado) {
  const { error } = await supabase.from("doacoes_interesse").update({ estado }).eq("id", id)
  if (error) throw error
}

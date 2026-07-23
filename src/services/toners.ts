import { supabase } from "@/lib/supabase"
import type { Toner, TonerInput } from "@/types/toner"

export async function fetchToners(): Promise<Toner[]> {
  const { data, error } = await supabase
    .from("toners")
    .select("*, toner_imagens(*)")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as Toner[]
}

export async function createToner(input: TonerInput) {
  const { data, error } = await supabase
    .from("toners")
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as Toner
}

export async function updateToner(id: string, input: TonerInput) {
  const { data, error } = await supabase
    .from("toners")
    .update(input)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as Toner
}

export async function toggleTonerAtivo(id: string, ativo: boolean) {
  const { error } = await supabase.from("toners").update({ ativo }).eq("id", id)
  if (error) throw error
}

export async function deleteToner(id: string) {
  const { error } = await supabase.from("toners").delete().eq("id", id)
  if (error) throw error
}

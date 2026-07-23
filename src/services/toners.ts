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

/**
 * Faz upload de uma nova imagem para o toner e substitui a existente
 * (o catálogo público só mostra uma imagem por toner, por agora).
 */
export async function substituirImagemToner(tonerId: string, file: File) {
  const extensao = file.name.split(".").pop() ?? "jpg"
  const caminho = `${tonerId}/${Date.now()}.${extensao}`

  const { error: uploadError } = await supabase.storage
    .from("toners-images")
    .upload(caminho, file, { upsert: true })
  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from("toners-images").getPublicUrl(caminho)

  const { error: deleteError } = await supabase
    .from("toner_imagens")
    .delete()
    .eq("toner_id", tonerId)
  if (deleteError) throw deleteError

  const { error: insertError } = await supabase.from("toner_imagens").insert({
    toner_id: tonerId,
    storage_path: publicUrl,
    ordem: 0,
  })
  if (insertError) throw insertError

  return publicUrl
}

/** Cria ou atualiza um toner e, opcionalmente, a sua imagem — num só passo. */
export async function guardarToner(params: {
  id?: string
  input: TonerInput
  imagem?: File | null
}) {
  const toner = params.id
    ? await updateToner(params.id, params.input)
    : await createToner(params.input)

  if (params.imagem) {
    await substituirImagemToner(toner.id, params.imagem)
  }

  return toner
}

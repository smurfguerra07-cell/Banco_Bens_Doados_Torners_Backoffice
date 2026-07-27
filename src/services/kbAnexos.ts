import { supabase } from "@/lib/supabase"
import type { KbAnexo, KbAnexoTipo } from "@/types/kbAnexo"

export async function fetchAnexos(artigoId: string): Promise<KbAnexo[]> {
  const { data, error } = await supabase
    .from("kb_anexos")
    .select("*")
    .eq("artigo_id", artigoId)
    .order("ordem", { ascending: true })
  if (error) throw error
  return data as KbAnexo[]
}

export async function uploadAnexoKb(
  artigoId: string,
  file: File,
  tipo: KbAnexoTipo,
  ordem: number
): Promise<KbAnexo> {
  const caminho = `${artigoId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from("kb-anexos").upload(caminho, file)
  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from("kb-anexos").getPublicUrl(caminho)

  const { data, error } = await supabase
    .from("kb_anexos")
    .insert({
      artigo_id: artigoId,
      tipo,
      titulo: file.name,
      url: publicUrl,
      storage_path: caminho,
      ordem,
    })
    .select()
    .single()
  if (error) throw error
  return data as KbAnexo
}

export async function adicionarAnexoLink(
  artigoId: string,
  params: { tipo: "video_youtube" | "link"; titulo: string; url: string; ordem: number }
): Promise<KbAnexo> {
  const { data, error } = await supabase
    .from("kb_anexos")
    .insert({ artigo_id: artigoId, ...params })
    .select()
    .single()
  if (error) throw error
  return data as KbAnexo
}

export async function removerAnexo(id: string) {
  const { error } = await supabase.from("kb_anexos").delete().eq("id", id)
  if (error) throw error
}

export async function reordenarAnexos(atualizacoes: { id: string; ordem: number }[]) {
  await Promise.all(
    atualizacoes.map(({ id, ordem }) => supabase.from("kb_anexos").update({ ordem }).eq("id", id))
  )
}

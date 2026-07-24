import { supabase } from "@/lib/supabase"
import type { Toner, TonerInput } from "@/types/toner"
import type { TonerImportado } from "@/lib/importToners"

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

/**
 * Importa vários toners de uma vez (CSV/Excel). Faz upsert por referência:
 * se já existir um toner com a mesma referência, soma a quantidade
 * importada ao stock atual e só substitui os campos opcionais (categoria,
 * cor, localização, compatibilidade, estado) se o ficheiro os trouxer —
 * caso contrário mantém o que já lá estava.
 */
export async function importarToners(itens: TonerImportado[]) {
  const referencias = itens.map((i) => i.referencia)
  const { data: existentes, error: fetchError } = await supabase
    .from("toners")
    .select("referencia, quantidade, estado, categoria, cor, localizacao, compatibilidade")
    .in("referencia", referencias)
  if (fetchError) throw fetchError

  const porReferencia = new Map((existentes ?? []).map((t) => [t.referencia, t]))

  const linhas = itens.map((item) => {
    const existente = porReferencia.get(item.referencia)
    return {
      marca: item.marca,
      modelo: item.modelo,
      referencia: item.referencia,
      quantidade: (existente?.quantidade ?? 0) + item.quantidade,
      estado: item.estado ?? existente?.estado ?? "novo",
      categoria: item.categoria || existente?.categoria || null,
      cor: item.cor || existente?.cor || null,
      localizacao: item.localizacao || existente?.localizacao || null,
      compatibilidade:
        item.compatibilidade.length > 0
          ? item.compatibilidade
          : (existente?.compatibilidade ?? []),
      ativo: true,
    }
  })

  const { error } = await supabase.from("toners").upsert(linhas, { onConflict: "referencia" })
  if (error) throw error

  return {
    novos: linhas.length - porReferencia.size,
    atualizados: porReferencia.size,
  }
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

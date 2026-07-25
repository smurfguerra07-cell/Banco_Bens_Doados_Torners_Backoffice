import { supabase } from "@/lib/supabase"
import type { Toner, TonerEstado, TonerInput } from "@/types/toner"
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
export async function importarToners(
  itens: TonerImportado[],
  params: { empresaId: string | null; profileId: string }
) {
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

  const { data: gravados, error } = await supabase
    .from("toners")
    .upsert(linhas, { onConflict: "referencia" })
    .select("id, referencia")
  if (error) throw error

  const idPorReferencia = new Map((gravados ?? []).map((t) => [t.referencia, t.id]))
  const movimentos = itens
    .map((item) => {
      const tonerId = idPorReferencia.get(item.referencia)
      if (!tonerId) return null
      return {
        toner_id: tonerId,
        tipo: "entrada" as const,
        quantidade: item.quantidade,
        empresa_id: params.empresaId,
        profile_id: params.profileId,
        motivo: "Importação de ficheiro",
      }
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)

  if (movimentos.length > 0) {
    const { error: movError } = await supabase.from("movimentos_stock").insert(movimentos)
    if (movError) throw movError
  }

  return {
    novos: linhas.length - porReferencia.size,
    atualizados: porReferencia.size,
  }
}

/**
 * Incrementa o stock de um toner e regista a entrada no histórico —
 * usado pelo assistente Aura, depois de o utilizador confirmar a ação.
 */
export async function incrementarStockToner(
  tonerId: string,
  quantidade: number,
  profileId: string
) {
  const { data: atual, error: fetchError } = await supabase
    .from("toners")
    .select("quantidade")
    .eq("id", tonerId)
    .single()
  if (fetchError) throw fetchError

  const { error } = await supabase
    .from("toners")
    .update({ quantidade: atual.quantidade + quantidade })
    .eq("id", tonerId)
  if (error) throw error

  const { error: movError } = await supabase.from("movimentos_stock").insert({
    toner_id: tonerId,
    tipo: "entrada",
    quantidade,
    profile_id: profileId,
    motivo: "Via assistente Aura",
  })
  if (movError) throw movError
}

/**
 * Regista uma doação recebida — soma a quantidade, atualiza a condição
 * do toner e regista a entrada no histórico com o doador. Usado pelo
 * fluxo guiado "registar doação" do assistente Aura.
 */
export async function registarDoacaoToner(params: {
  tonerId: string
  quantidade: number
  condicao: TonerEstado
  empresaId: string | null
  profileId: string
}) {
  const { data: atual, error: fetchError } = await supabase
    .from("toners")
    .select("quantidade")
    .eq("id", params.tonerId)
    .single()
  if (fetchError) throw fetchError

  const { error } = await supabase
    .from("toners")
    .update({ quantidade: atual.quantidade + params.quantidade, estado: params.condicao })
    .eq("id", params.tonerId)
  if (error) throw error

  const { error: movError } = await supabase.from("movimentos_stock").insert({
    toner_id: params.tonerId,
    tipo: "entrada",
    quantidade: params.quantidade,
    empresa_id: params.empresaId,
    profile_id: params.profileId,
    motivo: "Doação registada via assistente Aura",
  })
  if (movError) throw movError
}

/**
 * Corrige a quantidade de um toner para o valor real contado — usado
 * pelo fluxo guiado "contagem semanal" do assistente Aura. Só regista
 * um movimento de ajuste se o valor realmente mudar.
 */
export async function ajustarQuantidadeToner(tonerId: string, quantidadeNova: number, profileId: string) {
  const { data: atual, error: fetchError } = await supabase
    .from("toners")
    .select("quantidade")
    .eq("id", tonerId)
    .single()
  if (fetchError) throw fetchError

  const diferenca = quantidadeNova - atual.quantidade
  if (diferenca === 0) return

  const { error } = await supabase.from("toners").update({ quantidade: quantidadeNova }).eq("id", tonerId)
  if (error) throw error

  const { error: movError } = await supabase.from("movimentos_stock").insert({
    toner_id: tonerId,
    tipo: "ajuste",
    quantidade: diferenca,
    profile_id: profileId,
    motivo: "Correção via contagem semanal (Aura)",
  })
  if (movError) throw movError
}

/**
 * Cria ou atualiza um toner e, opcionalmente, a sua imagem — num só
 * passo. Se a quantidade subir (toner novo, ou edição que aumenta o
 * stock), regista automaticamente uma entrada no histórico, com a
 * empresa doadora escolhida (se houver).
 */
export async function guardarToner(params: {
  id?: string
  input: TonerInput
  imagem?: File | null
  empresaId?: string | null
  profileId?: string
}) {
  const quantidadeAnterior = params.id
    ? ((await supabase.from("toners").select("quantidade").eq("id", params.id).single()).data
        ?.quantidade ?? 0)
    : 0

  const toner = params.id
    ? await updateToner(params.id, params.input)
    : await createToner(params.input)

  if (params.imagem) {
    await substituirImagemToner(toner.id, params.imagem)
  }

  const entrada = toner.quantidade - quantidadeAnterior
  if (entrada > 0 && params.profileId) {
    const { error } = await supabase.from("movimentos_stock").insert({
      toner_id: toner.id,
      tipo: "entrada",
      quantidade: entrada,
      empresa_id: params.empresaId || null,
      profile_id: params.profileId,
      motivo: params.id ? "Ajuste manual do stock" : "Criação do toner",
    })
    if (error) throw error
  }

  return toner
}

import { supabase } from "@/lib/supabase"
import type { KbArtigo, KbArtigoInput } from "@/types/kbArtigo"

export async function fetchArtigos(): Promise<KbArtigo[]> {
  const { data, error } = await supabase
    .from("kb_artigos")
    .select("*")
    .order("categoria", { ascending: true })
    .order("prioridade", { ascending: false })
  if (error) throw error
  return data as KbArtigo[]
}

export async function fetchArtigoById(id: string): Promise<KbArtigo> {
  const { data, error } = await supabase.from("kb_artigos").select("*").eq("id", id).single()
  if (error) throw error
  return data as KbArtigo
}

export async function criarArtigo(input: KbArtigoInput, autorId: string) {
  const { data, error } = await supabase
    .from("kb_artigos")
    .insert({ ...input, autor_id: autorId })
    .select()
    .single()
  if (error) throw error
  return data as KbArtigo
}

export async function atualizarArtigo(id: string, input: KbArtigoInput) {
  const { data, error } = await supabase
    .from("kb_artigos")
    .update(input)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as KbArtigo
}

export async function duplicarArtigo(artigo: KbArtigo) {
  const { data, error } = await supabase
    .from("kb_artigos")
    .insert({
      titulo: `${artigo.titulo} (cópia)`,
      subtitulo: artigo.subtitulo,
      categoria: artigo.categoria,
      resumo: artigo.resumo,
      conteudo: artigo.conteudo,
      palavras_chave: artigo.palavras_chave,
      sinonimos: artigo.sinonimos,
      prioridade: artigo.prioridade,
      estado: "rascunho",
      autor_id: artigo.autor_id,
    })
    .select()
    .single()
  if (error) throw error
  return data as KbArtigo
}

export async function arquivarArtigo(id: string) {
  const { error } = await supabase.from("kb_artigos").update({ estado: "arquivado" }).eq("id", id)
  if (error) throw error
}

export async function publicarArtigo(id: string) {
  const { error } = await supabase.from("kb_artigos").update({ estado: "publicado" }).eq("id", id)
  if (error) throw error
}

export async function fetchFaqsRelacionadas(artigoId: string): Promise<KbArtigo[]> {
  const { data, error } = await supabase
    .from("kb_artigo_faqs_relacionadas")
    .select("ordem, kb_artigos:artigo_relacionado_id ( * )")
    .eq("artigo_id", artigoId)
    .order("ordem", { ascending: true })
  if (error) throw error
  return (data as unknown as { kb_artigos: KbArtigo }[]).map((r) => r.kb_artigos)
}

export async function adicionarFaqRelacionada(artigoId: string, artigoRelacionadoId: string) {
  const { error } = await supabase
    .from("kb_artigo_faqs_relacionadas")
    .insert({ artigo_id: artigoId, artigo_relacionado_id: artigoRelacionadoId })
  if (error) throw error
}

export async function removerFaqRelacionada(artigoId: string, artigoRelacionadoId: string) {
  const { error } = await supabase
    .from("kb_artigo_faqs_relacionadas")
    .delete()
    .eq("artigo_id", artigoId)
    .eq("artigo_relacionado_id", artigoRelacionadoId)
  if (error) throw error
}

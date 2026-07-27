import { supabase } from "@/lib/supabase"
import type { KbAssociacaoProduto } from "@/types/kbAssociacaoProduto"

export async function fetchAssociacoes(artigoId: string): Promise<KbAssociacaoProduto[]> {
  const { data, error } = await supabase
    .from("kb_associacoes_produto")
    .select("*, toners ( marca, modelo, referencia )")
    .eq("artigo_id", artigoId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return data as unknown as KbAssociacaoProduto[]
}

export async function associarToner(artigoId: string, tonerId: string) {
  const { data, error } = await supabase
    .from("kb_associacoes_produto")
    .insert({ artigo_id: artigoId, toner_id: tonerId })
    .select()
    .single()
  if (error) throw error
  return data as KbAssociacaoProduto
}

export async function associarFamilia(
  artigoId: string,
  params: { marca: string; modelo?: string | null }
) {
  const { data, error } = await supabase
    .from("kb_associacoes_produto")
    .insert({ artigo_id: artigoId, marca: params.marca, modelo: params.modelo ?? null })
    .select()
    .single()
  if (error) throw error
  return data as KbAssociacaoProduto
}

export async function removerAssociacao(id: string) {
  const { error } = await supabase.from("kb_associacoes_produto").delete().eq("id", id)
  if (error) throw error
}

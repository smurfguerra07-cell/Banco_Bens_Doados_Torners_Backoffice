import { supabase } from "@/lib/supabase"

export interface KbPerguntaSemResposta {
  id: string
  pergunta: string
  categoria_detectada: string | null
  melhor_score: number | null
  resolvida: boolean
  resolvida_por: string | null
  resolvida_em: string | null
  artigo_criado_id: string | null
  created_at: string
  profiles: { full_name: string } | null
}

export async function fetchPerguntasSemResposta(): Promise<KbPerguntaSemResposta[]> {
  const { data, error } = await supabase
    .from("aura_perguntas_sem_resposta")
    .select("*, profiles!aura_perguntas_sem_resposta_profile_id_fkey ( full_name )")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as unknown as KbPerguntaSemResposta[]
}

export async function marcarResolvida(id: string, resolvidaPorId: string, artigoCriadoId?: string) {
  const { error } = await supabase
    .from("aura_perguntas_sem_resposta")
    .update({
      resolvida: true,
      resolvida_por: resolvidaPorId,
      resolvida_em: new Date().toISOString(),
      artigo_criado_id: artigoCriadoId ?? null,
    })
    .eq("id", id)
  if (error) throw error
}

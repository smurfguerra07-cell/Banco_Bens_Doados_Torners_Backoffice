import { supabase } from "@/lib/supabase"

export interface KbEstatisticas {
  totalPerguntas: number
  resolvidasAuto: number
  escaladas: number
  taxaAutoResolucao: number
  perguntasSemResposta: number
  tempoMedioRespostaSegundos: number | null
  artigosMaisConsultados: { artigoId: string; titulo: string; consultas: number }[]
  categoriasMaisUsadas: { categoria: string; total: number }[]
}

/**
 * Todas as métricas são agregadas ao vivo sobre o histórico de
 * conversas (sem tabela de contadores a manter sincronizada) — mesmo
 * raciocínio de "impacto ambiental" em backoffice/src/lib/aura/conversar.ts,
 * que também é calculado ao vivo a partir de `pedidos`.
 */
export async function fetchEstatisticas(): Promise<KbEstatisticas> {
  const [conversasRes, mensagensRes, semRespostaRes] = await Promise.all([
    supabase.from("aura_conversas").select("id, estado, categoria_detectada"),
    supabase
      .from("aura_mensagens")
      .select("id, conversa_id, autor, artigo_id, created_at, kb_artigos ( titulo )")
      .order("created_at", { ascending: true }),
    supabase.from("aura_perguntas_sem_resposta").select("id, resolvida").eq("resolvida", false),
  ])

  if (conversasRes.error) throw conversasRes.error
  if (mensagensRes.error) throw mensagensRes.error
  if (semRespostaRes.error) throw semRespostaRes.error

  const conversas = conversasRes.data
  const mensagens = mensagensRes.data as unknown as {
    id: string
    conversa_id: string
    autor: "utilizador" | "aura"
    artigo_id: string | null
    created_at: string
    kb_artigos: { titulo: string } | null
  }[]

  const totalPerguntas = mensagens.filter((m) => m.autor === "utilizador").length
  const resolvidasAuto = conversas.filter((c) => c.estado === "resolvida_auto").length
  const escaladas = conversas.filter((c) => c.estado === "escalada").length
  const taxaAutoResolucao =
    resolvidasAuto + escaladas === 0 ? 0 : resolvidasAuto / (resolvidasAuto + escaladas)

  const consultasPorArtigo = new Map<string, { titulo: string; consultas: number }>()
  for (const m of mensagens) {
    if (m.autor !== "aura" || !m.artigo_id) continue
    const atual = consultasPorArtigo.get(m.artigo_id)
    const titulo = m.kb_artigos?.titulo ?? "(artigo removido)"
    consultasPorArtigo.set(m.artigo_id, { titulo, consultas: (atual?.consultas ?? 0) + 1 })
  }
  const artigosMaisConsultados = [...consultasPorArtigo.entries()]
    .map(([artigoId, v]) => ({ artigoId, ...v }))
    .sort((a, b) => b.consultas - a.consultas)
    .slice(0, 8)

  const categoriasCount = new Map<string, number>()
  for (const c of conversas) {
    if (!c.categoria_detectada) continue
    categoriasCount.set(c.categoria_detectada, (categoriasCount.get(c.categoria_detectada) ?? 0) + 1)
  }
  const categoriasMaisUsadas = [...categoriasCount.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total)

  // Tempo médio de resposta: por conversa, a diferença entre a primeira
  // mensagem do utilizador e a primeira resposta da Aura a seguir.
  const porConversa = new Map<string, typeof mensagens>()
  for (const m of mensagens) {
    const lista = porConversa.get(m.conversa_id) ?? []
    lista.push(m)
    porConversa.set(m.conversa_id, lista)
  }
  const duracoes: number[] = []
  for (const lista of porConversa.values()) {
    const primeiraUtilizador = lista.find((m) => m.autor === "utilizador")
    if (!primeiraUtilizador) continue
    const primeiraAuraDepois = lista.find(
      (m) => m.autor === "aura" && m.created_at >= primeiraUtilizador.created_at
    )
    if (!primeiraAuraDepois) continue
    const diffMs =
      new Date(primeiraAuraDepois.created_at).getTime() - new Date(primeiraUtilizador.created_at).getTime()
    if (diffMs >= 0) duracoes.push(diffMs / 1000)
  }
  const tempoMedioRespostaSegundos =
    duracoes.length === 0 ? null : duracoes.reduce((s, d) => s + d, 0) / duracoes.length

  return {
    totalPerguntas,
    resolvidasAuto,
    escaladas,
    taxaAutoResolucao,
    perguntasSemResposta: semRespostaRes.data.length,
    tempoMedioRespostaSegundos,
    artigosMaisConsultados,
    categoriasMaisUsadas,
  }
}

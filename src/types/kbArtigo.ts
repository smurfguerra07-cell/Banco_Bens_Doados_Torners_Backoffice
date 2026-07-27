export type KbCategoria =
  | "instalacao"
  | "problemas"
  | "pedidos"
  | "entregas"
  | "devolucoes"
  | "doacoes"
  | "conta"
  | "plataforma"
  | "faq"

export const KB_CATEGORIA_LABEL: Record<KbCategoria, string> = {
  instalacao: "Instalação de Toners",
  problemas: "Problemas com Toners",
  pedidos: "Estado do Pedido",
  entregas: "Entregas",
  devolucoes: "Devoluções",
  doacoes: "Doações",
  conta: "Conta do Utilizador",
  plataforma: "Como Funciona a Plataforma",
  faq: "FAQ",
}

export type KbEstado = "publicado" | "rascunho" | "arquivado"

export const KB_ESTADO_LABEL: Record<KbEstado, string> = {
  publicado: "Publicado",
  rascunho: "Rascunho",
  arquivado: "Arquivado",
}

export interface KbArtigo {
  id: string
  titulo: string
  subtitulo: string | null
  categoria: KbCategoria
  resumo: string | null
  conteudo: string
  palavras_chave: string[]
  sinonimos: string[]
  prioridade: number
  estado: KbEstado
  autor_id: string | null
  created_at: string
  updated_at: string
}

export interface KbArtigoInput {
  titulo: string
  subtitulo: string | null
  categoria: KbCategoria
  resumo: string | null
  conteudo: string
  palavras_chave: string[]
  sinonimos: string[]
  prioridade: number
  estado: KbEstado
}

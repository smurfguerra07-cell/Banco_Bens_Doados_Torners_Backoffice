export type KbAnexoTipo = "video_youtube" | "pdf" | "imagem" | "documento" | "link"

export const KB_ANEXO_TIPO_LABEL: Record<KbAnexoTipo, string> = {
  video_youtube: "Vídeo do YouTube",
  pdf: "PDF",
  imagem: "Imagem",
  documento: "Documento",
  link: "Link",
}

export interface KbAnexo {
  id: string
  artigo_id: string
  tipo: KbAnexoTipo
  titulo: string | null
  url: string | null
  storage_path: string | null
  ordem: number
  created_at: string
}

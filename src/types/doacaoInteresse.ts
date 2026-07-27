export type DoacaoInteresseTipo = "empresa" | "pessoal"
export type DoacaoInteresseEstado = "novo" | "contactado" | "concluido"

export const DOACAO_INTERESSE_ESTADO_LABEL: Record<DoacaoInteresseEstado, string> = {
  novo: "Novo",
  contactado: "Contactado",
  concluido: "Concluído",
}

export interface DoacaoInteresse {
  id: string
  tipo: DoacaoInteresseTipo
  nome: string
  nome_empresa: string | null
  email: string
  telefone: string
  mensagem: string | null
  anexo_url: string | null
  anexo_nome: string | null
  estado: DoacaoInteresseEstado
  created_at: string
}

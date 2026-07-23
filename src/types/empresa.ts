export type EmpresaTipo = "doadora" | "beneficiaria" | "ambas"

export interface Empresa {
  id: string
  nome: string
  nif: string | null
  tipo: EmpresaTipo
  morada: string | null
  codigo_postal: string | null
  cidade: string | null
  telefone: string | null
  email: string | null
  website: string | null
  ativo: boolean
  created_at: string
}

export const EMPRESA_TIPO_LABEL: Record<EmpresaTipo, string> = {
  doadora: "Doadora",
  beneficiaria: "Beneficiária",
  ambas: "Doadora e beneficiária",
}

export interface EmpresaInput {
  nome: string
  nif: string | null
  tipo: EmpresaTipo
  morada: string | null
  codigo_postal: string | null
  cidade: string | null
  telefone: string | null
  email: string | null
  website: string | null
  ativo: boolean
}

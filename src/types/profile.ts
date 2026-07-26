export type UserRole = "administrador" | "gestor" | "operador" | "leitor" | "cliente"

export interface Profile {
  id: string
  empresa_id: string | null
  role: UserRole
  full_name: string
  telefone: string | null
  avatar_url: string | null
  ativo: boolean
  tema: "claro" | "escuro"
  deve_alterar_password: boolean
}

export const STAFF_ROLES: UserRole[] = ["administrador", "gestor", "operador", "leitor"]

export const ROLE_LABEL: Record<UserRole, string> = {
  administrador: "Administrador",
  gestor: "Gestor",
  operador: "Operador",
  leitor: "Leitor",
  cliente: "Cliente",
}

// ---------- Permissões por cargo ----------
// Administrador: acesso total. Gestor: tudo menos gerir utilizadores.
// Operador e Leitor: também sem acesso a Utilizadores, Tickets,
// Instituições e Relatórios (só Dashboard, Inventário e Pedidos).

const CARGOS_GESTAO: UserRole[] = ["administrador", "gestor"]

export function podeVerUtilizadores(role: UserRole | undefined): boolean {
  return role === "administrador"
}

export function podeVerTickets(role: UserRole | undefined): boolean {
  return Boolean(role && CARGOS_GESTAO.includes(role))
}

export function podeVerInstituicoes(role: UserRole | undefined): boolean {
  return Boolean(role && CARGOS_GESTAO.includes(role))
}

export function podeVerRelatorios(role: UserRole | undefined): boolean {
  return Boolean(role && CARGOS_GESTAO.includes(role))
}

export interface UtilizadorInput {
  full_name: string
  telefone: string | null
  role: UserRole
  ativo: boolean
}

export interface CriarUtilizadorInput {
  email: string
  password: string
  full_name: string
  telefone: string | null
  role: UserRole
  deve_alterar_password: boolean
}

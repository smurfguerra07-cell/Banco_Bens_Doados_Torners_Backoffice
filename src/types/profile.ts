export type UserRole = "administrador" | "gestor" | "operador" | "leitor" | "cliente"

export interface Profile {
  id: string
  empresa_id: string | null
  role: UserRole
  full_name: string
  telefone: string | null
  avatar_url: string | null
}

export const STAFF_ROLES: UserRole[] = ["administrador", "gestor", "operador", "leitor"]

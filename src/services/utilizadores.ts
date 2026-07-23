import { supabase } from "@/lib/supabase"
import { STAFF_ROLES, type Profile, type UtilizadorInput } from "@/types/profile"

export async function fetchUtilizadores(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", STAFF_ROLES)
    .order("full_name", { ascending: true })
  if (error) throw error
  return data as Profile[]
}

/**
 * Cria o perfil de staff para um utilizador que já tem login criado no
 * Supabase Authentication (Dashboard → Authentication → Users). Não é
 * possível criar a conta de login diretamente daqui — precisa da chave
 * de administrador, que nunca deve estar no frontend.
 */
export async function criarPerfilUtilizador(
  authUserId: string,
  input: UtilizadorInput
) {
  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: authUserId, ...input })
    .select()
    .single()
  if (error) throw error
  return data as Profile
}

export async function atualizarUtilizador(id: string, input: UtilizadorInput) {
  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as Profile
}

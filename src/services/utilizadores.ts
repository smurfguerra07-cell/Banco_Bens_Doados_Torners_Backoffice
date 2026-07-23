import { supabase } from "@/lib/supabase"
import {
  STAFF_ROLES,
  type CriarUtilizadorInput,
  type Profile,
  type UtilizadorInput,
} from "@/types/profile"

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
 * Cria o login (email + password, sem confirmação por email) e o
 * perfil de staff numa só chamada, via Edge Function (usa a chave de
 * administrador do lado do servidor — nunca no browser).
 */
export async function criarUtilizador(input: CriarUtilizadorInput) {
  const { data, error } = await supabase.functions.invoke("criar-utilizador", {
    body: input,
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data as { id: string }
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

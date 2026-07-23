import { supabase } from "@/lib/supabase"

export async function atualizarDadosPessoais(
  userId: string,
  input: { full_name: string; telefone: string | null }
) {
  const { error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", userId)
  if (error) throw error
}

export async function atualizarTema(userId: string, tema: "claro" | "escuro") {
  const { error } = await supabase.from("profiles").update({ tema }).eq("id", userId)
  if (error) throw error
}

export async function alterarPassword(novaPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: novaPassword })
  if (error) throw error
}

export async function concluirTrocaObrigatoriaPassword(
  userId: string,
  novaPassword: string
) {
  await alterarPassword(novaPassword)
  const { error } = await supabase
    .from("profiles")
    .update({ deve_alterar_password: false })
    .eq("id", userId)
  if (error) throw error
}

import { supabase } from "@/lib/supabase"
import type { Empresa, EmpresaInput } from "@/types/empresa"

export async function fetchEmpresas(): Promise<Empresa[]> {
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .order("nome", { ascending: true })
  if (error) throw error
  return data as Empresa[]
}

export async function createEmpresa(input: EmpresaInput) {
  const { data, error } = await supabase
    .from("empresas")
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as Empresa
}

export async function updateEmpresa(id: string, input: EmpresaInput) {
  const { data, error } = await supabase
    .from("empresas")
    .update(input)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as Empresa
}

export async function toggleEmpresaAtivo(id: string, ativo: boolean) {
  const { error } = await supabase.from("empresas").update({ ativo }).eq("id", id)
  if (error) throw error
}

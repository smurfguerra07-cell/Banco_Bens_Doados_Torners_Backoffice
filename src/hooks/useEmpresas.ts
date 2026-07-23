import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import {
  createEmpresa,
  fetchEmpresas,
  toggleEmpresaAtivo,
  updateEmpresa,
} from "@/services/empresas"
import type { EmpresaInput } from "@/types/empresa"

export function useEmpresas() {
  return useQuery({
    queryKey: ["admin-empresas"],
    queryFn: fetchEmpresas,
  })
}

export function useEmpresaMutations() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-empresas"] })

  const guardar = useMutation({
    mutationFn: ({ id, input }: { id?: string; input: EmpresaInput }) =>
      id ? updateEmpresa(id, input) : createEmpresa(input),
    onSuccess: (_data, variables) => {
      invalidate()
      toast.success(variables.id ? "Empresa atualizada." : "Empresa criada.")
    },
    onError: (err) => toast.error(err.message),
  })

  const alternarAtivo = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      toggleEmpresaAtivo(id, ativo),
    onSuccess: () => {
      invalidate()
      toast.success("Estado atualizado.")
    },
    onError: (err) => toast.error(err.message),
  })

  return { guardar, alternarAtivo }
}

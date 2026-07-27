import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { associarFamilia, associarToner, fetchAssociacoes, removerAssociacao } from "@/services/kbAssociacoes"

export function useAssociacoes(artigoId: string | undefined) {
  return useQuery({
    queryKey: ["kb-associacoes", artigoId],
    queryFn: () => fetchAssociacoes(artigoId as string),
    enabled: Boolean(artigoId),
  })
}

export function useKbAssociacaoMutations(artigoId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["kb-associacoes", artigoId] })

  const adicionarToner = useMutation({
    mutationFn: (tonerId: string) => associarToner(artigoId as string, tonerId),
    onSuccess: () => {
      invalidate()
      toast.success("Produto associado.")
    },
    onError: (err) => toast.error(err.message),
  })

  const adicionarFamilia = useMutation({
    mutationFn: (params: { marca: string; modelo?: string | null }) =>
      associarFamilia(artigoId as string, params),
    onSuccess: () => {
      invalidate()
      toast.success("Família associada.")
    },
    onError: (err) => toast.error(err.message),
  })

  const remover = useMutation({
    mutationFn: (id: string) => removerAssociacao(id),
    onSuccess: () => {
      invalidate()
      toast.success("Associação removida.")
    },
    onError: (err) => toast.error(err.message),
  })

  return { adicionarToner, adicionarFamilia, remover }
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import {
  atualizarUtilizador,
  criarPerfilUtilizador,
  fetchUtilizadores,
} from "@/services/utilizadores"
import type { UtilizadorInput } from "@/types/profile"

export function useUtilizadores() {
  return useQuery({
    queryKey: ["admin-utilizadores"],
    queryFn: fetchUtilizadores,
  })
}

export function useUtilizadorMutations() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-utilizadores"] })

  const criar = useMutation({
    mutationFn: ({ uid, input }: { uid: string; input: UtilizadorInput }) =>
      criarPerfilUtilizador(uid, input),
    onSuccess: () => {
      invalidate()
      toast.success("Utilizador adicionado.")
    },
    onError: (err) => toast.error(err.message),
  })

  const atualizar = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UtilizadorInput }) =>
      atualizarUtilizador(id, input),
    onSuccess: () => {
      invalidate()
      toast.success("Utilizador atualizado.")
    },
    onError: (err) => toast.error(err.message),
  })

  return { criar, atualizar }
}

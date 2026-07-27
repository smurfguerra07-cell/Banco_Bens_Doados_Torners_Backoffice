import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { atualizarEstadoDoacaoInteresse, fetchDoacoesInteresse } from "@/services/doacoesInteresse"
import type { DoacaoInteresseEstado } from "@/types/doacaoInteresse"

export function useDoacoesInteresse() {
  return useQuery({
    queryKey: ["doacoes-interesse"],
    queryFn: fetchDoacoesInteresse,
  })
}

export function useAtualizarEstadoDoacaoInteresse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: DoacaoInteresseEstado }) =>
      atualizarEstadoDoacaoInteresse(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doacoes-interesse"] })
      toast.success("Estado atualizado.")
    },
    onError: (err) => toast.error(err.message),
  })
}

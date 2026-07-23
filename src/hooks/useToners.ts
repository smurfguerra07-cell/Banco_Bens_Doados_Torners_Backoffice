import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import {
  deleteToner,
  fetchToners,
  guardarToner,
  toggleTonerAtivo,
} from "@/services/toners"
import type { TonerInput } from "@/types/toner"

export function useToners() {
  return useQuery({
    queryKey: ["admin-toners"],
    queryFn: fetchToners,
  })
}

export function useTonerMutations() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-toners"] })

  const guardar = useMutation({
    mutationFn: (params: { id?: string; input: TonerInput; imagem?: File | null }) =>
      guardarToner(params),
    onSuccess: (_data, variables) => {
      invalidate()
      toast.success(variables.id ? "Toner atualizado." : "Toner criado.")
    },
    onError: (err) => toast.error(err.message),
  })

  const alternarAtivo = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      toggleTonerAtivo(id, ativo),
    onSuccess: () => {
      invalidate()
      toast.success("Estado atualizado.")
    },
    onError: (err) => toast.error(err.message),
  })

  const eliminar = useMutation({
    mutationFn: (id: string) => deleteToner(id),
    onSuccess: () => {
      invalidate()
      toast.success("Toner eliminado.")
    },
    onError: () =>
      toast.error(
        "Não foi possível eliminar — provavelmente já tem pedidos associados. Desativa-o em vez disso."
      ),
  })

  return { guardar, alternarAtivo, eliminar }
}

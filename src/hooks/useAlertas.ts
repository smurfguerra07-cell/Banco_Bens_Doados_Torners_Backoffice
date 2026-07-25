import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { criarAlerta, fetchAlertas, removerAlerta } from "@/services/alertas"

export function useAlertas() {
  return useQuery({
    queryKey: ["aura-alertas"],
    queryFn: fetchAlertas,
  })
}

export function useRemoverAlerta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removerAlerta(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["aura-alertas"] }),
  })
}

export function useCriarAlerta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { tonerId: string; limite: number; criadoPor: string }) => criarAlerta(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["aura-alertas"] }),
  })
}

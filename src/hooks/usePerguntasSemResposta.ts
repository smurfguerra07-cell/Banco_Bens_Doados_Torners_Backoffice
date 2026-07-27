import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { fetchPerguntasSemResposta, marcarResolvida } from "@/services/kbPerguntasSemResposta"

export function usePerguntasSemResposta() {
  return useQuery({
    queryKey: ["kb-perguntas-sem-resposta"],
    queryFn: fetchPerguntasSemResposta,
  })
}

export function useMarcarResolvida() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, resolvidaPorId, artigoCriadoId }: { id: string; resolvidaPorId: string; artigoCriadoId?: string }) =>
      marcarResolvida(id, resolvidaPorId, artigoCriadoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-perguntas-sem-resposta"] })
      toast.success("Marcada como resolvida.")
    },
    onError: (err) => toast.error(err.message),
  })
}

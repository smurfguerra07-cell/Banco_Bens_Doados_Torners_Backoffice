import { useQuery } from "@tanstack/react-query"
import { fetchMovimentosDoacao, fetchMovimentosToner } from "@/services/movimentos"

export function useMovimentosToner(tonerId: string | undefined) {
  return useQuery({
    queryKey: ["movimentos-toner", tonerId],
    queryFn: () => fetchMovimentosToner(tonerId as string),
    enabled: Boolean(tonerId),
  })
}

export function useMovimentosDoacao() {
  return useQuery({
    queryKey: ["movimentos-doacao"],
    queryFn: fetchMovimentosDoacao,
  })
}

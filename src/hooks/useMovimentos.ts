import { useQuery } from "@tanstack/react-query"
import { fetchMovimentosToner } from "@/services/movimentos"

export function useMovimentosToner(tonerId: string | undefined) {
  return useQuery({
    queryKey: ["movimentos-toner", tonerId],
    queryFn: () => fetchMovimentosToner(tonerId as string),
    enabled: Boolean(tonerId),
  })
}

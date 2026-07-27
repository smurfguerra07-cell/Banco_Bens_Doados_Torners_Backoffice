import { useQuery } from "@tanstack/react-query"
import { fetchEstatisticas } from "@/services/kbEstatisticas"

export function useKbEstatisticas() {
  return useQuery({
    queryKey: ["kb-estatisticas"],
    queryFn: fetchEstatisticas,
  })
}

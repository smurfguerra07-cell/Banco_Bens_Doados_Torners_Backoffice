import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import {
  adicionarFaqRelacionada,
  arquivarArtigo,
  criarArtigo,
  duplicarArtigo,
  fetchArtigoById,
  fetchArtigos,
  fetchFaqsRelacionadas,
  publicarArtigo,
  removerFaqRelacionada,
  atualizarArtigo,
} from "@/services/kbArtigos"
import type { KbArtigo, KbArtigoInput } from "@/types/kbArtigo"

export function useArtigos() {
  return useQuery({
    queryKey: ["kb-artigos"],
    queryFn: fetchArtigos,
  })
}

export function useArtigo(id: string | undefined) {
  return useQuery({
    queryKey: ["kb-artigos", id],
    queryFn: () => fetchArtigoById(id as string),
    enabled: Boolean(id),
  })
}

export function useKbArtigoMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["kb-artigos"] })

  const guardar = useMutation({
    mutationFn: ({ id, input, autorId }: { id?: string; input: KbArtigoInput; autorId: string }) =>
      id ? atualizarArtigo(id, input) : criarArtigo(input, autorId),
    onSuccess: (_data, variables) => {
      invalidate()
      toast.success(variables.id ? "Artigo atualizado." : "Artigo criado.")
    },
    onError: (err) => toast.error(err.message),
  })

  const duplicar = useMutation({
    mutationFn: (artigo: KbArtigo) => duplicarArtigo(artigo),
    onSuccess: () => {
      invalidate()
      toast.success("Artigo duplicado como rascunho.")
    },
    onError: (err) => toast.error(err.message),
  })

  const arquivar = useMutation({
    mutationFn: (id: string) => arquivarArtigo(id),
    onSuccess: () => {
      invalidate()
      toast.success("Artigo arquivado.")
    },
    onError: (err) => toast.error(err.message),
  })

  const publicar = useMutation({
    mutationFn: (id: string) => publicarArtigo(id),
    onSuccess: () => {
      invalidate()
      toast.success("Artigo publicado.")
    },
    onError: (err) => toast.error(err.message),
  })

  return { guardar, duplicar, arquivar, publicar }
}

export function useFaqsRelacionadas(artigoId: string | undefined) {
  return useQuery({
    queryKey: ["kb-faqs-relacionadas", artigoId],
    queryFn: () => fetchFaqsRelacionadas(artigoId as string),
    enabled: Boolean(artigoId),
  })
}

export function useFaqRelacionadaMutations(artigoId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["kb-faqs-relacionadas", artigoId] })

  const adicionar = useMutation({
    mutationFn: (artigoRelacionadoId: string) => adicionarFaqRelacionada(artigoId as string, artigoRelacionadoId),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(err.message),
  })

  const remover = useMutation({
    mutationFn: (artigoRelacionadoId: string) => removerFaqRelacionada(artigoId as string, artigoRelacionadoId),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(err.message),
  })

  return { adicionar, remover }
}

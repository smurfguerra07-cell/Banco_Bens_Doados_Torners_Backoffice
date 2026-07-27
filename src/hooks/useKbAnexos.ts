import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import {
  adicionarAnexoLink,
  fetchAnexos,
  removerAnexo,
  reordenarAnexos,
  uploadAnexoKb,
} from "@/services/kbAnexos"
import type { KbAnexoTipo } from "@/types/kbAnexo"

export function useAnexos(artigoId: string | undefined) {
  return useQuery({
    queryKey: ["kb-anexos", artigoId],
    queryFn: () => fetchAnexos(artigoId as string),
    enabled: Boolean(artigoId),
  })
}

export function useKbAnexoMutations(artigoId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["kb-anexos", artigoId] })

  const upload = useMutation({
    mutationFn: ({ file, tipo, ordem }: { file: File; tipo: KbAnexoTipo; ordem: number }) =>
      uploadAnexoKb(artigoId as string, file, tipo, ordem),
    onSuccess: () => {
      invalidate()
      toast.success("Anexo carregado.")
    },
    onError: (err) => toast.error(err.message),
  })

  const adicionarLink = useMutation({
    mutationFn: (params: { tipo: "video_youtube" | "link"; titulo: string; url: string; ordem: number }) =>
      adicionarAnexoLink(artigoId as string, params),
    onSuccess: () => {
      invalidate()
      toast.success("Anexo adicionado.")
    },
    onError: (err) => toast.error(err.message),
  })

  const remover = useMutation({
    mutationFn: (id: string) => removerAnexo(id),
    onSuccess: () => {
      invalidate()
      toast.success("Anexo removido.")
    },
    onError: (err) => toast.error(err.message),
  })

  const reordenar = useMutation({
    mutationFn: (atualizacoes: { id: string; ordem: number }[]) => reordenarAnexos(atualizacoes),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(err.message),
  })

  return { upload, adicionarLink, remover, reordenar }
}

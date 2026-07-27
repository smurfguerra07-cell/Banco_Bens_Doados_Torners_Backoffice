import { useRef, useState } from "react"
import { ArrowDown, ArrowUp, File, Image, Link2, Trash2, Video } from "lucide-react"
import { useAnexos, useKbAnexoMutations } from "@/hooks/useKbAnexos"
import type { KbAnexoTipo } from "@/types/kbAnexo"

const ICONE: Record<KbAnexoTipo, typeof Video> = {
  video_youtube: Video,
  pdf: File,
  imagem: Image,
  documento: File,
  link: Link2,
}

export function AnexosEditor({ artigoId }: { artigoId: string }) {
  const { data: anexos } = useAnexos(artigoId)
  const { upload, adicionarLink, remover, reordenar } = useKbAnexoMutations(artigoId)
  const [urlTitulo, setUrlTitulo] = useState("")
  const [urlValor, setUrlValor] = useState("")
  const [urlTipo, setUrlTipo] = useState<"video_youtube" | "link">("video_youtube")
  const inputPdfRef = useRef<HTMLInputElement>(null)
  const inputImagemRef = useRef<HTMLInputElement>(null)
  const inputDocRef = useRef<HTMLInputElement>(null)

  const lista = anexos ?? []

  function proximaOrdem() {
    return lista.length === 0 ? 0 : Math.max(...lista.map((a) => a.ordem)) + 1
  }

  function handleUpload(tipo: KbAnexoTipo, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    upload.mutate({ file, tipo, ordem: proximaOrdem() })
    e.target.value = ""
  }

  function handleAdicionarUrl() {
    if (!urlValor.trim()) return
    adicionarLink.mutate(
      { tipo: urlTipo, titulo: urlTitulo.trim() || urlValor.trim(), url: urlValor.trim(), ordem: proximaOrdem() },
      { onSuccess: () => { setUrlTitulo(""); setUrlValor("") } }
    )
  }

  function mover(index: number, direcao: -1 | 1) {
    const alvo = index + direcao
    if (alvo < 0 || alvo >= lista.length) return
    const a = lista[index]
    const b = lista[alvo]
    reordenar.mutate([
      { id: a.id, ordem: b.ordem },
      { id: b.id, ordem: a.ordem },
    ])
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">Anexos</label>

      <div className="space-y-2 rounded-lg border border-border bg-background p-3">
        {lista.length === 0 && (
          <p className="text-sm text-muted-foreground">Sem anexos ainda.</p>
        )}
        {lista.map((anexo, i) => {
          const Icone = ICONE[anexo.tipo]
          return (
            <div
              key={anexo.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
            >
              <Icone className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-sm text-foreground">{anexo.titulo || anexo.url}</span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => mover(i, -1)}
                  disabled={i === 0}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => mover(i, 1)}
                  disabled={i === lista.length - 1}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                >
                  <ArrowDown className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remover.mutate(anexo.id)}
                  className="flex size-7 items-center justify-center rounded-md text-secondary transition hover:bg-secondary/10"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputPdfRef.current?.click()}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
        >
          + PDF
        </button>
        <button
          type="button"
          onClick={() => inputImagemRef.current?.click()}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
        >
          + Imagem
        </button>
        <button
          type="button"
          onClick={() => inputDocRef.current?.click()}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
        >
          + Documento
        </button>
        <input ref={inputPdfRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleUpload("pdf", e)} />
        <input ref={inputImagemRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload("imagem", e)} />
        <input ref={inputDocRef} type="file" className="hidden" onChange={(e) => handleUpload("documento", e)} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-2.5">
        <select
          value={urlTipo}
          onChange={(e) => setUrlTipo(e.target.value as "video_youtube" | "link")}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none"
        >
          <option value="video_youtube">Vídeo do YouTube</option>
          <option value="link">Link</option>
        </select>
        <input
          value={urlTitulo}
          onChange={(e) => setUrlTitulo(e.target.value)}
          placeholder="Título (opcional)"
          className="min-w-32 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none"
        />
        <input
          value={urlValor}
          onChange={(e) => setUrlValor(e.target.value)}
          placeholder="URL"
          className="min-w-40 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none"
        />
        <button
          type="button"
          onClick={handleAdicionarUrl}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
        >
          Adicionar
        </button>
      </div>
    </div>
  )
}

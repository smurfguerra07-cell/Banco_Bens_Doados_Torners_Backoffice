import { useState } from "react"
import { X } from "lucide-react"
import { useArtigos, useFaqRelacionadaMutations, useFaqsRelacionadas } from "@/hooks/useKbArtigos"

export function FaqsRelacionadasPicker({ artigoId }: { artigoId: string }) {
  const { data: artigos } = useArtigos()
  const { data: relacionadas } = useFaqsRelacionadas(artigoId)
  const { adicionar, remover } = useFaqRelacionadaMutations(artigoId)
  const [selecionado, setSelecionado] = useState("")

  const idsRelacionados = new Set((relacionadas ?? []).map((a) => a.id))
  const disponiveis = (artigos ?? []).filter((a) => a.id !== artigoId && !idsRelacionados.has(a.id))

  function handleAdicionar() {
    if (!selecionado) return
    adicionar.mutate(selecionado)
    setSelecionado("")
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">FAQs relacionadas</label>

      <div className="space-y-2 rounded-lg border border-border bg-background p-3">
        {(relacionadas ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Sem FAQs relacionadas.</p>
        )}
        {relacionadas?.map((a) => (
          <div key={a.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <span className="flex-1 truncate text-sm text-foreground">{a.titulo}</span>
            <button
              type="button"
              onClick={() => remover.mutate(a.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-border p-2.5">
        <select
          value={selecionado}
          onChange={(e) => setSelecionado(e.target.value)}
          className="min-w-40 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none"
        >
          <option value="">Escolher artigo...</option>
          {disponiveis.map((a) => (
            <option key={a.id} value={a.id}>
              {a.titulo}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAdicionar}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
        >
          Associar
        </button>
      </div>
    </div>
  )
}

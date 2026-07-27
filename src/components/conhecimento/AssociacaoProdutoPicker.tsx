import { useMemo, useState } from "react"
import { Trash2 } from "lucide-react"
import { useToners } from "@/hooks/useToners"
import { useAssociacoes, useKbAssociacaoMutations } from "@/hooks/useKbAssociacoes"

export function AssociacaoProdutoPicker({ artigoId }: { artigoId: string }) {
  const { data: toners } = useToners()
  const { data: associacoes } = useAssociacoes(artigoId)
  const { adicionarToner, adicionarFamilia, remover } = useKbAssociacaoMutations(artigoId)
  const [modoFamilia, setModoFamilia] = useState(false)
  const [tonerId, setTonerId] = useState("")
  const [marca, setMarca] = useState("")

  const marcas = useMemo(
    () => Array.from(new Set((toners ?? []).map((t) => t.marca))).sort(),
    [toners]
  )

  function handleAdicionar() {
    if (modoFamilia) {
      if (!marca) return
      adicionarFamilia.mutate({ marca })
      setMarca("")
    } else {
      if (!tonerId) return
      adicionarToner.mutate(tonerId)
      setTonerId("")
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        Produtos associados
      </label>

      <div className="space-y-2 rounded-lg border border-border bg-background p-3">
        {(associacoes ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            Sem produtos associados — o artigo não é sugerido automaticamente para nenhum toner específico.
          </p>
        )}
        {associacoes?.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
          >
            <span className="flex-1 truncate text-sm text-foreground">
              {a.toner_id && a.toners
                ? `${a.toners.marca} ${a.toners.modelo} (${a.toners.referencia})`
                : a.modelo
                  ? `Toda a marca ${a.marca} — ${a.modelo}`
                  : `Toda a marca ${a.marca}`}
            </span>
            <button
              type="button"
              onClick={() => remover.mutate(a.id)}
              className="flex size-7 items-center justify-center rounded-md text-secondary transition hover:bg-secondary/10"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-2.5">
        <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
          <button
            type="button"
            onClick={() => setModoFamilia(false)}
            className={`rounded px-2 py-1 text-xs font-medium ${!modoFamilia ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
          >
            SKU exato
          </button>
          <button
            type="button"
            onClick={() => setModoFamilia(true)}
            className={`rounded px-2 py-1 text-xs font-medium ${modoFamilia ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
          >
            Toda a marca
          </button>
        </div>

        {modoFamilia ? (
          <select
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            className="min-w-40 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none"
          >
            <option value="">Escolher marca...</option>
            {marcas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={tonerId}
            onChange={(e) => setTonerId(e.target.value)}
            className="min-w-40 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none"
          >
            <option value="">Escolher toner...</option>
            {toners?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.marca} {t.modelo} ({t.referencia})
              </option>
            ))}
          </select>
        )}

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

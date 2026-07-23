import { useMemo, useState } from "react"
import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useToners, useTonerMutations } from "@/hooks/useToners"
import { TonerFormModal } from "@/components/toners/TonerFormModal"
import { TONER_ESTADO_LABEL, type Toner, type TonerInput } from "@/types/toner"
import { cn } from "@/lib/utils"

export function ToniersPage() {
  const { data: toners, isLoading } = useToners()
  const { guardar, alternarAtivo, eliminar } = useTonerMutations()
  const [pesquisa, setPesquisa] = useState("")
  const [modalAberto, setModalAberto] = useState(false)
  const [tonerEditar, setTonerEditar] = useState<Toner | null>(null)

  const filtrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()
    if (!termo) return toners ?? []
    return (toners ?? []).filter(
      (t) =>
        t.marca.toLowerCase().includes(termo) ||
        t.modelo.toLowerCase().includes(termo) ||
        t.referencia.toLowerCase().includes(termo)
    )
  }, [toners, pesquisa])

  function abrirCriar() {
    setTonerEditar(null)
    setModalAberto(true)
  }

  function abrirEditar(toner: Toner) {
    setTonerEditar(toner)
    setModalAberto(true)
  }

  function handleSubmit(input: TonerInput, imagem: File | null) {
    guardar.mutate(
      { id: tonerEditar?.id, input, imagem },
      { onSuccess: () => setModalAberto(false) }
    )
  }

  function handleEliminar(toner: Toner) {
    if (!confirm(`Eliminar "${toner.marca} ${toner.modelo}"? Esta ação não pode ser desfeita.`))
      return
    eliminar.mutate(toner.id)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Toners</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestão do inventário de toners.
          </p>
        </div>
        <button
          onClick={abrirCriar}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="size-4" />
          Novo toner
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-sm">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar por marca, modelo ou referência..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Toner</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Quantidade</th>
              <th className="px-4 py-3 font-medium">Localização</th>
              <th className="px-4 py-3 font-medium">Visível</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  A carregar...
                </td>
              </tr>
            )}

            {!isLoading && filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Sem toners para mostrar.
                </td>
              </tr>
            )}

            {filtrados.map((toner) => {
              const disponivel = toner.quantidade - toner.quantidade_reservada
              return (
                <tr key={toner.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        {toner.toner_imagens?.[0] ? (
                          <img
                            src={toner.toner_imagens[0].storage_path}
                            alt=""
                            className="size-full rounded-lg object-cover"
                          />
                        ) : (
                          <Package className="size-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {toner.marca} {toner.modelo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ref. {toner.referencia}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {TONER_ESTADO_LABEL[toner.estado]}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {disponivel} / {toner.quantidade}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {toner.localizacao ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        alternarAtivo.mutate({ id: toner.id, ativo: !toner.ativo })
                      }
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium transition",
                        toner.ativo
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      )}
                    >
                      {toner.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => abrirEditar(toner)}
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Editar"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(toner)}
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary/10 hover:text-secondary"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <TonerFormModal
        toner={tonerEditar}
        aberto={modalAberto}
        aGuardar={guardar.isPending}
        onClose={() => setModalAberto(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

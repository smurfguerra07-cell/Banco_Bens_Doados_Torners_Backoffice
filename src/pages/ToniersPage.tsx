import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { FileUp, History, Package, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useToners, useTonerMutations } from "@/hooks/useToners"
import { useAuth } from "@/contexts/AuthContext"
import { TonerFormModal } from "@/components/toners/TonerFormModal"
import { ImportarTonersModal } from "@/components/toners/ImportarTonersModal"
import { HistoricoTonerModal } from "@/components/toners/HistoricoTonerModal"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { TONER_ESTADO_LABEL, type Toner, type TonerInput } from "@/types/toner"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 15

export function ToniersPage() {
  const { data: toners, isLoading } = useToners()
  const { guardar, alternarAtivo, eliminar } = useTonerMutations()
  const { user } = useAuth()
  const [pesquisa, setPesquisa] = useState("")
  const [pagina, setPagina] = useState(1)
  const [modalAberto, setModalAberto] = useState(false)
  const [importarAberto, setImportarAberto] = useState(false)
  const [tonerEditar, setTonerEditar] = useState<Toner | null>(null)
  const [tonerHistorico, setTonerHistorico] = useState<Toner | null>(null)

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

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtrados.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE)

  function handlePesquisa(valor: string) {
    setPesquisa(valor)
    setPagina(1)
  }

  function abrirCriar() {
    setTonerEditar(null)
    setModalAberto(true)
  }

  function abrirEditar(toner: Toner) {
    setTonerEditar(toner)
    setModalAberto(true)
  }

  function handleSubmit(input: TonerInput, imagem: File | null, empresaId: string | null) {
    guardar.mutate(
      { id: tonerEditar?.id, input, imagem, empresaId, profileId: user?.id },
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportarAberto(true)}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <FileUp className="size-4" />
            Importar
          </button>
          <button
            onClick={abrirCriar}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="size-4" />
            Novo toner
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-sm">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={pesquisa}
          onChange={(e) => handlePesquisa(e.target.value)}
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
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-lg" />
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-3.5 w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-3.5 w-12" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-3.5 w-20" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </td>
                </tr>
              ))}

            {!isLoading && filtrados.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={Package}
                    titulo="Sem toners para mostrar"
                    descricao="Cria um novo toner ou importa um ficheiro para começares."
                  />
                </td>
              </tr>
            )}

            {visiveis.map((toner, i) => {
              const disponivel = toner.quantidade - toner.quantidade_reservada
              return (
                <motion.tr
                  key={toner.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.03 }}
                  className="transition-colors hover:bg-muted/30"
                >
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
                        onClick={() => setTonerHistorico(toner)}
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Histórico"
                      >
                        <History className="size-4" />
                      </button>
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
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPagina(n)}
              className={cn(
                "size-8 rounded-lg text-sm font-medium transition",
                n === paginaAtual
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      <TonerFormModal
        toner={tonerEditar}
        aberto={modalAberto}
        aGuardar={guardar.isPending}
        onClose={() => setModalAberto(false)}
        onSubmit={handleSubmit}
      />

      <ImportarTonersModal
        aberto={importarAberto}
        onClose={() => setImportarAberto(false)}
      />

      <HistoricoTonerModal
        toner={tonerHistorico}
        onClose={() => setTonerHistorico(null)}
      />
    </div>
  )
}

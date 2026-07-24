import { AnimatePresence, motion } from "framer-motion"
import { ArrowDownCircle, ArrowUpCircle, Building2, History, User, X } from "lucide-react"
import { useMovimentosToner } from "@/hooks/useMovimentos"
import type { Toner } from "@/types/toner"
import { MOVIMENTO_TIPO_LABEL, type MovimentoStock } from "@/types/movimento"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"
import { cn } from "@/lib/utils"

function origemMovimento(mov: MovimentoStock): string {
  if (mov.empresas?.nome) return mov.empresas.nome
  if (mov.pedidos?.numero) return `Pedido #${mov.pedidos.numero}`
  return mov.motivo ?? "—"
}

export function HistoricoTonerModal({
  toner,
  onClose,
}: {
  toner: Toner | null
  onClose: () => void
}) {
  const { data: movimentos, isLoading } = useMovimentosToner(toner?.id)
  useBodyScrollLock(Boolean(toner))

  return (
    <AnimatePresence>
      {toner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Histórico — {toner.marca} {toner.modelo}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Ref. {toner.referencia}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/70"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoading && (
                <p className="py-10 text-center text-sm text-muted-foreground">A carregar...</p>
              )}

              {!isLoading && (movimentos?.length ?? 0) === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <History className="size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Ainda não há movimentos registados para este toner.
                  </p>
                </div>
              )}

              <ul className="flex flex-col gap-2.5">
                {movimentos?.map((mov) => {
                  const entrada = mov.tipo === "entrada"
                  return (
                    <li
                      key={mov.id}
                      className="flex items-start gap-3 rounded-xl border border-border p-3"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                          entrada
                            ? "bg-primary/10 text-primary"
                            : mov.tipo === "saida"
                              ? "bg-secondary/10 text-secondary"
                              : "bg-amber-500/10 text-amber-600"
                        )}
                      >
                        {entrada ? (
                          <ArrowDownCircle className="size-4" />
                        ) : (
                          <ArrowUpCircle className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {MOVIMENTO_TIPO_LABEL[mov.tipo]}{" "}
                            <span
                              className={cn(entrada ? "text-primary" : "text-secondary")}
                            >
                              {entrada ? "+" : "−"}
                              {mov.quantidade}
                            </span>
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(mov.created_at).toLocaleDateString("pt-PT")}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="size-3.5" />
                            {origemMovimento(mov)}
                          </span>
                          {mov.profiles?.full_name && (
                            <span className="flex items-center gap-1">
                              <User className="size-3.5" />
                              {mov.profiles.full_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

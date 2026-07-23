import { useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Building2, Download, Package, User, X } from "lucide-react"
import toast from "react-hot-toast"
import { useAtualizarEstadoPedido } from "@/hooks/usePedidos"
import {
  PEDIDO_ESTADO_LABEL,
  PROXIMO_ESTADO,
  type Pedido,
  type PedidoEstado,
} from "@/types/pedido"
import { cn } from "@/lib/utils"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"
import { AgendarEntregaModal } from "@/components/pedidos/AgendarEntregaModal"
import { gerarGuiaEntregaPdf } from "@/lib/guiaEntrega"

const ESTADO_BADGE: Record<PedidoEstado, string> = {
  recebido: "bg-muted text-muted-foreground",
  em_analise: "bg-amber-500/10 text-amber-600",
  aprovado: "bg-primary/10 text-primary",
  em_preparacao: "bg-primary/10 text-primary",
  pronto_levantamento: "bg-primary/10 text-primary",
  concluido: "bg-emerald-500/10 text-emerald-600",
  recusado: "bg-secondary/10 text-secondary",
  cancelado: "bg-secondary/10 text-secondary",
}

const AVANCAR_LABEL: Record<PedidoEstado, string> = {
  recebido: "Colocar em análise",
  em_analise: "Aprovar",
  aprovado: "Iniciar preparação",
  em_preparacao: "Marcar pronto p/ levantamento",
  pronto_levantamento: "Marcar concluído",
  concluido: "",
  recusado: "",
  cancelado: "",
}

const ESTADOS_ATIVOS: PedidoEstado[] = [
  "recebido",
  "em_analise",
  "aprovado",
  "em_preparacao",
  "pronto_levantamento",
]

export function PedidoDetailModal({
  pedido,
  onClose,
}: {
  pedido: Pedido | null
  onClose: () => void
}) {
  const atualizarEstado = useAtualizarEstadoPedido()
  const [aAgendar, setAAgendar] = useState(false)
  const [aGerarGuia, setAGerarGuia] = useState(false)
  useBodyScrollLock(Boolean(pedido))

  function avancar() {
    if (!pedido) return
    const proximo = PROXIMO_ESTADO[pedido.estado]
    if (!proximo) return
    if (proximo === "aprovado") {
      setAAgendar(true)
      return
    }
    atualizarEstado.mutate({ id: pedido.id, estado: proximo }, { onSuccess: onClose })
  }

  async function descarregarGuia() {
    if (!pedido?.data_entrega) return
    setAGerarGuia(true)
    try {
      await gerarGuiaEntregaPdf(pedido, pedido.data_entrega)
    } catch {
      toast.error("Não foi possível gerar a guia.")
    } finally {
      setAGerarGuia(false)
    }
  }

  function recusar() {
    if (!pedido) return
    const motivo = prompt("Motivo da recusa (fica visível para a entidade):")
    if (motivo === null) return
    atualizarEstado.mutate(
      { id: pedido.id, estado: "recusado", motivoRecusa: motivo },
      { onSuccess: onClose }
    )
  }

  function cancelar() {
    if (!pedido) return
    if (!confirm("Cancelar este pedido?")) return
    atualizarEstado.mutate({ id: pedido.id, estado: "cancelado" }, { onSuccess: onClose })
  }

  return createPortal(
    <>
    <AnimatePresence>
      {pedido && !aAgendar && (
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
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Pedido #{pedido.numero}
                </h2>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    ESTADO_BADGE[pedido.estado]
                  )}
                >
                  {PEDIDO_ESTADO_LABEL[pedido.estado]}
                </span>
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

            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="size-3.5" />
                  {pedido.empresas?.nome ?? "—"}
                </span>
                <span className="flex items-center gap-1">
                  <User className="size-3.5" />
                  {pedido.profiles?.full_name ?? "—"}
                </span>
                <span>{new Date(pedido.created_at).toLocaleDateString("pt-PT")}</span>
                {pedido.ultima_acao?.full_name && (
                  <span>Última ação por: {pedido.ultima_acao.full_name}</span>
                )}
              </div>

              <ul className="mt-4 flex flex-col gap-1.5 border-t border-border pt-3">
                {pedido.pedido_itens.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm text-foreground">
                    <Package className="size-3.5 text-muted-foreground" />
                    {item.quantidade}× {item.toners?.marca} {item.toners?.modelo}
                    <span className="text-xs text-muted-foreground">
                      (Ref. {item.toners?.referencia})
                    </span>
                  </li>
                ))}
              </ul>

              {pedido.observacoes && (
                <p className="mt-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Observações: </span>
                  {pedido.observacoes}
                </p>
              )}

              {pedido.motivo_recusa && (
                <p className="mt-3 text-sm text-secondary">
                  <span className="font-medium">Motivo da recusa: </span>
                  {pedido.motivo_recusa}
                </p>
              )}
            </div>

            {(pedido.data_entrega || ESTADOS_ATIVOS.includes(pedido.estado)) && (
              <div className="flex flex-wrap gap-2 border-t border-border px-6 py-4">
                {pedido.data_entrega && (
                  <button
                    onClick={descarregarGuia}
                    disabled={aGerarGuia}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
                  >
                    <Download className="size-3.5" />
                    {aGerarGuia ? "A gerar..." : "Guia de entrega"}
                  </button>
                )}
                {ESTADOS_ATIVOS.includes(pedido.estado) && (
                  <button
                    onClick={avancar}
                    disabled={atualizarEstado.isPending}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    {AVANCAR_LABEL[pedido.estado]}
                  </button>
                )}
                {(pedido.estado === "recebido" || pedido.estado === "em_analise") && (
                  <button
                    onClick={recusar}
                    disabled={atualizarEstado.isPending}
                    className="rounded-lg border border-secondary/30 px-3 py-1.5 text-xs font-medium text-secondary transition hover:bg-secondary/10"
                  >
                    Recusar
                  </button>
                )}
                {ESTADOS_ATIVOS.includes(pedido.estado) && (
                  <button
                    onClick={cancelar}
                    disabled={atualizarEstado.isPending}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    <AgendarEntregaModal
      pedido={aAgendar ? pedido : null}
      onClose={() => {
        setAAgendar(false)
        onClose()
      }}
    />
    </>,
    document.body
  )
}

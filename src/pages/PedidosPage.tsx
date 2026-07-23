import { useMemo, useState } from "react"
import { Building2, Package, User } from "lucide-react"
import { usePedidos, useAtualizarEstadoPedido } from "@/hooks/usePedidos"
import {
  PEDIDO_ESTADO_LABEL,
  PROXIMO_ESTADO,
  type Pedido,
  type PedidoEstado,
} from "@/types/pedido"
import { cn } from "@/lib/utils"

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

const ESTADOS_FILTRO: (PedidoEstado | "todos")[] = [
  "todos",
  "recebido",
  "em_analise",
  "aprovado",
  "em_preparacao",
  "pronto_levantamento",
  "concluido",
  "recusado",
  "cancelado",
]

const ESTADOS_ATIVOS: PedidoEstado[] = [
  "recebido",
  "em_analise",
  "aprovado",
  "em_preparacao",
  "pronto_levantamento",
]

export function PedidosPage() {
  const { data: pedidos, isLoading } = usePedidos()
  const atualizarEstado = useAtualizarEstadoPedido()
  const [filtro, setFiltro] = useState<PedidoEstado | "todos">("todos")

  const filtrados = useMemo(() => {
    if (!pedidos) return []
    if (filtro === "todos") return pedidos
    return pedidos.filter((p) => p.estado === filtro)
  }, [pedidos, filtro])

  function avancar(pedido: Pedido) {
    const proximo = PROXIMO_ESTADO[pedido.estado]
    if (!proximo) return
    atualizarEstado.mutate({ id: pedido.id, estado: proximo })
  }

  function recusar(pedido: Pedido) {
    const motivo = prompt("Motivo da recusa (fica visível para a entidade):")
    if (motivo === null) return
    atualizarEstado.mutate({ id: pedido.id, estado: "recusado", motivoRecusa: motivo })
  }

  function cancelar(pedido: Pedido) {
    if (!confirm("Cancelar este pedido?")) return
    atualizarEstado.mutate({ id: pedido.id, estado: "cancelado" })
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Pedidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestão dos pedidos de requisição de toners.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {ESTADOS_FILTRO.map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltro(estado)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              filtro === estado
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {estado === "todos" ? "Todos" : PEDIDO_ESTADO_LABEL[estado]}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {isLoading && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            A carregar...
          </p>
        )}

        {!isLoading && filtrados.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Sem pedidos para este filtro.
          </p>
        )}

        {filtrados.map((pedido) => (
          <div
            key={pedido.id}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">
                    Pedido #{pedido.numero}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      ESTADO_BADGE[pedido.estado]
                    )}
                  >
                    {PEDIDO_ESTADO_LABEL[pedido.estado]}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="size-3.5" />
                    {pedido.empresas?.nome ?? "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="size-3.5" />
                    {pedido.profiles?.full_name ?? "—"}
                  </span>
                  <span>
                    {new Date(pedido.created_at).toLocaleDateString("pt-PT")}
                  </span>
                </div>
              </div>

              {ESTADOS_ATIVOS.includes(pedido.estado) && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => avancar(pedido)}
                    disabled={atualizarEstado.isPending}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    {AVANCAR_LABEL[pedido.estado]}
                  </button>
                  {(pedido.estado === "recebido" || pedido.estado === "em_analise") && (
                    <button
                      onClick={() => recusar(pedido)}
                      disabled={atualizarEstado.isPending}
                      className="rounded-lg border border-secondary/30 px-3 py-1.5 text-xs font-medium text-secondary transition hover:bg-secondary/10"
                    >
                      Recusar
                    </button>
                  )}
                  <button
                    onClick={() => cancelar(pedido)}
                    disabled={atualizarEstado.isPending}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <ul className="mt-4 flex flex-col gap-1.5 border-t border-border pt-3">
              {pedido.pedido_itens.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
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
        ))}
      </div>
    </div>
  )
}

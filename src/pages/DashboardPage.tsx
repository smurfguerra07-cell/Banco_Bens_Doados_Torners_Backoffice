import { useMemo, useState } from "react"
import { Link } from "react-router"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ClipboardCheck, ClipboardList, Package, PackageX } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToners } from "@/hooks/useToners"
import { usePedidos } from "@/hooks/usePedidos"
import { PEDIDO_ESTADO_LABEL, type Pedido, type PedidoEstado } from "@/types/pedido"
import { Bar3D } from "@/components/dashboard/Bar3D"
import { PedidoDetailModal } from "@/components/pedidos/PedidoDetailModal"
import { cn } from "@/lib/utils"

const LIMITE_STOCK_BAIXO = 3

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

const ESTADO_COR: Record<PedidoEstado, string> = {
  recebido: "#94a3b8",
  em_analise: "#f59e0b",
  aprovado: "#1e4b8f",
  em_preparacao: "#6366f1",
  pronto_levantamento: "#06b6d4",
  concluido: "#10b981",
  recusado: "#c8102e",
  cancelado: "#64748b",
}

const ESTADOS_GRAFICO: PedidoEstado[] = [
  "recebido",
  "em_analise",
  "aprovado",
  "em_preparacao",
  "pronto_levantamento",
  "concluido",
  "recusado",
  "cancelado",
]

export function DashboardPage() {
  const { profile } = useAuth()
  const { data: toners } = useToners()
  const { data: pedidos } = usePedidos()
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null)

  const pedidosPendentes =
    pedidos?.filter((p) => p.estado === "recebido" || p.estado === "em_analise")
      .length ?? 0
  const pedidosAprovados =
    pedidos?.filter((p) =>
      ["aprovado", "em_preparacao", "pronto_levantamento"].includes(p.estado)
    ).length ?? 0
  const stockBaixo =
    toners?.filter(
      (t) => t.ativo && t.quantidade - t.quantidade_reservada <= LIMITE_STOCK_BAIXO
    ).length ?? 0
  const totalToners = toners?.filter((t) => t.ativo).length ?? 0

  const cartoes = [
    {
      titulo: "Pedidos pendentes",
      valor: pedidosPendentes,
      to: "/pedidos",
      icon: ClipboardList,
      cor: "text-amber-600 bg-amber-500/10",
    },
    {
      titulo: "Stock baixo",
      valor: stockBaixo,
      to: "/toners",
      icon: PackageX,
      cor: "text-secondary bg-secondary/10",
    },
    {
      titulo: "Toners ativos",
      valor: totalToners,
      to: "/toners",
      icon: Package,
      cor: "text-primary bg-primary/10",
    },
    {
      titulo: "Pedidos em curso",
      valor: pedidosAprovados,
      to: "/pedidos",
      icon: ClipboardCheck,
      cor: "text-emerald-600 bg-emerald-500/10",
    },
  ]

  const dadosGrafico = useMemo(() => {
    return ESTADOS_GRAFICO.map((estado) => ({
      estado: PEDIDO_ESTADO_LABEL[estado],
      total: pedidos?.filter((p) => p.estado === estado).length ?? 0,
      cor: ESTADO_COR[estado],
    })).filter((d) => d.total > 0)
  }, [pedidos])

  const ultimosPedidos = useMemo(() => (pedidos ?? []).slice(0, 6), [pedidos])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">
        Olá{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Resumo geral da plataforma.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cartoes.map((c) => (
          <Link
            key={c.titulo}
            to={c.to}
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className={cn("flex size-10 items-center justify-center rounded-lg", c.cor)}>
              <c.icon className="size-5" />
            </span>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {c.titulo}
            </p>
            <p className="mt-1 text-3xl font-semibold text-foreground">
              {c.valor}
            </p>
          </Link>
        ))}
      </div>

      {pedidosPendentes > 0 && (
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-sm">
          <p className="text-sm font-medium text-foreground">
            Tens {pedidosPendentes} pedido(s) à espera de análise.
          </p>
          <Link
            to="/pedidos"
            className="mt-1 inline-block text-sm font-medium text-primary"
          >
            Ver pedidos →
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">
            Pedidos por estado
          </h2>
          <div className="mt-4 h-72">
            {dadosGrafico.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Ainda não há pedidos suficientes para mostrar.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico} margin={{ top: 16, right: 16, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="estado" fontSize={11} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)" }}
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: "var(--color-border)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="total" shape={Bar3D} maxBarSize={44}>
                    {dadosGrafico.map((d) => (
                      <Cell key={d.estado} fill={d.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Últimos pedidos
            </h2>
            <Link to="/pedidos" className="text-xs font-medium text-primary">
              Ver todos →
            </Link>
          </div>

          <div className="mt-2 flex flex-col divide-y divide-border">
            {ultimosPedidos.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">
                Ainda não há pedidos.
              </p>
            )}
            {ultimosPedidos.map((pedido) => (
              <button
                key={pedido.id}
                onClick={() => setPedidoSelecionado(pedido)}
                className="flex items-center justify-between rounded-lg py-3 text-left transition hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Package className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Pedido #{pedido.numero} — {pedido.empresas?.nome ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(pedido.created_at).toLocaleDateString("pt-PT")} ·{" "}
                      {pedido.profiles?.full_name ?? "—"}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    ESTADO_BADGE[pedido.estado]
                  )}
                >
                  {PEDIDO_ESTADO_LABEL[pedido.estado]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <PedidoDetailModal
        pedido={pedidoSelecionado}
        onClose={() => setPedidoSelecionado(null)}
      />
    </div>
  )
}

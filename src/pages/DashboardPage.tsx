import { useMemo } from "react"
import { Link } from "react-router"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Package } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToners } from "@/hooks/useToners"
import { usePedidos } from "@/hooks/usePedidos"
import { PEDIDO_ESTADO_LABEL, type PedidoEstado } from "@/types/pedido"
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
    { titulo: "Pedidos pendentes", valor: pedidosPendentes, to: "/pedidos" },
    { titulo: "Stock baixo", valor: stockBaixo, to: "/toners" },
    { titulo: "Toners ativos", valor: totalToners, to: "/toners" },
    { titulo: "Pedidos em curso", valor: pedidosAprovados, to: "/pedidos" },
  ]

  const dadosGrafico = useMemo(() => {
    return ESTADOS_GRAFICO.map((estado) => ({
      estado: PEDIDO_ESTADO_LABEL[estado],
      total: pedidos?.filter((p) => p.estado === estado).length ?? 0,
    })).filter((d) => d.total > 0)
  }, [pedidos])

  const ultimosPedidos = useMemo(() => (pedidos ?? []).slice(0, 6), [pedidos])

  const maisRequisitados = useMemo(() => {
    const contagem = new Map<
      string,
      { marca: string; modelo: string; total: number }
    >()
    for (const pedido of pedidos ?? []) {
      for (const item of pedido.pedido_itens) {
        if (!item.toners) continue
        const chave = item.toner_id
        const atual = contagem.get(chave)
        if (atual) {
          atual.total += item.quantidade
        } else {
          contagem.set(chave, {
            marca: item.toners.marca,
            modelo: item.toners.modelo,
            total: item.quantidade,
          })
        }
      }
    }
    return Array.from(contagem.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [pedidos])

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
            className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {c.titulo}
            </p>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {c.valor}
            </p>
          </Link>
        ))}
      </div>

      {pedidosPendentes > 0 && (
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
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
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">
            Pedidos por estado
          </h2>
          <div className="mt-4 h-64">
            {dadosGrafico.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Ainda não há pedidos suficientes para mostrar.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="estado"
                    width={110}
                    fontSize={12}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)" }}
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: "var(--color-border)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="total" fill="var(--color-primary)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">
            Produtos mais requisitados
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {maisRequisitados.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ainda não há pedidos.
              </p>
            )}
            {maisRequisitados.map((item, i) => {
              const max = maisRequisitados[0]?.total || 1
              return (
                <div key={`${item.marca}-${item.modelo}-${i}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">
                      {item.marca} {item.modelo}
                    </span>
                    <span className="font-medium text-muted-foreground">
                      {item.total}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${(item.total / max) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Últimos pedidos
          </h2>
          <Link to="/pedidos" className="text-xs font-medium text-primary">
            Ver todos →
          </Link>
        </div>

        <div className="mt-4 flex flex-col divide-y divide-border">
          {ultimosPedidos.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">
              Ainda não há pedidos.
            </p>
          )}
          {ultimosPedidos.map((pedido) => (
            <div key={pedido.id} className="flex items-center justify-between py-3">
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
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

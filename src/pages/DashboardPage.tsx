import { Link } from "react-router"
import { useAuth } from "@/contexts/AuthContext"
import { useToners } from "@/hooks/useToners"
import { usePedidos } from "@/hooks/usePedidos"

const LIMITE_STOCK_BAIXO = 3

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
        <div className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="text-sm font-medium text-foreground">
            Tens {pedidosPendentes} pedido(s) à espera de análise.
          </p>
          <Link
            to="/pedidos"
            className="mt-2 inline-block text-sm font-medium text-primary"
          >
            Ver pedidos →
          </Link>
        </div>
      )}
    </div>
  )
}

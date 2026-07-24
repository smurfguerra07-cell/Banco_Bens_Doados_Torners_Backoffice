import { useMemo, useState } from "react"
import { Link } from "react-router"
import { ArrowUpRight, MoreHorizontal, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToners } from "@/hooks/useToners"
import { usePedidos } from "@/hooks/usePedidos"
import { PEDIDO_ESTADO_LABEL, type Pedido, type PedidoEstado } from "@/types/pedido"
import { TONER_ESTADO_LABEL } from "@/types/toner"
import { PedidoDetailModal } from "@/components/pedidos/PedidoDetailModal"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"
import { exportarCsv } from "@/lib/export"
import { cn } from "@/lib/utils"

const LIMITE_STOCK_BAIXO = 3
const FATOR_CO2_KG_POR_TONER = 2.5

const URGENCIA_ESTILO: Record<PedidoEstado, string> = {
  recebido: "bg-secondary/8 text-secondary border-secondary/15",
  em_analise: "bg-amber-100/60 text-amber-700 border-amber-200/60",
  aprovado: "bg-emerald-100/50 text-emerald-700 border-emerald-200/60",
  em_preparacao: "bg-emerald-100/50 text-emerald-700 border-emerald-200/60",
  pronto_levantamento: "bg-emerald-100/50 text-emerald-700 border-emerald-200/60",
  concluido: "bg-primary/5 text-primary/60 border-primary/10",
  recusado: "bg-muted text-muted-foreground border-border",
  cancelado: "bg-muted text-muted-foreground border-border",
}

function tempoRelativo(dataIso: string): string {
  const diffMs = Date.now() - new Date(dataIso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "agora"
  if (diffMin < 60) return `há ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `há ${diffH} h`
  const diffD = Math.floor(diffH / 24)
  return `há ${diffD} dia${diffD > 1 ? "s" : ""}`
}

function saudacao(): string {
  const hora = new Date().getHours()
  if (hora < 12) return "Bom dia"
  if (hora < 20) return "Boa tarde"
  return "Boa noite"
}

export function DashboardPage() {
  const { profile } = useAuth()
  const { data: toners } = useToners()
  const { data: pedidos } = usePedidos()
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null)

  const tonersAtivos = useMemo(() => toners?.filter((t) => t.ativo) ?? [], [toners])
  const tonersEmAlerta = useMemo(
    () => tonersAtivos.filter((t) => t.quantidade - t.quantidade_reservada <= LIMITE_STOCK_BAIXO),
    [tonersAtivos]
  )
  const stockDisponivel = tonersAtivos.reduce(
    (soma, t) => soma + (t.quantidade - t.quantidade_reservada),
    0
  )

  const { pedidosHoje, deltaPedidos } = useMemo(() => {
    const inicioHoje = new Date()
    inicioHoje.setHours(0, 0, 0, 0)
    const inicioOntem = new Date(inicioHoje)
    inicioOntem.setDate(inicioOntem.getDate() - 1)

    const hoje = (pedidos ?? []).filter((p) => new Date(p.created_at) >= inicioHoje).length
    const ontem = (pedidos ?? []).filter((p) => {
      const d = new Date(p.created_at)
      return d >= inicioOntem && d < inicioHoje
    }).length

    return {
      pedidosHoje: hoje,
      deltaPedidos: ontem > 0 ? Math.round(((hoje - ontem) / ontem) * 100) : null,
    }
  }, [pedidos])

  const novosDesdeOntem = useMemo(() => {
    const inicioOntem = new Date()
    inicioOntem.setDate(inicioOntem.getDate() - 1)
    inicioOntem.setHours(0, 0, 0, 0)
    return (pedidos ?? []).filter((p) => new Date(p.created_at) >= inicioOntem).length
  }, [pedidos])

  const impacto = useMemo(() => {
    const concluidos = pedidos?.filter((p) => p.estado === "concluido") ?? []
    const tonersReutilizados = concluidos.reduce(
      (soma, p) => soma + p.pedido_itens.reduce((s, i) => s + i.quantidade, 0),
      0
    )
    const entidadesApoiadas = new Set(concluidos.map((p) => p.empresa_id)).size
    const co2Kg = tonersReutilizados * FATOR_CO2_KG_POR_TONER
    return { tonersReutilizados, entidadesApoiadas, co2Kg }
  }, [pedidos])

  const impactoMensal = useMemo(() => {
    const agora = new Date()
    return Array.from({ length: 6 }, (_, idx) => {
      const i = 5 - idx
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
      const total = (pedidos ?? [])
        .filter((p) => p.estado === "concluido")
        .filter((p) => {
          const ref = new Date(p.concluido_em ?? p.created_at)
          return ref.getFullYear() === d.getFullYear() && ref.getMonth() === d.getMonth()
        })
        .reduce((soma, p) => soma + p.pedido_itens.reduce((s, item) => s + item.quantidade, 0), 0)
      return {
        label: d.toLocaleDateString("pt-PT", { month: "short" }).replace(".", ""),
        valorKg: total * FATOR_CO2_KG_POR_TONER,
      }
    })
  }, [pedidos])

  const maiorImpactoMensal = Math.max(1, ...impactoMensal.map((m) => m.valorKg))

  const inventarioLista = useMemo(
    () => [...tonersAtivos].sort((a, b) => a.quantidade - b.quantidade).slice(0, 6),
    [tonersAtivos]
  )

  const pedidosRecentes = useMemo(() => (pedidos ?? []).slice(0, 4), [pedidos])

  const tonerCritico = tonersEmAlerta[0]

  function handleExportarInventario() {
    exportarCsv(
      tonersAtivos,
      [
        { chave: "marca", titulo: "Marca" },
        { chave: "modelo", titulo: "Modelo" },
        { chave: "referencia", titulo: "Referência" },
        { chave: "quantidade", titulo: "Quantidade" },
        { chave: "cor", titulo: "Cor" },
      ],
      "inventario-toners"
    )
  }

  const dataFormatada = new Date().toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-10">
      <section className="animate-slide-up">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {dataFormatada}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {saudacao()}
          {profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground/80">
          {novosDesdeOntem > 0 ? (
            <>
              Desde ontem chegaram{" "}
              <span className="font-medium text-foreground">
                {novosDesdeOntem} novo(s) pedido(s)
              </span>
              .
            </>
          ) : (
            "Sem pedidos novos desde ontem."
          )}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="animate-slide-up rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)] transition-all hover:-translate-y-0.5 hover:shadow-lg">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Toners em stock
          </p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="tabular text-4xl font-semibold tracking-tight text-foreground">
              <AnimatedNumber value={stockDisponivel} />
            </span>
          </div>
          <div className="mt-4 flex gap-1">
            <div className="h-1 w-10 rounded-full bg-primary" />
            <div className="h-1 w-6 rounded-full bg-primary/15" />
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground/80">
            {tonersEmAlerta.length} modelo(s) em alerta
          </p>
        </div>

        <div
          className="animate-slide-up rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
          style={{ animationDelay: "60ms" }}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Pedidos hoje
          </p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="tabular text-4xl font-semibold tracking-tight text-foreground">
              <AnimatedNumber value={pedidosHoje} />
            </span>
            {deltaPedidos !== null && (
              <span
                className={cn(
                  "ml-1 text-xs font-semibold",
                  deltaPedidos >= 0 ? "text-emerald-600" : "text-secondary"
                )}
              >
                {deltaPedidos >= 0 ? "+" : ""}
                {deltaPedidos}%
              </span>
            )}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground/80">vs ontem</p>
        </div>

        <div
          className="animate-slide-up rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
          style={{ animationDelay: "120ms" }}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            CO₂ evitado
          </p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="tabular text-4xl font-semibold tracking-tight text-foreground">
              <AnimatedNumber
                value={impacto.co2Kg >= 1000 ? impacto.co2Kg / 1000 : impacto.co2Kg}
                formatar={(n) => n.toFixed(1)}
              />
            </span>
            <span className="text-xl font-medium text-muted-foreground/70">
              {impacto.co2Kg >= 1000 ? "t" : "kg"}
            </span>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground/80">Desde sempre</p>
        </div>

        <div
          className="animate-slide-up rounded-3xl bg-gradient-to-br from-secondary to-secondary/85 p-6 text-secondary-foreground shadow-[var(--shadow-red-glow)] transition-transform hover:-translate-y-0.5"
          style={{ animationDelay: "180ms" }}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/70">
            Alertas críticos
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tabular text-4xl font-semibold tracking-tight">
              {String(tonersEmAlerta.length).padStart(2, "0")}
            </span>
          </div>
          <p className="mt-4 text-xs text-white/85">
            {tonersEmAlerta.length > 0
              ? `Stock crítico · ${tonersEmAlerta
                  .slice(0, 3)
                  .map((t) => t.marca)
                  .join(", ")}`
              : "Sem toners em stock crítico."}
          </p>
          <Link to="/toners" className="group mt-4 inline-flex items-center gap-1 text-xs font-medium">
            Ver urgências
            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {tonerCritico && (
        <section
          className="animate-slide-up relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]"
          style={{ animationDelay: "240ms" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-secondary/[0.03]" />
          <div className="relative flex items-start gap-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-[var(--shadow-elegant)]">
              <Sparkles className="size-5 text-secondary" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Aura sugere</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  agora
                </span>
              </div>
              <p className="leading-relaxed text-foreground/80">
                O stock de <span className="font-semibold">{tonerCritico.marca} {tonerCritico.modelo}</span>{" "}
                baixou para{" "}
                <span className="font-semibold">
                  {tonerCritico.quantidade - tonerCritico.quantidade_reservada}
                </span>{" "}
                unidades
                {pedidosHoje > 0 && (
                  <>
                    {" "}
                    e há <span className="font-semibold">{pedidosHoje} pedido(s)</span> a chegar hoje
                  </>
                )}
                . Talvez valha a pena repor stock em breve.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/toners"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Ver inventário
                </Link>
                <Link
                  to="/pedidos"
                  className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary/5"
                >
                  Ver pedidos
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="animate-slide-up xl:col-span-2" style={{ animationDelay: "300ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Inventário</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tonersAtivos.length} modelo(s) ativos
              </p>
            </div>
            <button
              onClick={handleExportarInventario}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary/5"
            >
              Exportar CSV
            </button>
          </div>
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elegant)]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-primary/[0.02]">
                  <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    Modelo
                  </th>
                  <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    Cor
                  </th>
                  <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    Stock
                  </th>
                  <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    Estado
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventarioLista.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      Sem toners ativos.
                    </td>
                  </tr>
                )}
                {inventarioLista.map((toner) => {
                  const disponivel = toner.quantidade - toner.quantidade_reservada
                  const baixo = disponivel <= LIMITE_STOCK_BAIXO
                  return (
                    <tr key={toner.id} className="group transition-colors hover:bg-primary/[0.015]">
                      <td className="px-5 py-4 font-mono text-sm font-medium text-foreground">
                        {toner.marca} {toner.modelo}
                      </td>
                      <td className="px-5 py-4 text-sm text-foreground">
                        {toner.cor ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "font-mono text-sm font-medium",
                            baixo ? "text-secondary" : "text-foreground"
                          )}
                        >
                          {String(disponivel).padStart(3, "0")}
                        </span>
                        {baixo && (
                          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                            baixo
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {TONER_ESTADO_LABEL[toner.estado]}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to="/toners"
                          className="text-muted-foreground/50 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                        >
                          <MoreHorizontal className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "360ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Pedidos</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Mais recentes</p>
            </div>
            <Link to="/pedidos" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Ver todos
            </Link>
          </div>
          <div className="space-y-2.5">
            {pedidosRecentes.length === 0 && (
              <p className="rounded-2xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
                Ainda não há pedidos.
              </p>
            )}
            {pedidosRecentes.map((pedido) => {
              const iniciais =
                pedido.empresas?.nome
                  ?.split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase())
                  .join("") || "—"
              const primeiroItem = pedido.pedido_itens[0]
              const detalhe = primeiroItem
                ? `${pedido.pedido_itens.length}× ${primeiroItem.toners?.marca ?? ""} ${primeiroItem.toners?.modelo ?? ""}`
                : "Sem itens"
              return (
                <button
                  key={pedido.id}
                  onClick={() => setPedidoSelecionado(pedido)}
                  className="group w-full cursor-pointer rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/15 hover:shadow-[var(--shadow-elegant)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 font-mono text-[11px] font-semibold text-primary/60">
                      {iniciais}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold leading-tight text-foreground">
                          {pedido.empresas?.nome ?? "—"}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            URGENCIA_ESTILO[pedido.estado]
                          )}
                        >
                          {PEDIDO_ESTADO_LABEL[pedido.estado]}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{detalhe}</p>
                      <p className="mt-2 font-mono text-[10px] text-muted-foreground/60">
                        {tempoRelativo(pedido.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section
        className="animate-slide-up rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]"
        style={{ animationDelay: "420ms" }}
      >
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Impacto acumulado
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="size-2 rounded-sm bg-primary" />
            <span className="text-muted-foreground">CO₂ evitado (kg)</span>
          </div>
        </div>
        <div className="flex h-40 items-end gap-3">
          {impactoMensal.map((mes) => (
            <div key={mes.label} className="group flex flex-1 flex-col items-center justify-end gap-2">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/60 transition-colors group-hover:from-secondary group-hover:to-secondary/70"
                style={{ height: `${Math.max(4, (mes.valorKg / maiorImpactoMensal) * 152)}px` }}
              />
              <span className="font-mono text-[10px] capitalize text-muted-foreground/70">
                {mes.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-6 border-t border-border pt-6">
          <div>
            <p className="tabular text-2xl font-semibold tracking-tight text-foreground">
              <AnimatedNumber value={impacto.tonersReutilizados} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Toners reutilizados</p>
          </div>
          <div>
            <p className="tabular text-2xl font-semibold tracking-tight text-foreground">
              <AnimatedNumber value={impacto.entidadesApoiadas} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Instituições apoiadas</p>
          </div>
          <div>
            <p className="tabular text-2xl font-semibold tracking-tight text-secondary">
              -
              <AnimatedNumber
                value={impacto.co2Kg / 1000}
                formatar={(n) => n.toFixed(1)}
              />{" "}
              t
            </p>
            <p className="mt-1 text-xs text-muted-foreground">CO₂ equivalente</p>
          </div>
        </div>
      </section>

      <PedidoDetailModal pedido={pedidoSelecionado} onClose={() => setPedidoSelecionado(null)} />
    </div>
  )
}

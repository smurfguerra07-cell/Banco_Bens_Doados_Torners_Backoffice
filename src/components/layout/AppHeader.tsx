import { useState } from "react"
import { Link } from "react-router"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, BellRing, ClipboardList, MessageCircle, Package } from "lucide-react"
import { useToners } from "@/hooks/useToners"
import { usePedidos } from "@/hooks/usePedidos"
import { useTickets } from "@/hooks/useTickets"
import { useAlertas } from "@/hooks/useAlertas"
import { useAuth } from "@/contexts/AuthContext"
import { podeVerTickets } from "@/types/profile"
import { AuraAssistantPanel, AuraCommandBar } from "@/components/layout/AuraAssistant"

const LIMITE_STOCK_BAIXO = 3

export function AppHeader() {
  const { profile } = useAuth()
  const { data: toners } = useToners()
  const { data: pedidos } = usePedidos()
  const { data: tickets } = useTickets()
  const { data: alertas } = useAlertas()
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [notifAberta, setNotifAberta] = useState(false)

  const podeVerTicketsFlag = podeVerTickets(profile?.role)

  const pedidosPendentes =
    pedidos?.filter((p) => p.estado === "recebido" || p.estado === "em_analise") ?? []
  const stockBaixo =
    toners?.filter(
      (t) => t.ativo && t.quantidade - t.quantidade_reservada <= LIMITE_STOCK_BAIXO
    ) ?? []
  const ticketsPorResponder = podeVerTicketsFlag
    ? (tickets?.filter((t) => t.estado === "aberto") ?? [])
    : []
  const alertasDisparados = (alertas ?? []).filter((a) => {
    const toner = toners?.find((t) => t.id === a.toner_id)
    return toner && toner.quantidade - toner.quantidade_reservada <= a.limite
  })
  const totalNotificacoes =
    pedidosPendentes.length + stockBaixo.length + ticketsPorResponder.length + alertasDisparados.length

  return (
    <>
      <header className="flex h-20 shrink-0 items-center gap-4 border-b border-border px-6">
        <AuraCommandBar onOpen={() => setAssistantOpen(true)} />

        <div className="relative ml-auto">
          <button
            onClick={() => setNotifAberta((v) => !v)}
            className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/5"
            aria-label="Notificações"
          >
            <Bell className="size-[18px]" strokeWidth={1.75} />
            {totalNotificacoes > 0 && (
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-secondary" />
            )}
          </button>

          <AnimatePresence>
            {notifAberta && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifAberta(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card py-1.5 shadow-xl"
                >
                  <p className="px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Notificações
                  </p>
                  {totalNotificacoes === 0 && (
                    <p className="px-4 py-4 text-sm text-muted-foreground">
                      Tudo em dia — sem novidades.
                    </p>
                  )}
                  {pedidosPendentes.length > 0 && (
                    <Link
                      to="/pedidos"
                      onClick={() => setNotifAberta(false)}
                      className="flex items-start gap-2.5 px-4 py-2.5 text-sm transition hover:bg-muted"
                    >
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                        <ClipboardList className="size-3.5" />
                      </span>
                      <span>
                        <span className="font-medium text-foreground">
                          {pedidosPendentes.length} pedido(s) por analisar
                        </span>
                        <br />
                        <span className="text-xs text-muted-foreground">
                          Precisam de aprovação ou análise
                        </span>
                      </span>
                    </Link>
                  )}
                  {stockBaixo.length > 0 && (
                    <Link
                      to="/toners"
                      onClick={() => setNotifAberta(false)}
                      className="flex items-start gap-2.5 px-4 py-2.5 text-sm transition hover:bg-muted"
                    >
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                        <Package className="size-3.5" />
                      </span>
                      <span>
                        <span className="font-medium text-foreground">
                          {stockBaixo.length} toner(s) com stock baixo
                        </span>
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {LIMITE_STOCK_BAIXO} unidades ou menos disponíveis
                        </span>
                      </span>
                    </Link>
                  )}
                  {ticketsPorResponder.length > 0 && (
                    <Link
                      to="/tickets"
                      onClick={() => setNotifAberta(false)}
                      className="flex items-start gap-2.5 px-4 py-2.5 text-sm transition hover:bg-muted"
                    >
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MessageCircle className="size-3.5" />
                      </span>
                      <span>
                        <span className="font-medium text-foreground">
                          {ticketsPorResponder.length} ticket(s) por responder
                        </span>
                        <br />
                        <span className="text-xs text-muted-foreground">
                          À espera de resposta da equipa
                        </span>
                      </span>
                    </Link>
                  )}
                  {alertasDisparados.length > 0 && (
                    <Link
                      to="/toners"
                      onClick={() => setNotifAberta(false)}
                      className="flex items-start gap-2.5 px-4 py-2.5 text-sm transition hover:bg-muted"
                    >
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                        <BellRing className="size-3.5" />
                      </span>
                      <span>
                        <span className="font-medium text-foreground">
                          {alertasDisparados.length} alerta(s) da Aura ativo(s)
                        </span>
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {alertasDisparados
                            .map((a) => (a.toners ? `${a.toners.marca} ${a.toners.modelo}` : "toner"))
                            .join(", ")}
                        </span>
                      </span>
                    </Link>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      <AuraAssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </>
  )
}

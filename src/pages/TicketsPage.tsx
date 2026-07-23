import { useMemo, useState } from "react"
import { MessageCircle, Search, User } from "lucide-react"
import { useTickets } from "@/hooks/useTickets"
import { TicketChatModal } from "@/components/tickets/TicketChatModal"
import {
  TICKET_CATEGORIA_LABEL,
  TICKET_ESTADO_LABEL,
  type Ticket,
  type TicketEstado,
} from "@/types/ticket"
import { cn } from "@/lib/utils"

const ESTADO_BADGE: Record<TicketEstado, string> = {
  aberto: "bg-primary/10 text-primary",
  em_espera: "bg-amber-500/10 text-amber-600",
  fechado: "bg-muted text-muted-foreground",
}

const ESTADOS_FILTRO: (TicketEstado | "todos")[] = ["todos", "aberto", "em_espera", "fechado"]

export function TicketsPage() {
  const { data: tickets, isLoading } = useTickets()
  const [filtro, setFiltro] = useState<TicketEstado | "todos">("todos")
  const [pesquisa, setPesquisa] = useState("")
  const [ticketAberto, setTicketAberto] = useState<Ticket | null>(null)

  const filtrados = useMemo(() => {
    if (!tickets) return []
    const termo = pesquisa.trim().toLowerCase().replace(/^#/, "")

    return tickets.filter((t) => {
      if (filtro !== "todos" && t.estado !== filtro) return false
      if (!termo) return true

      return (
        String(t.numero).includes(termo) ||
        t.assunto.toLowerCase().includes(termo) ||
        t.profiles?.full_name?.toLowerCase().includes(termo)
      )
    })
  }, [tickets, filtro, pesquisa])

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Tickets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pedidos de apoio submetidos pelos clientes.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm sm:max-w-sm">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar por nº, assunto ou cliente..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
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
            {estado === "todos" ? "Todos" : TICKET_ESTADO_LABEL[estado]}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {isLoading && (
          <p className="py-10 text-center text-sm text-muted-foreground">A carregar...</p>
        )}

        {!isLoading && filtrados.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Sem tickets para este filtro.
          </p>
        )}

        {filtrados.map((ticket) => (
          <button
            key={ticket.id}
            onClick={() => setTicketAberto(ticket)}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 text-left shadow-sm transition hover:bg-muted/40"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <MessageCircle className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  #{ticket.numero} — {ticket.assunto}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="size-3.5" />
                    {ticket.profiles?.full_name ?? "—"}
                  </span>
                  <span>{TICKET_CATEGORIA_LABEL[ticket.categoria]}</span>
                  <span>{new Date(ticket.updated_at).toLocaleDateString("pt-PT")}</span>
                </div>
              </div>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                ESTADO_BADGE[ticket.estado]
              )}
            >
              {TICKET_ESTADO_LABEL[ticket.estado]}
            </span>
          </button>
        ))}
      </div>

      <TicketChatModal ticket={ticketAberto} onClose={() => setTicketAberto(null)} />
    </div>
  )
}

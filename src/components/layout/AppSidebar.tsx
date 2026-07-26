import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import toast from "react-hot-toast"
import { AnimatePresence, motion } from "framer-motion"
import {
  Building2,
  FileBarChart,
  Inbox,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Package,
  Settings,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { useToners } from "@/hooks/useToners"
import { usePedidos } from "@/hooks/usePedidos"
import { useTickets } from "@/hooks/useTickets"
import { podeVerInstituicoes, podeVerRelatorios, podeVerTickets, podeVerUtilizadores } from "@/types/profile"
import logo from "@/assets/logo.png"

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { data: toners } = useToners()
  const { data: pedidos } = usePedidos()
  const { data: tickets } = useTickets()
  const [menuAberto, setMenuAberto] = useState(false)

  const tonersAtivos = toners?.filter((t) => t.ativo).length ?? 0
  const pedidosPendentes =
    pedidos?.filter((p) => p.estado === "recebido" || p.estado === "em_analise").length ?? 0
  const ticketsPorResponder = tickets?.filter((t) => t.estado === "aberto").length ?? 0

  const NAV = [
    { to: "/", icon: LayoutGrid, label: "Dashboard" },
    { to: "/toners", icon: Package, label: "Inventário", count: tonersAtivos },
    { to: "/pedidos", icon: Inbox, label: "Pedidos", badge: pedidosPendentes },
    podeVerTickets(profile?.role) && {
      to: "/tickets",
      icon: LifeBuoy,
      label: "Tickets",
      badge: ticketsPorResponder,
    },
    podeVerInstituicoes(profile?.role) && { to: "/empresas", icon: Building2, label: "Instituições" },
    podeVerUtilizadores(profile?.role) && { to: "/utilizadores", icon: Users, label: "Utilizadores" },
    podeVerRelatorios(profile?.role) && { to: "/relatorios", icon: FileBarChart, label: "Relatórios" },
  ].filter((item): item is Exclude<typeof item, false> => Boolean(item))

  const iniciais =
    profile?.full_name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"

  async function handleSair() {
    setMenuAberto(false)
    await signOut()
    toast.success("Sessão terminada.")
    navigate("/login")
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
      <Link to="/" className="flex h-20 items-center gap-2 border-b border-border px-5">
        <img src={logo} alt="Banco de Bens Doados" className="h-14 w-auto" />
      </Link>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV.map((item) => {
          const ativo = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2 transition-all",
                ativo
                  ? "bg-primary/5 font-medium text-primary"
                  : "text-foreground/55 hover:bg-primary/[0.03] hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={ativo ? 2.25 : 1.75} />
              <span className="flex-1 truncate text-sm">{item.label}</span>
              {"badge" in item && Boolean(item.badge) && (
                <span className="relative inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-semibold text-secondary-foreground">
                  {item.badge}
                </span>
              )}
              {"count" in item && Boolean(item.count) && (
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {item.count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          to="/definicoes"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-foreground/55 transition-colors hover:bg-primary/[0.03] hover:text-foreground"
        >
          <Settings className="size-4" strokeWidth={1.75} />
          <span className="text-sm">Definições</span>
        </Link>

        <div className="relative mt-1">
          <button
            onClick={() => setMenuAberto((v) => !v)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-primary/[0.03]"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 font-mono text-[10px] font-semibold text-primary-foreground ring-2 ring-card">
              {iniciais}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-xs font-semibold text-foreground">
                {profile?.full_name ?? "Conta"}
              </p>
              <p className="truncate text-[10px] text-muted-foreground capitalize">
                {profile?.role}
              </p>
            </div>
          </button>

          <AnimatePresence>
            {menuAberto && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 z-20 mb-2 w-full overflow-hidden rounded-xl border border-border bg-card py-1.5 shadow-xl"
                >
                  <button
                    onClick={handleSair}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-secondary transition hover:bg-secondary/10"
                  >
                    <LogOut className="size-4" />
                    Sair
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  )
}

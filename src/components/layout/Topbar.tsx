import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import toast from "react-hot-toast"
import { AnimatePresence, motion } from "framer-motion"
import {
  Bell,
  Building2,
  ChevronDown,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { useToners } from "@/hooks/useToners"
import { usePedidos } from "@/hooks/usePedidos"
import logo from "@/assets/logo.png"

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/toners", label: "Toners", icon: Package },
  { to: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/utilizadores", label: "Utilizadores", icon: Users },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart },
]

const LIMITE_STOCK_BAIXO = 3

export function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { data: toners } = useToners()
  const { data: pedidos } = usePedidos()
  const [menuAberto, setMenuAberto] = useState(false)
  const [notifAberta, setNotifAberta] = useState(false)

  const pedidosPendentes =
    pedidos?.filter((p) => p.estado === "recebido" || p.estado === "em_analise") ?? []
  const stockBaixo =
    toners?.filter(
      (t) => t.ativo && t.quantidade - t.quantidade_reservada <= LIMITE_STOCK_BAIXO
    ) ?? []
  const totalNotificacoes = pedidosPendentes.length + stockBaixo.length

  async function handleSair() {
    setMenuAberto(false)
    await signOut()
    toast.success("Sessão terminada.")
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card shadow-sm">
      <div className="flex items-center gap-6 px-6 py-3">
        <Link to="/" className="flex shrink-0 items-center">
          <img src={logo} alt="Banco de Bens Doados" className="h-9 w-auto" />
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const ativo = location.pathname === item.to
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  ativo && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative">
            <button
              onClick={() => {
                setNotifAberta((v) => !v)
                setMenuAberto(false)
              }}
              className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Notificações"
            >
              <Bell className="size-[18px]" />
              {totalNotificacoes > 0 && (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                  {totalNotificacoes}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifAberta && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setNotifAberta(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card py-1.5 shadow-xl"
                  >
                    <p className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
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
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setMenuAberto((v) => !v)
                setNotifAberta(false)
              }}
              className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted/70"
            >
              {profile?.full_name ?? "Conta"}
              <ChevronDown
                className={cn(
                  "size-3.5 text-muted-foreground transition-transform",
                  menuAberto && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {menuAberto && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuAberto(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card py-1.5 shadow-xl"
                  >
                    <Link
                      to="/definicoes"
                      onClick={() => setMenuAberto(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition hover:bg-muted"
                    >
                      <Settings className="size-4 text-muted-foreground" />
                      Definições
                    </Link>
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
      </div>
    </header>
  )
}

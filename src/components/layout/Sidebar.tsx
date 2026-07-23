import { Link, useLocation } from "react-router"
import {
  Building2,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  Package,
  Settings,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import logo from "@/assets/logo.png"

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, disponivel: true },
  { to: "/toners", label: "Toners", icon: Package, disponivel: true },
  { to: "/pedidos", label: "Pedidos", icon: ClipboardList, disponivel: true },
  { to: "/empresas", label: "Empresas", icon: Building2, disponivel: true },
  { to: "/utilizadores", label: "Utilizadores", icon: Users, disponivel: true },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart, disponivel: true },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center px-5 py-6">
        <img src={logo} alt="Banco de Bens Doados" className="h-12 w-auto" />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const ativo = location.pathname === item.to
          const Icon = item.icon

          if (!item.disponivel) {
            return (
              <span
                key={item.to}
                title="Em breve"
                className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground/40"
              >
                <Icon className="size-4" />
                {item.label}
                <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                  em breve
                </span>
              </span>
            )
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                ativo && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <span
          title="Em breve"
          className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground/40"
        >
          <Settings className="size-4" />
          Definições
        </span>
      </div>
    </aside>
  )
}

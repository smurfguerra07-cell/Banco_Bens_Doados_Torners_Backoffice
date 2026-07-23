import { Navigate, Outlet, useNavigate } from "react-router"
import toast from "react-hot-toast"
import { LogOut, User } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Sidebar } from "@/components/layout/Sidebar"
import { ROLE_LABEL } from "@/types/profile"

export function DashboardLayout() {
  const { user, profile, loading, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSair() {
    await signOut()
    toast.success("Sessão terminada.")
    navigate("/login")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        A carregar...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end border-b border-border bg-card px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm">
              <User className="size-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {profile?.full_name ?? user.email}
              </span>
              <span className="text-xs text-muted-foreground">
                {profile ? ROLE_LABEL[profile.role] : ""}
              </span>
            </div>
            <button
              onClick={handleSair}
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary/10 hover:text-secondary"
              aria-label="Terminar sessão"
            >
              <LogOut className="size-[18px]" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

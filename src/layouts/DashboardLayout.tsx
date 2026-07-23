import { Navigate, Outlet } from "react-router"
import { useAuth } from "@/contexts/AuthContext"
import { Topbar } from "@/components/layout/Topbar"
import { TrocarPasswordObrigatoria } from "@/components/conta/TrocarPasswordObrigatoria"

export function DashboardLayout() {
  const { user, profile, loading } = useAuth()

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

  if (profile?.deve_alterar_password) {
    return <TrocarPasswordObrigatoria />
  }

  return (
    <div className="min-h-screen bg-muted/60">
      <Topbar />
      <main className="mx-auto max-w-7xl p-6">
        <Outlet />
      </main>
    </div>
  )
}

import { Navigate, Outlet } from "react-router"
import { useAuth } from "@/contexts/AuthContext"
import { Topbar } from "@/components/layout/Topbar"

export function DashboardLayout() {
  const { user, loading } = useAuth()

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
    <div className="min-h-screen bg-muted/60">
      <Topbar />
      <main className="mx-auto max-w-7xl p-6">
        <Outlet />
      </main>
    </div>
  )
}

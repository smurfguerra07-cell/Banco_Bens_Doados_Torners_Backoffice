import { Navigate, Outlet, useLocation } from "react-router"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Topbar } from "@/components/layout/Topbar"
import { TrocarPasswordObrigatoria } from "@/components/conta/TrocarPasswordObrigatoria"

export function DashboardLayout() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

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
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

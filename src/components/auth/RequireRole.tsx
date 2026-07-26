import type { ReactNode } from "react"
import { Navigate } from "react-router"
import { useAuth } from "@/contexts/AuthContext"
import type { UserRole } from "@/types/profile"

/**
 * Bloqueia o acesso a uma rota consoante o cargo do utilizador — usado
 * como defesa a sério (não só esconder o link no menu), já que a
 * navegação direta pelo URL contornaria uma simples ocultação visual.
 */
export function RequireRole({
  permitido,
  children,
}: {
  permitido: (role: UserRole | undefined) => boolean
  children: ReactNode
}) {
  const { profile } = useAuth()
  if (!permitido(profile?.role)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

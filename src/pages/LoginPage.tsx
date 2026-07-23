import { type FormEvent, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { motion } from "framer-motion"
import toast from "react-hot-toast"
import { Lock, Mail } from "lucide-react"
import logo from "@/assets/logo.png"
import { useAuth } from "@/contexts/AuthContext"

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const destino = (location.state as { from?: string } | null)?.from ?? "/"

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      navigate(destino, { replace: true })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível iniciar sessão."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <img src={logo} alt="Banco de Bens Doados" className="h-24 w-auto" />
          <h1 className="mt-2 text-xl font-semibold text-foreground">
            BackOffice
          </h1>
          <p className="text-sm text-muted-foreground">
            Banco de Bens Doados — Gestão de Toners
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Email</span>
            <span className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <Mail className="size-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@bancodebensdoados.pt"
                className="w-full bg-transparent text-sm outline-none"
              />
            </span>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">
              Palavra-passe
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <Lock className="size-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm outline-none"
              />
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acesso apenas para utilizadores registados pela administração.
        </p>
      </motion.div>
    </main>
  )
}

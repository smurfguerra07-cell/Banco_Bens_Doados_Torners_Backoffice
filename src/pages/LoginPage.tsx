import { motion } from "framer-motion"
import { Lock, Mail, ShieldCheck } from "lucide-react"

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </span>
          <h1 className="text-xl font-semibold text-foreground">
            BackOffice
          </h1>
          <p className="text-sm text-muted-foreground">
            Banco de Bens Doados — Gestão de Toners
          </p>
        </div>

        <form className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Email</span>
            <span className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <Mail className="size-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="nome@bancodebensdoados.pt"
                className="w-full bg-transparent text-sm outline-none"
                disabled
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
                placeholder="••••••••"
                className="w-full bg-transparent text-sm outline-none"
                disabled
              />
            </span>
          </label>

          <button
            type="button"
            disabled
            className="mt-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground opacity-60"
          >
            Entrar (autenticação real na Fase 3)
          </button>
        </form>
      </motion.div>
    </main>
  )
}

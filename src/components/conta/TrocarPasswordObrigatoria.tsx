import { type FormEvent, useState } from "react"
import toast from "react-hot-toast"
import { KeyRound } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { concluirTrocaObrigatoriaPassword } from "@/services/conta"
import logo from "@/assets/logo.png"

export function TrocarPasswordObrigatoria() {
  const { user, refreshProfile } = useAuth()
  const [password, setPassword] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [aGuardar, setAGuardar] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    if (password !== confirmar) {
      toast.error("As palavras-passe não coincidem.")
      return
    }
    setAGuardar(true)
    try {
      await concluirTrocaObrigatoriaPassword(user.id, password)
      await refreshProfile()
      toast.success("Palavra-passe alterada.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível alterar.")
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src={logo} alt="Banco de Bens Doados" className="h-14 w-auto" />
          <span className="mt-2 flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <KeyRound className="size-6" />
          </span>
          <h1 className="text-lg font-semibold text-foreground">
            Define uma nova palavra-passe
          </h1>
          <p className="text-sm text-muted-foreground">
            Por segurança, tens de trocar a palavra-passe antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Nova palavra-passe</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Confirmar palavra-passe</span>
            <input
              type="password"
              required
              minLength={6}
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={aGuardar}
            className="mt-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {aGuardar ? "A guardar..." : "Guardar e continuar"}
          </button>
        </form>
      </div>
    </div>
  )
}

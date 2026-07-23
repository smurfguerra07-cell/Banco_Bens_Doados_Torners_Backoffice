import { type FormEvent, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Moon, Sun } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { alterarPassword, atualizarDadosPessoais, atualizarTema } from "@/services/conta"
import { cn } from "@/lib/utils"

export function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [aGuardarPerfil, setAGuardarPerfil] = useState(false)

  const [novaPassword, setNovaPassword] = useState("")
  const [aGuardarPassword, setAGuardarPassword] = useState(false)

  useEffect(() => {
    if (profile) {
      setNome(profile.full_name)
      setTelefone(profile.telefone ?? "")
    }
  }, [profile])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", profile?.tema === "escuro")
  }, [profile?.tema])

  async function handleGuardarPerfil(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setAGuardarPerfil(true)
    try {
      await atualizarDadosPessoais(user.id, { full_name: nome, telefone: telefone || null })
      await refreshProfile()
      toast.success("Dados atualizados.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível guardar.")
    } finally {
      setAGuardarPerfil(false)
    }
  }

  async function handleAlterarTema(tema: "claro" | "escuro") {
    if (!user) return
    try {
      await atualizarTema(user.id, tema)
      await refreshProfile()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível guardar.")
    }
  }

  async function handleAlterarPassword(e: FormEvent) {
    e.preventDefault()
    setAGuardarPassword(true)
    try {
      await alterarPassword(novaPassword)
      setNovaPassword("")
      toast.success("Palavra-passe alterada.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível alterar.")
    } finally {
      setAGuardarPassword(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">Definições</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Preferências da tua conta.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Tema</h2>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => handleAlterarTema("claro")}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition",
              profile?.tema !== "escuro"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            <Sun className="size-4" />
            Claro
          </button>
          <button
            onClick={() => handleAlterarTema("escuro")}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition",
              profile?.tema === "escuro"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            <Moon className="size-4" />
            Escuro
          </button>
        </div>
      </div>

      <form
        onSubmit={handleGuardarPerfil}
        className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-foreground">Dados pessoais</h2>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Nome</span>
            <input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Telefone</span>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={aGuardarPerfil}
            className="w-fit rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {aGuardarPerfil ? "A guardar..." : "Guardar"}
          </button>
        </div>
      </form>

      <form
        onSubmit={handleAlterarPassword}
        className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-foreground">Palavra-passe</h2>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Nova palavra-passe</span>
            <input
              type="password"
              required
              minLength={6}
              value={novaPassword}
              onChange={(e) => setNovaPassword(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={aGuardarPassword}
            className="w-fit rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {aGuardarPassword ? "A alterar..." : "Alterar palavra-passe"}
          </button>
        </div>
      </form>
    </div>
  )
}

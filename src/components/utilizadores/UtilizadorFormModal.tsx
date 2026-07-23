import { type FormEvent, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { STAFF_ROLES, ROLE_LABEL, type Profile, type UserRole, type UtilizadorInput } from "@/types/profile"

const VAZIO: UtilizadorInput = {
  full_name: "",
  telefone: "",
  role: "leitor",
  ativo: true,
}

export function UtilizadorFormModal({
  utilizador,
  aberto,
  aGuardar,
  onClose,
  onSubmit,
}: {
  utilizador: Profile | null
  aberto: boolean
  aGuardar: boolean
  onClose: () => void
  onSubmit: (uid: string | null, input: UtilizadorInput) => void
}) {
  const [uid, setUid] = useState("")
  const [form, setForm] = useState<UtilizadorInput>(VAZIO)

  useEffect(() => {
    if (utilizador) {
      setUid(utilizador.id)
      setForm({
        full_name: utilizador.full_name,
        telefone: utilizador.telefone ?? "",
        role: utilizador.role,
        ativo: utilizador.ativo,
      })
    } else {
      setUid("")
      setForm(VAZIO)
    }
  }, [utilizador, aberto])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(utilizador ? null : uid, form)
  }

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/70"
            >
              <X className="size-4" />
            </button>

            <h2 className="text-lg font-semibold text-foreground">
              {utilizador ? "Editar utilizador" : "Novo utilizador"}
            </h2>

            {!utilizador && (
              <p className="mt-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700">
                Cria primeiro o login em <strong>Supabase → Authentication → Users
                → Add user</strong>, copia o UID gerado e cola-o abaixo.
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              {!utilizador && (
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">
                    UID do utilizador (Supabase Auth)
                  </span>
                  <input
                    required
                    value={uid}
                    onChange={(e) => setUid(e.target.value)}
                    placeholder="ex: 868b4d37-7da9-4011-ba8a-433752388d52"
                    className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none"
                  />
                </label>
              )}

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-foreground">Nome</span>
                <input
                  required
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-foreground">Telefone</span>
                <input
                  value={form.telefone ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, telefone: e.target.value }))
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-foreground">Perfil</span>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value as UserRole }))
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                >
                  {STAFF_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABEL[role]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ativo: e.target.checked }))
                  }
                  className="size-4 rounded border-border"
                />
                <span className="text-foreground">Conta ativa</span>
              </label>

              <button
                type="submit"
                disabled={aGuardar}
                className="mt-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {aGuardar
                  ? "A guardar..."
                  : utilizador
                    ? "Guardar alterações"
                    : "Adicionar utilizador"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

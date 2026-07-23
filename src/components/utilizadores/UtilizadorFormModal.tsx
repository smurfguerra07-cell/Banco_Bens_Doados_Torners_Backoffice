import { type FormEvent, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import {
  STAFF_ROLES,
  ROLE_LABEL,
  type CriarUtilizadorInput,
  type Profile,
  type UserRole,
  type UtilizadorInput,
} from "@/types/profile"

const VAZIO_EDICAO: UtilizadorInput = {
  full_name: "",
  telefone: "",
  role: "leitor",
  ativo: true,
}

const VAZIO_CRIACAO: CriarUtilizadorInput = {
  email: "",
  password: "",
  full_name: "",
  telefone: "",
  role: "leitor",
  deve_alterar_password: true,
}

export function UtilizadorFormModal({
  utilizador,
  aberto,
  aGuardar,
  onClose,
  onSubmitCriar,
  onSubmitEditar,
}: {
  utilizador: Profile | null
  aberto: boolean
  aGuardar: boolean
  onClose: () => void
  onSubmitCriar: (input: CriarUtilizadorInput) => void
  onSubmitEditar: (id: string, input: UtilizadorInput) => void
}) {
  const [formEdicao, setFormEdicao] = useState<UtilizadorInput>(VAZIO_EDICAO)
  const [formCriacao, setFormCriacao] = useState<CriarUtilizadorInput>(VAZIO_CRIACAO)

  useEffect(() => {
    if (utilizador) {
      setFormEdicao({
        full_name: utilizador.full_name,
        telefone: utilizador.telefone ?? "",
        role: utilizador.role,
        ativo: utilizador.ativo,
      })
    } else {
      setFormCriacao(VAZIO_CRIACAO)
    }
  }, [utilizador, aberto])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (utilizador) {
      onSubmitEditar(utilizador.id, formEdicao)
    } else {
      onSubmitCriar(formCriacao)
    }
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

            {utilizador ? (
              <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Nome</span>
                  <input
                    required
                    value={formEdicao.full_name}
                    onChange={(e) =>
                      setFormEdicao((f) => ({ ...f, full_name: e.target.value }))
                    }
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Telefone</span>
                  <input
                    value={formEdicao.telefone ?? ""}
                    onChange={(e) =>
                      setFormEdicao((f) => ({ ...f, telefone: e.target.value }))
                    }
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Perfil</span>
                  <select
                    value={formEdicao.role}
                    onChange={(e) =>
                      setFormEdicao((f) => ({ ...f, role: e.target.value as UserRole }))
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
                    checked={formEdicao.ativo}
                    onChange={(e) =>
                      setFormEdicao((f) => ({ ...f, ativo: e.target.checked }))
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
                  {aGuardar ? "A guardar..." : "Guardar alterações"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Nome</span>
                  <input
                    required
                    value={formCriacao.full_name}
                    onChange={(e) =>
                      setFormCriacao((f) => ({ ...f, full_name: e.target.value }))
                    }
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Email</span>
                  <input
                    type="email"
                    required
                    value={formCriacao.email}
                    onChange={(e) =>
                      setFormCriacao((f) => ({ ...f, email: e.target.value }))
                    }
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">
                    Palavra-passe inicial
                  </span>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={formCriacao.password}
                    onChange={(e) =>
                      setFormCriacao((f) => ({ ...f, password: e.target.value }))
                    }
                    placeholder="Mínimo 6 caracteres"
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Telefone</span>
                  <input
                    value={formCriacao.telefone ?? ""}
                    onChange={(e) =>
                      setFormCriacao((f) => ({ ...f, telefone: e.target.value }))
                    }
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Perfil</span>
                  <select
                    value={formCriacao.role}
                    onChange={(e) =>
                      setFormCriacao((f) => ({ ...f, role: e.target.value as UserRole }))
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
                    checked={formCriacao.deve_alterar_password}
                    onChange={(e) =>
                      setFormCriacao((f) => ({
                        ...f,
                        deve_alterar_password: e.target.checked,
                      }))
                    }
                    className="size-4 rounded border-border"
                  />
                  <span className="text-foreground">
                    Pedir para trocar a palavra-passe no primeiro login
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={aGuardar}
                  className="mt-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {aGuardar ? "A criar..." : "Criar utilizador"}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

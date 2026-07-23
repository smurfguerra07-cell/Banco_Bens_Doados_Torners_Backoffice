import { useState } from "react"
import { Pencil, Plus, User } from "lucide-react"
import { useUtilizadores, useUtilizadorMutations } from "@/hooks/useUtilizadores"
import { UtilizadorFormModal } from "@/components/utilizadores/UtilizadorFormModal"
import { ROLE_LABEL, type Profile, type UtilizadorInput } from "@/types/profile"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

export function UtilizadoresPage() {
  const { data: utilizadores, isLoading } = useUtilizadores()
  const { criar, atualizar } = useUtilizadorMutations()
  const { profile: eu } = useAuth()
  const [modalAberto, setModalAberto] = useState(false)
  const [utilizadorEditar, setUtilizadorEditar] = useState<Profile | null>(null)

  function abrirCriar() {
    setUtilizadorEditar(null)
    setModalAberto(true)
  }

  function abrirEditar(utilizador: Profile) {
    setUtilizadorEditar(utilizador)
    setModalAberto(true)
  }

  function handleSubmit(uid: string | null, input: UtilizadorInput) {
    if (uid) {
      criar.mutate({ uid, input }, { onSuccess: () => setModalAberto(false) })
    } else if (utilizadorEditar) {
      atualizar.mutate(
        { id: utilizadorEditar.id, input },
        { onSuccess: () => setModalAberto(false) }
      )
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Utilizadores
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contas de staff do BackOffice.
          </p>
        </div>
        <button
          onClick={abrirCriar}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="size-4" />
          Novo utilizador
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Utilizador</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  A carregar...
                </td>
              </tr>
            )}

            {!isLoading && (utilizadores?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Sem utilizadores para mostrar.
                </td>
              </tr>
            )}

            {utilizadores?.map((utilizador) => (
              <tr key={utilizador.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <User className="size-4" />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">
                        {utilizador.full_name}
                        {utilizador.id === eu?.id && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            (tu)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {ROLE_LABEL[utilizador.role]}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {utilizador.telefone ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      utilizador.ativo
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary/10 text-secondary"
                    )}
                  >
                    {utilizador.ativo ? "Ativo" : "Suspenso"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => abrirEditar(utilizador)}
                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UtilizadorFormModal
        utilizador={utilizadorEditar}
        aberto={modalAberto}
        aGuardar={criar.isPending || atualizar.isPending}
        onClose={() => setModalAberto(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

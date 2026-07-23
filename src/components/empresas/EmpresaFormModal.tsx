import { type FormEvent, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import type { Empresa, EmpresaInput, EmpresaTipo } from "@/types/empresa"

const TIPOS: EmpresaTipo[] = ["doadora", "beneficiaria", "ambas"]

const VAZIO: EmpresaInput = {
  nome: "",
  nif: "",
  tipo: "beneficiaria",
  morada: "",
  codigo_postal: "",
  cidade: "",
  telefone: "",
  email: "",
  website: "",
  ativo: true,
}

export function EmpresaFormModal({
  empresa,
  aberto,
  aGuardar,
  onClose,
  onSubmit,
}: {
  empresa: Empresa | null
  aberto: boolean
  aGuardar: boolean
  onClose: () => void
  onSubmit: (input: EmpresaInput) => void
}) {
  const [form, setForm] = useState<EmpresaInput>(VAZIO)

  useEffect(() => {
    if (empresa) {
      setForm({
        nome: empresa.nome,
        nif: empresa.nif ?? "",
        tipo: empresa.tipo,
        morada: empresa.morada ?? "",
        codigo_postal: empresa.codigo_postal ?? "",
        cidade: empresa.cidade ?? "",
        telefone: empresa.telefone ?? "",
        email: empresa.email ?? "",
        website: empresa.website ?? "",
        ativo: empresa.ativo,
      })
    } else {
      setForm(VAZIO)
    }
  }, [empresa, aberto])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(form)
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
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl"
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
              {empresa ? "Editar empresa" : "Nova empresa"}
            </h2>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-foreground">Nome</span>
                <input
                  required
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">NIF</span>
                  <input
                    value={form.nif ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, nif: e.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Tipo</span>
                  <select
                    value={form.tipo}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tipo: e.target.value as EmpresaTipo }))
                    }
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  >
                    {TIPOS.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-foreground">Morada</span>
                <input
                  value={form.morada ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, morada: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Código postal</span>
                  <input
                    value={form.codigo_postal ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, codigo_postal: e.target.value }))
                    }
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Cidade</span>
                  <input
                    value={form.cidade ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <span className="font-medium text-foreground">Email</span>
                  <input
                    type="email"
                    value={form.email ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-foreground">Website</span>
                <input
                  value={form.website ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                  className="size-4 rounded border-border"
                />
                <span className="text-foreground">Ativa</span>
              </label>

              <button
                type="submit"
                disabled={aGuardar}
                className="mt-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {aGuardar
                  ? "A guardar..."
                  : empresa
                    ? "Guardar alterações"
                    : "Criar empresa"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

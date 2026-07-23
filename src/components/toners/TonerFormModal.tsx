import { type FormEvent, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import type { Toner, TonerEstado, TonerInput } from "@/types/toner"

const ESTADOS: TonerEstado[] = ["novo", "usado", "reconstruido"]

const VAZIO: TonerInput = {
  marca: "",
  modelo: "",
  referencia: "",
  compatibilidade: [],
  quantidade: 0,
  estado: "novo",
  localizacao: "",
  categoria: "",
  observacoes: "",
  ativo: true,
}

export function TonerFormModal({
  toner,
  aberto,
  aGuardar,
  onClose,
  onSubmit,
}: {
  toner: Toner | null
  aberto: boolean
  aGuardar: boolean
  onClose: () => void
  onSubmit: (input: TonerInput) => void
}) {
  const [form, setForm] = useState<TonerInput>(VAZIO)
  const [compatibilidadeTexto, setCompatibilidadeTexto] = useState("")

  useEffect(() => {
    if (toner) {
      setForm({
        marca: toner.marca,
        modelo: toner.modelo,
        referencia: toner.referencia,
        compatibilidade: toner.compatibilidade,
        quantidade: toner.quantidade,
        estado: toner.estado,
        localizacao: toner.localizacao ?? "",
        categoria: toner.categoria ?? "",
        observacoes: toner.observacoes ?? "",
        ativo: toner.ativo,
      })
      setCompatibilidadeTexto(toner.compatibilidade.join(", "))
    } else {
      setForm(VAZIO)
      setCompatibilidadeTexto("")
    }
  }, [toner, aberto])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      compatibilidade: compatibilidadeTexto
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    })
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
              {toner ? "Editar toner" : "Novo toner"}
            </h2>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Marca</span>
                  <input
                    required
                    value={form.marca}
                    onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Modelo</span>
                  <input
                    required
                    value={form.modelo}
                    onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-foreground">Referência</span>
                <input
                  required
                  value={form.referencia}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, referencia: e.target.value }))
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-foreground">
                  Compatibilidade (separado por vírgulas)
                </span>
                <input
                  value={compatibilidadeTexto}
                  onChange={(e) => setCompatibilidadeTexto(e.target.value)}
                  placeholder="HP LaserJet P2035, HP LaserJet P2055"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Quantidade</span>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.quantidade}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, quantidade: Number(e.target.value) }))
                    }
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Estado</span>
                  <select
                    value={form.estado}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, estado: e.target.value as TonerEstado }))
                    }
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  >
                    {ESTADOS.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Localização</span>
                  <input
                    value={form.localizacao ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, localizacao: e.target.value }))
                    }
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-foreground">Categoria</span>
                  <input
                    value={form.categoria ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, categoria: e.target.value }))
                    }
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-foreground">Observações</span>
                <textarea
                  rows={3}
                  value={form.observacoes ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, observacoes: e.target.value }))
                  }
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
                <span className="text-foreground">Visível no catálogo público</span>
              </label>

              <button
                type="submit"
                disabled={aGuardar}
                className="mt-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {aGuardar ? "A guardar..." : toner ? "Guardar alterações" : "Criar toner"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

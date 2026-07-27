import { useState } from "react"
import { Building2, Paperclip, User } from "lucide-react"
import { useAtualizarEstadoDoacaoInteresse, useDoacoesInteresse } from "@/hooks/useDoacoesInteresse"
import {
  DOACAO_INTERESSE_ESTADO_LABEL,
  type DoacaoInteresse,
  type DoacaoInteresseEstado,
} from "@/types/doacaoInteresse"
import { cn } from "@/lib/utils"

const ESTADO_BADGE: Record<DoacaoInteresseEstado, string> = {
  novo: "bg-secondary/10 text-secondary",
  contactado: "bg-amber-500/10 text-amber-600",
  concluido: "bg-primary/10 text-primary",
}

const FILTROS: (DoacaoInteresseEstado | "todos")[] = ["todos", "novo", "contactado", "concluido"]

export function DoacoesInteressePage() {
  const { data: interesses, isLoading } = useDoacoesInteresse()
  const atualizarEstado = useAtualizarEstadoDoacaoInteresse()
  const [filtro, setFiltro] = useState<DoacaoInteresseEstado | "todos">("todos")

  const filtrados = (interesses ?? []).filter((i) => filtro === "todos" || i.estado === filtro)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Interesses de Doação</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedidos recebidos pelo formulário "Quero Doar" do Portal.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                filtro === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {f === "todos" ? "Todos" : DOACAO_INTERESSE_ESTADO_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">A carregar...</p>}

        {!isLoading && filtrados.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Sem pedidos para mostrar.
          </div>
        )}

        {filtrados.map((interesse: DoacaoInteresse) => (
          <div key={interesse.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {interesse.tipo === "empresa" ? (
                    <Building2 className="size-4" />
                  ) : (
                    <User className="size-4" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {interesse.tipo === "empresa" ? interesse.nome_empresa : interesse.nome}
                    {interesse.tipo === "empresa" && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (contacto: {interesse.nome})
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {interesse.email} · {interesse.telefone} ·{" "}
                    {new Date(interesse.created_at).toLocaleDateString("pt-PT")}
                  </p>
                  {interesse.mensagem && (
                    <p className="mt-2 text-sm text-foreground/90">{interesse.mensagem}</p>
                  )}
                  {interesse.anexo_url && (
                    <a
                      href={interesse.anexo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 flex w-fit items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-foreground transition hover:bg-muted"
                    >
                      <Paperclip className="size-3.5" />
                      {interesse.anexo_nome ?? "Anexo"}
                    </a>
                  )}
                </div>
              </div>

              <select
                value={interesse.estado}
                onChange={(e) =>
                  atualizarEstado.mutate({
                    id: interesse.id,
                    estado: e.target.value as DoacaoInteresseEstado,
                  })
                }
                className={cn(
                  "shrink-0 rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none",
                  ESTADO_BADGE[interesse.estado]
                )}
              >
                {Object.entries(DOACAO_INTERESSE_ESTADO_LABEL).map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

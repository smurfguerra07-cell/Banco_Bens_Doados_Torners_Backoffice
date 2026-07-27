import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { BarChart3, BookOpen, Copy, HelpCircle, Pencil, Plus, Search } from "lucide-react"
import { useArtigos, useKbArtigoMutations } from "@/hooks/useKbArtigos"
import { KB_CATEGORIA_LABEL, KB_ESTADO_LABEL, type KbEstado } from "@/types/kbArtigo"
import { cn } from "@/lib/utils"

const ESTADO_FILTROS: (KbEstado | "todos")[] = ["todos", "publicado", "rascunho", "arquivado"]

const ESTADO_BADGE: Record<KbEstado, string> = {
  publicado: "bg-primary/10 text-primary",
  rascunho: "bg-muted text-muted-foreground",
  arquivado: "bg-secondary/10 text-secondary",
}

export function ConhecimentoPage() {
  const navigate = useNavigate()
  const { data: artigos, isLoading } = useArtigos()
  const { duplicar, arquivar, publicar } = useKbArtigoMutations()
  const [pesquisa, setPesquisa] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<KbEstado | "todos">("todos")

  const filtrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()
    return (artigos ?? []).filter((a) => {
      if (filtroEstado !== "todos" && a.estado !== filtroEstado) return false
      if (!termo) return true
      return (
        a.titulo.toLowerCase().includes(termo) ||
        a.palavras_chave.some((p) => p.toLowerCase().includes(termo))
      )
    })
  }, [artigos, pesquisa, filtroEstado])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Centro de Conhecimento</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Artigos que a Aura usa para responder no Portal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/conhecimento/perguntas-sem-resposta")}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <HelpCircle className="size-4" />
            Perguntas sem resposta
          </button>
          <button
            onClick={() => navigate("/conhecimento/estatisticas")}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <BarChart3 className="size-4" />
            Estatísticas
          </button>
          <button
            onClick={() => navigate("/conhecimento/novo")}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="size-4" />
            Novo artigo
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-sm sm:flex-1">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar por título ou palavra-chave..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {ESTADO_FILTROS.map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                filtroEstado === estado
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {estado === "todos" ? "Todos" : KB_ESTADO_LABEL[estado]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Artigo</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Prioridade</th>
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

            {!isLoading && filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Sem artigos para mostrar.
                </td>
              </tr>
            )}

            {filtrados.map((artigo) => (
              <tr key={artigo.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <BookOpen className="size-4" />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{artigo.titulo}</p>
                      {artigo.subtitulo && (
                        <p className="text-xs text-muted-foreground">{artigo.subtitulo}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {KB_CATEGORIA_LABEL[artigo.categoria]}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {artigo.prioridade}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      artigo.estado === "publicado"
                        ? arquivar.mutate(artigo.id)
                        : publicar.mutate(artigo.id)
                    }
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition",
                      ESTADO_BADGE[artigo.estado]
                    )}
                    title={
                      artigo.estado === "publicado"
                        ? "Clicar para arquivar"
                        : "Clicar para publicar"
                    }
                  >
                    {KB_ESTADO_LABEL[artigo.estado]}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/conhecimento/${artigo.id}`)}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label="Editar"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => duplicar.mutate(artigo)}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label="Duplicar"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

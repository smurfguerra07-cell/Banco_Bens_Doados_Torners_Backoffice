import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft, CheckCircle2, HelpCircle, PlusCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useMarcarResolvida, usePerguntasSemResposta } from "@/hooks/usePerguntasSemResposta"
import { KB_CATEGORIA_LABEL, type KbCategoria } from "@/types/kbArtigo"
import { cn } from "@/lib/utils"

export function PerguntasSemRespostaPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: perguntas, isLoading } = usePerguntasSemResposta()
  const marcarResolvida = useMarcarResolvida()
  const [filtro, setFiltro] = useState<"pendentes" | "todas">("pendentes")

  const filtradas = useMemo(() => {
    if (!perguntas) return []
    return filtro === "pendentes" ? perguntas.filter((p) => !p.resolvida) : perguntas
  }, [perguntas, filtro])

  function criarArtigo(pergunta: (typeof filtradas)[number]) {
    navigate("/conhecimento/novo", {
      state: {
        tituloSugestao: pergunta.pergunta,
        categoriaSugestao: pergunta.categoria_detectada,
        perguntaSemRespostaId: pergunta.id,
      },
    })
  }

  return (
    <div>
      <button
        onClick={() => navigate("/conhecimento")}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar ao Centro de Conhecimento
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Perguntas sem Resposta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Perguntas que a Aura não conseguiu responder com confiança suficiente.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {(["pendentes", "todas"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                filtro === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {f === "pendentes" ? "Pendentes" : "Todas"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">A carregar...</p>}

        {!isLoading && filtradas.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            {filtro === "pendentes" ? "Sem perguntas pendentes. 👍" : "Ainda não há registos."}
          </div>
        )}

        {filtradas.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <HelpCircle className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.pergunta}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.categoria_detectada
                      ? KB_CATEGORIA_LABEL[p.categoria_detectada as KbCategoria] ?? p.categoria_detectada
                      : "Sem categoria detetada"}
                    {p.profiles?.full_name && ` · ${p.profiles.full_name}`}
                    {" · "}
                    {new Date(p.created_at).toLocaleDateString("pt-PT")}
                  </p>
                </div>
              </div>

              {p.resolvida ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <CheckCircle2 className="size-3.5" />
                  Resolvida
                </span>
              ) : (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => criarArtigo(p)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                  >
                    <PlusCircle className="size-3.5" />
                    Criar artigo
                  </button>
                  <button
                    onClick={() => profile && marcarResolvida.mutate({ id: p.id, resolvidaPorId: profile.id })}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    Marcar resolvida
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

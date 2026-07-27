import { useNavigate } from "react-router"
import { ArrowLeft, MessageCircleQuestion, Sparkles, TrendingUp, Users } from "lucide-react"
import { useKbEstatisticas } from "@/hooks/useKbEstatisticas"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"
import { KB_CATEGORIA_LABEL, type KbCategoria } from "@/types/kbArtigo"

function formatarDuracao(segundos: number | null): string {
  if (segundos === null) return "—"
  if (segundos < 60) return `${Math.round(segundos)}s`
  return `${Math.round(segundos / 60)} min`
}

export function ConhecimentoEstatisticasPage() {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useKbEstatisticas()

  return (
    <div>
      <button
        onClick={() => navigate("/conhecimento")}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar ao Centro de Conhecimento
      </button>

      <h1 className="text-2xl font-semibold text-foreground">Estatísticas da Aura</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Desempenho da Aura no Portal — quantas perguntas resolve sozinha e onde há lacunas de conteúdo.
      </p>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">A carregar...</p>}

      {stats && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Perguntas</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                <AnimatedNumber value={stats.totalPerguntas} />
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="size-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Taxa de auto-resolução</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                <AnimatedNumber
                  value={stats.taxaAutoResolucao * 100}
                  formatar={(n) => `${n.toFixed(0)}%`}
                />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.resolvidasAuto} resolvidas · {stats.escaladas} escaladas
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="size-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Tempo médio de resposta</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatarDuracao(stats.tempoMedioRespostaSegundos)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircleQuestion className="size-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Perguntas sem resposta</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                <AnimatedNumber value={stats.perguntasSemResposta} />
              </p>
              <button
                onClick={() => navigate("/conhecimento/perguntas-sem-resposta")}
                className="mt-1 text-xs font-medium text-primary hover:opacity-80"
              >
                Ver todas →
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Artigos mais consultados</h2>
              <div className="mt-3 space-y-2">
                {stats.artigosMaisConsultados.length === 0 && (
                  <p className="text-sm text-muted-foreground">Ainda sem dados.</p>
                )}
                {stats.artigosMaisConsultados.map((a) => (
                  <div key={a.artigoId} className="flex items-center justify-between text-sm">
                    <span className="truncate text-foreground">{a.titulo}</span>
                    <span className="ml-2 shrink-0 font-mono text-xs text-muted-foreground">{a.consultas}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Categorias mais usadas</h2>
              <div className="mt-3 space-y-2">
                {stats.categoriasMaisUsadas.length === 0 && (
                  <p className="text-sm text-muted-foreground">Ainda sem dados.</p>
                )}
                {stats.categoriasMaisUsadas.map((c) => (
                  <div key={c.categoria} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">
                      {KB_CATEGORIA_LABEL[c.categoria as KbCategoria] ?? c.categoria}
                    </span>
                    <span className="ml-2 shrink-0 font-mono text-xs text-muted-foreground">{c.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

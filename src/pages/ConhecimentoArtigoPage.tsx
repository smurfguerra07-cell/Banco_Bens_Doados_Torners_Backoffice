import { useEffect, useState, type KeyboardEvent } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { ArrowLeft, Eye, Pencil, X } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useArtigo, useKbArtigoMutations } from "@/hooks/useKbArtigos"
import { useMarcarResolvida } from "@/hooks/usePerguntasSemResposta"
import { AnexosEditor } from "@/components/conhecimento/AnexosEditor"
import { AssociacaoProdutoPicker } from "@/components/conhecimento/AssociacaoProdutoPicker"
import { FaqsRelacionadasPicker } from "@/components/conhecimento/FaqsRelacionadasPicker"
import { MarkdownLite } from "@/lib/markdownLite"
import { cn } from "@/lib/utils"
import {
  KB_CATEGORIA_LABEL,
  KB_ESTADO_LABEL,
  type KbArtigoInput,
  type KbCategoria,
  type KbEstado,
} from "@/types/kbArtigo"

const VAZIO: KbArtigoInput = {
  titulo: "",
  subtitulo: "",
  categoria: "faq",
  resumo: "",
  conteudo: "",
  palavras_chave: [],
  sinonimos: [],
  prioridade: 0,
  estado: "rascunho",
}

function TagInput({
  label,
  valores,
  onChange,
  placeholder,
}: {
  label: string
  valores: string[]
  onChange: (valores: string[]) => void
  placeholder: string
}) {
  const [rascunho, setRascunho] = useState("")

  function adicionar() {
    const termo = rascunho.trim()
    if (!termo || valores.includes(termo)) {
      setRascunho("")
      return
    }
    onChange([...valores, termo])
    setRascunho("")
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      adicionar()
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5">
        {valores.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(valores.filter((x) => x !== v))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={rascunho}
          onChange={(e) => setRascunho(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={adicionar}
          placeholder={placeholder}
          className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}

export function ConhecimentoArtigoPage() {
  const { id } = useParams<{ id: string }>()
  const novo = id === "novo"
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()
  const { data: artigo, isLoading } = useArtigo(novo ? undefined : id)
  const { guardar } = useKbArtigoMutations()
  const marcarResolvida = useMarcarResolvida()
  const sugestao = novo
    ? (location.state as { tituloSugestao?: string; categoriaSugestao?: KbCategoria; perguntaSemRespostaId?: string } | null)
    : null
  const [form, setForm] = useState<KbArtigoInput>(
    sugestao?.tituloSugestao
      ? { ...VAZIO, titulo: sugestao.tituloSugestao, categoria: sugestao.categoriaSugestao ?? VAZIO.categoria }
      : VAZIO
  )
  const [aPrever, setAPrever] = useState(false)

  useEffect(() => {
    if (artigo) {
      setForm({
        titulo: artigo.titulo,
        subtitulo: artigo.subtitulo ?? "",
        categoria: artigo.categoria,
        resumo: artigo.resumo ?? "",
        conteudo: artigo.conteudo,
        palavras_chave: artigo.palavras_chave,
        sinonimos: artigo.sinonimos,
        prioridade: artigo.prioridade,
        estado: artigo.estado,
      })
    }
  }, [artigo])

  function campo<K extends keyof KbArtigoInput>(chave: K, valor: KbArtigoInput[K]) {
    setForm((f) => ({ ...f, [chave]: valor }))
  }

  function handleGuardar() {
    if (!form.titulo.trim() || !form.conteudo.trim()) {
      toast.error("Título e conteúdo são obrigatórios.")
      return
    }
    if (!profile) return
    guardar.mutate(
      {
        id: novo ? undefined : id,
        input: {
          ...form,
          subtitulo: form.subtitulo?.trim() || null,
          resumo: form.resumo?.trim() || null,
        },
        autorId: profile.id,
      },
      {
        onSuccess: (data) => {
          if (sugestao?.perguntaSemRespostaId) {
            marcarResolvida.mutate({
              id: sugestao.perguntaSemRespostaId,
              resolvidaPorId: profile.id,
              artigoCriadoId: data.id,
            })
          }
          navigate(`/conhecimento/${data.id}`, { replace: true })
        },
      }
    )
  }

  if (!novo && isLoading) {
    return <p className="text-sm text-muted-foreground">A carregar...</p>
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => navigate("/conhecimento")}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar ao Centro de Conhecimento
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          {novo ? "Novo artigo" : "Editar artigo"}
        </h1>
        <button
          onClick={handleGuardar}
          disabled={guardar.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {guardar.isPending ? "A guardar..." : "Guardar artigo"}
        </button>
      </div>

      <div className="mt-6 space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Título</label>
            <input
              value={form.titulo}
              onChange={(e) => campo("titulo", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Categoria</label>
            <select
              value={form.categoria}
              onChange={(e) => campo("categoria", e.target.value as KbCategoria)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {Object.entries(KB_CATEGORIA_LABEL).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Subtítulo (opcional)
          </label>
          <input
            value={form.subtitulo ?? ""}
            onChange={(e) => campo("subtitulo", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Resumo (usado nas listagens)
          </label>
          <input
            value={form.resumo ?? ""}
            onChange={(e) => campo("resumo", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Conteúdo</label>
            <button
              type="button"
              onClick={() => setAPrever((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80"
            >
              {aPrever ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
              {aPrever ? "Editar" : "Pré-visualizar"}
            </button>
          </div>
          {aPrever ? (
            <div className="min-h-40 rounded-lg border border-border bg-background px-3 py-2.5">
              <MarkdownLite texto={form.conteudo || "_(sem conteúdo)_"} />
            </div>
          ) : (
            <textarea
              value={form.conteudo}
              onChange={(e) => campo("conteudo", e.target.value)}
              rows={10}
              placeholder={"Suporta **negrito**, listas \"- item\" e avisos \"> aviso\"."}
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-primary"
            />
          )}
        </div>

        <TagInput
          label="Palavras-chave"
          valores={form.palavras_chave}
          onChange={(v) => campo("palavras_chave", v)}
          placeholder="Escrever e Enter..."
        />
        <TagInput
          label="Sinónimos / outras formas de escrever"
          valores={form.sinonimos}
          onChange={(v) => campo("sinonimos", v)}
          placeholder="Ex: HP305XL, HP 305 XL..."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Prioridade (0–100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.prioridade}
              onChange={(e) => campo("prioridade", Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Estado</label>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
              {(Object.entries(KB_ESTADO_LABEL) as [KbEstado, string][]).map(([valor, label]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => campo("estado", valor)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition",
                    form.estado === valor
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!novo && id && (
        <div className="mt-5 space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm">
          <AnexosEditor artigoId={id} />
          <AssociacaoProdutoPicker artigoId={id} />
          <FaqsRelacionadasPicker artigoId={id} />
        </div>
      )}
      {novo && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Guarda o artigo primeiro para poderes adicionar anexos, produtos associados e FAQs.
        </p>
      )}
    </div>
  )
}

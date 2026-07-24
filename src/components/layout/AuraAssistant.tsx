import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import { ArrowUp, Sparkles, X } from "lucide-react"

const SUGESTOES = [
  "Resume os pedidos pendentes por urgência",
  "Que toners estão em stock crítico?",
  "Qual foi o impacto ambiental deste mês?",
]

function avisarEmBreve() {
  toast("A Aura ainda não está disponível — em breve.", { icon: "✨" })
}

export function AuraCommandBar({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group relative flex h-10 w-full max-w-2xl flex-1 items-center gap-3 rounded-full border border-transparent bg-primary/5 px-4 outline-none transition-all duration-300 hover:border-secondary/20 hover:bg-card hover:shadow-[var(--shadow-elegant)] focus-visible:ring-4 focus-visible:ring-secondary/10"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary/40" />
        <span className="relative inline-flex size-2 rounded-full bg-secondary" />
      </span>
      <span className="flex-1 truncate text-left text-sm italic font-medium text-muted-foreground">
        Perguntar à Aura — resumir pedidos, sugerir prioridades…
      </span>
      <kbd className="hidden items-center rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground group-hover:border-primary/20 sm:inline-flex">
        ⌘K
      </kbd>
    </button>
  )
}

export function AuraAssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  function submit(texto: string) {
    if (!texto.trim()) return
    avisarEmBreve()
    setInput("")
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-primary/10 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-border bg-background shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:w-[440px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex h-16 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-3">
            <div className="relative flex size-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/70">
              <Sparkles className="size-4 text-secondary" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">Aura</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Assistente IA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/5"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <div className="animate-slide-up text-sm leading-relaxed text-foreground">
            Olá. Sou a <span className="font-semibold">Aura</span> — a tua assistente na Banco de
            Bens Doados. Esta funcionalidade está em construção; em breve vou conseguir responder
            a perguntas sobre pedidos, stock e impacto ambiental.
          </div>

          <div className="mt-6 space-y-2">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Sugestões
            </p>
            {SUGESTOES.map((s) => (
              <button
                key={s}
                onClick={() => submit(s)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground/80 transition-all hover:border-primary/20 hover:shadow-[var(--shadow-elegant)]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border bg-background p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit(input)
            }}
            className="relative flex items-end gap-2 rounded-2xl border border-border bg-card p-2 pl-4 transition-all focus-within:border-secondary/30 focus-within:ring-4 focus-within:ring-secondary/5"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  submit(input)
                }
              }}
              rows={1}
              placeholder="Pergunta o que precisares…"
              className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowUp className="size-4" strokeWidth={2.5} />
            </button>
          </form>
          <p className="mt-2 px-1 text-[10px] text-muted-foreground/70">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </aside>
    </>
  )
}

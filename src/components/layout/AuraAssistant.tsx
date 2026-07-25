import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowUp, FileDown, Sparkles, X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToners } from "@/hooks/useToners"
import { usePedidos } from "@/hooks/usePedidos"
import { useTickets } from "@/hooks/useTickets"
import { useEmpresas } from "@/hooks/useEmpresas"
import { useMovimentosDoacao } from "@/hooks/useMovimentos"
import { criarAlerta } from "@/services/alertas"
import { ajustarQuantidadeToner, incrementarStockToner, registarDoacaoToner } from "@/services/toners"
import { enviarMensagem, fetchMensagens, fetchTickets } from "@/services/tickets"
import { atualizarEstadoPedido } from "@/services/pedidos"
import { TICKET_CATEGORIA_LABEL, TICKET_ESTADO_LABEL } from "@/types/ticket"
import { PEDIDO_ESTADO_LABEL } from "@/types/pedido"
import { processarMensagem, type AuraState } from "@/lib/aura/conversar"
import { gerarRespostaTicket } from "@/lib/aura/respostasTicket"
import { construirRelatorio, TIPO_RELATORIO_LABEL } from "@/lib/aura/relatorios"
import { gerarBriefingDiarioPdf, gerarEtiquetaTonerPdf, gerarFichaDoacaoPdf } from "@/lib/aura/documentos"
import { criarCsvBlob, criarPdfBlob } from "@/lib/export"
import { cn } from "@/lib/utils"

const SUGESTOES = [
  "Ver stock atual de toners",
  "Stock em nível crítico",
  "Pedidos pendentes",
  "Impacto ambiental",
  "Contexto de um ticket",
]

const MENSAGEM_ERRO_GENERICO =
  "Algo correu mal — a ação não foi concluída e nenhum dado foi alterado. Podes tentar novamente ou contactar o suporte técnico se o problema persistir."

interface Mensagem {
  id: string
  autor: "user" | "aura"
  texto: string
  anexo?: { nome: string; url: string }
}

const MENSAGEM_INICIAL: Mensagem = {
  id: "welcome",
  autor: "aura",
  texto:
    "Olá, sou a Aura — a assistente do BackOffice do Banco de Bens Doados.\nConheço bem os stocks, pedidos, impacto ambiental e tickets de suporte. O que precisas?",
}

/** Renderiza **negrito** nas mensagens da Aura, sem precisar de um parser de markdown completo. */
function renderComNegrito(texto: string) {
  return texto.split(/\*\*(.+?)\*\*/g).map((parte, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {parte}
      </strong>
    ) : (
      parte
    )
  )
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
  const { user } = useAuth()
  const { data: toners } = useToners()
  const { data: pedidos } = usePedidos()
  const { data: tickets } = useTickets()
  const { data: empresas } = useEmpresas()
  const { data: movimentosDoacao } = useMovimentosDoacao()
  const queryClient = useQueryClient()

  const [mensagens, setMensagens] = useState<Mensagem[]>([MENSAGEM_INICIAL])
  const [estado, setEstado] = useState<AuraState>({ fase: "idle" })
  const [input, setInput] = useState("")
  const [aProcessar, setAProcessar] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [mensagens])

  function adicionar(autor: Mensagem["autor"], texto: string, anexo?: Mensagem["anexo"]) {
    setMensagens((m) => [...m, { id: `${Date.now()}-${autor}-${Math.random()}`, autor, texto, anexo }])
  }

  async function executarAcao(
    acao: NonNullable<ReturnType<typeof processarMensagem>["executar"]>
  ) {
    if (acao.tipo === "incrementar_stock") {
      if (!user) return
      setAProcessar(true)
      try {
        await incrementarStockToner(acao.tonerId, acao.quantidade, user.id)
        await queryClient.invalidateQueries({ queryKey: ["admin-toners"] })
        const final = acao.quantidadeAtual + acao.quantidade
        adicionar("aura", `Feito. O stock do **${acao.tonerLabel}** está agora em **${final}** unidades.`)
      } catch {
        adicionar("aura", MENSAGEM_ERRO_GENERICO)
      } finally {
        setAProcessar(false)
      }
      return
    }

    if (acao.tipo === "consultar_ticket") {
      setAProcessar(true)
      try {
        const tickets = await fetchTickets()
        const ticket = tickets.find((t) => t.numero === acao.numero)
        if (!ticket) {
          adicionar("aura", `Não encontrei nenhum ticket com o número #${acao.numero}.`)
          return
        }
        const mensagensTicket = await fetchMensagens(ticket.id)
        const ultimas = mensagensTicket
          .slice(-3)
          .map((m) => `— ${m.conteudo ?? (m.anexo_tipo === "audio" ? "[áudio]" : "[imagem]")}`)
          .join("\n")
        adicionar(
          "aura",
          `Ticket #${ticket.numero} — ${ticket.assunto}\n` +
            `Categoria: ${TICKET_CATEGORIA_LABEL[ticket.categoria]} · Estado: ${TICKET_ESTADO_LABEL[ticket.estado]}\n` +
            `Cliente: ${ticket.profiles?.full_name ?? "—"}\n\n` +
            (ultimas ? `Últimas mensagens:\n${ultimas}` : "Ainda sem mensagens neste ticket.")
        )
      } catch {
        adicionar("aura", MENSAGEM_ERRO_GENERICO)
      } finally {
        setAProcessar(false)
      }
      return
    }

    if (acao.tipo === "preparar_resposta_ticket") {
      setAProcessar(true)
      try {
        const listaTickets = await fetchTickets()
        const ticket = listaTickets.find((t) => t.id === acao.ticketId)
        if (!ticket) {
          adicionar("aura", `Não encontrei o ticket #${acao.ticketNumero}.`)
          return
        }
        const mensagensTicket = await fetchMensagens(ticket.id)
        const mensagensCliente = mensagensTicket.filter((m) => m.autor_id === ticket.profile_id)
        const resposta = gerarRespostaTicket(ticket, mensagensCliente, toners ?? [])
        setEstado({
          fase: "confirmar_resposta_ticket",
          ticketId: ticket.id,
          ticketNumero: ticket.numero,
          conteudo: resposta,
        })
        adicionar(
          "aura",
          `Aqui está a resposta que preparei para o ticket **#${ticket.numero}**:\n"${resposta}"\nQueres enviar isto ao cliente? Uma vez enviada, não é possível retirar. — **sim** ou **não**`
        )
      } catch {
        adicionar("aura", MENSAGEM_ERRO_GENERICO)
      } finally {
        setAProcessar(false)
      }
      return
    }

    if (acao.tipo === "responder_ticket") {
      if (!user) return
      setAProcessar(true)
      try {
        await enviarMensagem({ ticketId: acao.ticketId, autorId: user.id, conteudo: acao.conteudo })
        await queryClient.invalidateQueries({ queryKey: ["admin-tickets"] })
        await queryClient.invalidateQueries({ queryKey: ["ticket-mensagens", acao.ticketId] })
        adicionar("aura", `Resposta enviada. O cliente do ticket **#${acao.ticketNumero}** recebeu a mensagem.`)
      } catch {
        adicionar("aura", MENSAGEM_ERRO_GENERICO)
      } finally {
        setAProcessar(false)
      }
      return
    }

    if (acao.tipo === "gerar_relatorio") {
      setAProcessar(true)
      try {
        const { linhas, colunas, titulo } = construirRelatorio(acao.tipoRelatorio, {
          toners: toners ?? [],
          pedidos: pedidos ?? [],
          empresas: empresas ?? [],
          marcaFiltro: acao.marcaFiltro,
          dataInicio: acao.dataInicio,
          pendentesOnly: acao.pendentesOnly,
        })
        if (linhas.length === 0) {
          adicionar("aura", `Não há dados para o relatório de **${TIPO_RELATORIO_LABEL[acao.tipoRelatorio]}** com esses filtros.`)
          return
        }
        const nomeBase = titulo.toLowerCase().replace(/\s+/g, "-")
        const blob =
          acao.formato === "pdf"
            ? await criarPdfBlob(linhas, colunas, titulo)
            : criarCsvBlob(linhas, colunas)
        const nomeFicheiro = `${nomeBase}.${acao.formato}`
        const url = URL.createObjectURL(blob)
        adicionar(
          "aura",
          `Pronto. O relatório de **${titulo}** (${linhas.length} linha(s)) está pronto a descarregar.`,
          { nome: nomeFicheiro, url }
        )
      } catch {
        adicionar("aura", MENSAGEM_ERRO_GENERICO)
      } finally {
        setAProcessar(false)
      }
      return
    }

    if (acao.tipo === "registar_doacao") {
      if (!user) return
      setAProcessar(true)
      try {
        await registarDoacaoToner({
          tonerId: acao.tonerId,
          quantidade: acao.quantidade,
          condicao: acao.condicao,
          empresaId: acao.empresaId,
          profileId: user.id,
        })
        await queryClient.invalidateQueries({ queryKey: ["admin-toners"] })
        const doacao = {
          tonerLabel: acao.tonerLabel,
          quantidade: acao.quantidade,
          condicao: acao.condicao,
          empresaNome: acao.empresaNome,
          data: new Date().toISOString(),
        }
        setEstado((prev) => (prev.fase === "idle" ? { ...prev, ultimaDoacao: doacao } : { fase: "idle", ultimaDoacao: doacao }))
        adicionar(
          "aura",
          `Doação registada. O **${acao.tonerLabel}** já reflete as novas unidades no stock. Posso gerar a ficha de doação em PDF, se quiseres.`
        )
      } catch {
        adicionar("aura", MENSAGEM_ERRO_GENERICO)
      } finally {
        setAProcessar(false)
      }
      return
    }

    if (acao.tipo === "avancar_pedido") {
      setAProcessar(true)
      try {
        await atualizarEstadoPedido(acao.pedidoId, acao.novoEstado)
        await queryClient.invalidateQueries({ queryKey: ["admin-pedidos"] })
        adicionar(
          "aura",
          `Feito. O pedido **#${acao.pedidoNumero}** está agora em **${PEDIDO_ESTADO_LABEL[acao.novoEstado]}**.`
        )
      } catch {
        adicionar("aura", MENSAGEM_ERRO_GENERICO)
      } finally {
        setAProcessar(false)
      }
      return
    }

    if (acao.tipo === "ajustar_stock_contagem") {
      if (!user) return
      try {
        await ajustarQuantidadeToner(acao.tonerId, acao.quantidadeNova, user.id)
        await queryClient.invalidateQueries({ queryKey: ["admin-toners"] })
      } catch {
        adicionar("aura", `Não consegui corrigir o stock de ${acao.tonerLabel} — vale a pena confirmar manualmente.`)
      }
      return
    }

    if (acao.tipo === "gerar_ficha_doacao") {
      setAProcessar(true)
      try {
        const blob = await gerarFichaDoacaoPdf(acao)
        const url = URL.createObjectURL(blob)
        adicionar("aura", "Aqui está a ficha de doação.", { nome: "ficha-doacao.pdf", url })
      } catch {
        adicionar("aura", MENSAGEM_ERRO_GENERICO)
      } finally {
        setAProcessar(false)
      }
      return
    }

    if (acao.tipo === "gerar_etiqueta") {
      setAProcessar(true)
      try {
        const toner = (toners ?? []).find((t) => t.id === acao.tonerId)
        if (!toner) {
          adicionar("aura", `Não encontrei o ${acao.tonerLabel}.`)
          return
        }
        const blob = await gerarEtiquetaTonerPdf(toner)
        const url = URL.createObjectURL(blob)
        adicionar("aura", `Aqui está a etiqueta do **${acao.tonerLabel}**.`, {
          nome: `etiqueta-${toner.referencia}.pdf`,
          url,
        })
      } catch {
        adicionar("aura", MENSAGEM_ERRO_GENERICO)
      } finally {
        setAProcessar(false)
      }
      return
    }

    if (acao.tipo === "gerar_briefing") {
      setAProcessar(true)
      try {
        const blob = await gerarBriefingDiarioPdf({ toners: toners ?? [], pedidos: pedidos ?? [], tickets: tickets ?? [] })
        const url = URL.createObjectURL(blob)
        adicionar("aura", "Aqui está o briefing diário.", {
          nome: `briefing-${new Date().toISOString().slice(0, 10)}.pdf`,
          url,
        })
      } catch {
        adicionar("aura", MENSAGEM_ERRO_GENERICO)
      } finally {
        setAProcessar(false)
      }
      return
    }

    if (acao.tipo === "criar_alerta") {
      if (!user) return
      setAProcessar(true)
      try {
        await criarAlerta({ tonerId: acao.tonerId, limite: acao.limite, criadoPor: user.id })
        await queryClient.invalidateQueries({ queryKey: ["aura-alertas"] })
        adicionar(
          "aura",
          `Alerta ativo. Vais ver um aviso no sino de notificações quando o **${acao.tonerLabel}** chegar a **${acao.limite}** unidade(s) ou menos.`
        )
      } catch {
        adicionar("aura", MENSAGEM_ERRO_GENERICO)
      } finally {
        setAProcessar(false)
      }
    }
  }

  function submit(texto: string) {
    const limpo = texto.trim()
    if (!limpo || aProcessar) return
    adicionar("user", limpo)
    setInput("")

    const resultado = processarMensagem(limpo, estado, {
      toners: toners ?? [],
      pedidos: pedidos ?? [],
      tickets: tickets ?? [],
      empresas: empresas ?? [],
      movimentosDoacao: movimentosDoacao ?? [],
    })
    setEstado(resultado.estado)
    adicionar("aura", resultado.resposta)

    if (resultado.executar) {
      void executarAcao(resultado.executar)
    }
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
                Assistente
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

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6">
          <div className="flex flex-col gap-4">
            {mensagens.map((m) => (
              <div
                key={m.id}
                className={cn("animate-slide-up", m.autor === "user" && "flex justify-end")}
              >
                {m.autor === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                    {m.texto}
                  </div>
                ) : (
                  <div className="max-w-full">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                      {renderComNegrito(m.texto)}
                    </p>
                    {m.anexo && (
                      <a
                        href={m.anexo.url}
                        download={m.anexo.nome}
                        className="mt-2 flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs transition hover:border-primary/20 hover:shadow-[var(--shadow-elegant)]"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileDown className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-foreground">
                            {m.anexo.nome}
                          </span>
                          <span className="text-muted-foreground">Descarregar ficheiro</span>
                        </span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}

            {aProcessar && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="animate-shimmer-dot size-1.5 rounded-full bg-primary/40" />
                <span
                  className="animate-shimmer-dot size-1.5 rounded-full bg-primary/40"
                  style={{ animationDelay: "200ms" }}
                />
                <span
                  className="animate-shimmer-dot size-1.5 rounded-full bg-primary/40"
                  style={{ animationDelay: "400ms" }}
                />
              </div>
            )}
          </div>

          {mensagens.length <= 1 && (
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
          )}
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
              disabled={!input.trim() || aProcessar}
              className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowUp className="size-4" strokeWidth={2.5} />
            </button>
          </form>
          <p className="mt-2 px-1 text-[10px] italic text-muted-foreground/70">
            A Aura trabalha melhor com perguntas diretas sobre stocks, pedidos e tickets.
          </p>
          <p className="mt-0.5 px-1 text-[10px] text-muted-foreground/50">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </aside>
    </>
  )
}

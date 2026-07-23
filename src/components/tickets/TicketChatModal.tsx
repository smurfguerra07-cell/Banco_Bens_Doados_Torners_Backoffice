import { type ChangeEvent, type FormEvent, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ImagePlus, Mic, Send, Square, User, X, XCircle } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useAlterarEstadoTicket, useEnviarMensagem, useMensagens } from "@/hooks/useTickets"
import { uploadAnexoTicket } from "@/services/tickets"
import { TICKET_CATEGORIA_LABEL, TICKET_ESTADO_LABEL, type Ticket, type TicketEstado } from "@/types/ticket"
import { cn } from "@/lib/utils"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"

const ESTADO_BADGE: Record<TicketEstado, string> = {
  aberto: "bg-primary/10 text-primary",
  em_espera: "bg-amber-500/10 text-amber-600",
  fechado: "bg-muted text-muted-foreground",
}

export function TicketChatModal({ ticket, onClose }: { ticket: Ticket | null; onClose: () => void }) {
  const { user } = useAuth()
  const { data: mensagens } = useMensagens(ticket?.id)
  const enviar = useEnviarMensagem(ticket?.id, user?.id)
  const alterarEstado = useAlterarEstadoTicket()
  const [texto, setTexto] = useState("")
  const [aEnviarAnexo, setAEnviarAnexo] = useState(false)
  const [gravando, setGravando] = useState(false)
  const inputFileRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  useBodyScrollLock(Boolean(ticket))

  function handleEnviarTexto(e: FormEvent) {
    e.preventDefault()
    if (!texto.trim() || !ticket) return
    enviar.mutate({ conteudo: texto.trim() })
    setTexto("")
  }

  async function handleEscolherImagem(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !ticket) return
    setAEnviarAnexo(true)
    try {
      const url = await uploadAnexoTicket(ticket.id, file, file.name)
      enviar.mutate({ anexoUrl: url, anexoTipo: "imagem" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar a imagem.")
    } finally {
      setAEnviarAnexo(false)
      if (inputFileRef.current) inputFileRef.current.value = ""
    }
  }

  async function iniciarGravacao() {
    if (!ticket) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAEnviarAnexo(true)
        try {
          const url = await uploadAnexoTicket(ticket.id, blob, "audio.webm")
          enviar.mutate({ anexoUrl: url, anexoTipo: "audio" })
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Não foi possível enviar o áudio.")
        } finally {
          setAEnviarAnexo(false)
        }
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setGravando(true)
    } catch {
      toast.error("Não foi possível aceder ao microfone.")
    }
  }

  function pararGravacao() {
    mediaRecorderRef.current?.stop()
    setGravando(false)
  }

  function fecharTicket() {
    if (!ticket) return
    alterarEstado.mutate({ id: ticket.id, estado: "fechado" })
  }

  function reabrirTicket() {
    if (!ticket) return
    alterarEstado.mutate({ id: ticket.id, estado: "aberto" })
  }

  return createPortal(
    <AnimatePresence>
      {ticket && (
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
            className="relative flex h-[34rem] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    #{ticket.numero} — {ticket.assunto}
                  </h2>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      ESTADO_BADGE[ticket.estado]
                    )}
                  >
                    {TICKET_ESTADO_LABEL[ticket.estado]}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="size-3.5" />
                    {ticket.profiles?.full_name ?? "—"}
                  </span>
                  <span>{TICKET_CATEGORIA_LABEL[ticket.categoria]}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/70"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-3">
              <div className="flex flex-col gap-2.5">
                {mensagens?.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Ainda sem mensagens neste ticket.
                  </p>
                )}
                {mensagens?.map((msg) => {
                  const daEquipa = msg.autor_id !== ticket.profile_id
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex", daEquipa ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                          daEquipa ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        )}
                      >
                        {msg.conteudo && <p className="whitespace-pre-wrap">{msg.conteudo}</p>}
                        {msg.anexo_tipo === "imagem" && msg.anexo_url && (
                          <img
                            src={msg.anexo_url}
                            alt="Anexo"
                            className="mt-1 max-h-48 rounded-lg object-cover"
                          />
                        )}
                        {msg.anexo_tipo === "audio" && msg.anexo_url && (
                          <audio controls src={msg.anexo_url} className="mt-1 h-9 max-w-full" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <form
              onSubmit={handleEnviarTexto}
              className="flex items-center gap-1.5 border-t border-border px-6 py-3"
            >
              <input
                ref={inputFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleEscolherImagem}
              />
              <button
                type="button"
                onClick={() => inputFileRef.current?.click()}
                disabled={aEnviarAnexo || gravando || ticket.estado === "fechado"}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted disabled:opacity-50"
                aria-label="Anexar imagem"
              >
                <ImagePlus className="size-[18px]" />
              </button>
              <button
                type="button"
                onClick={gravando ? pararGravacao : iniciarGravacao}
                disabled={aEnviarAnexo || ticket.estado === "fechado"}
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full transition disabled:opacity-50",
                  gravando ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
                aria-label={gravando ? "Parar gravação" : "Gravar áudio"}
              >
                {gravando ? <Square className="size-4" /> : <Mic className="size-[18px]" />}
              </button>
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={
                  ticket.estado === "fechado" ? "Ticket fechado" : "Escreve uma resposta..."
                }
                disabled={gravando || ticket.estado === "fechado"}
                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!texto.trim() || enviar.isPending || ticket.estado === "fechado"}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                aria-label="Enviar"
              >
                <Send className="size-4" />
              </button>
            </form>

            <div className="flex justify-end gap-2 border-t border-border px-6 py-3">
              {ticket.estado === "fechado" ? (
                <button
                  onClick={reabrirTicket}
                  disabled={alterarEstado.isPending}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
                >
                  Reabrir ticket
                </button>
              ) : (
                <button
                  onClick={fecharTicket}
                  disabled={alterarEstado.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-secondary/30 px-3 py-1.5 text-xs font-medium text-secondary transition hover:bg-secondary/10 disabled:opacity-60"
                >
                  <XCircle className="size-3.5" />
                  Fechar ticket
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

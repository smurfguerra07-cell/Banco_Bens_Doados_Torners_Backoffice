import { useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Download, PackageCheck, X } from "lucide-react"
import toast from "react-hot-toast"
import { useAprovarPedidoComEntrega, usePedidos } from "@/hooks/usePedidos"
import type { Pedido } from "@/types/pedido"
import { cn } from "@/lib/utils"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"
import { gerarGuiaEntregaPdf } from "@/lib/guiaEntrega"

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

function chaveData(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function inicioDoDia(d: Date) {
  const novo = new Date(d)
  novo.setHours(0, 0, 0, 0)
  return novo
}

export function AgendarEntregaModal({
  pedido,
  onClose,
}: {
  pedido: Pedido | null
  onClose: () => void
}) {
  const { data: pedidos } = usePedidos()
  const aprovar = useAprovarPedidoComEntrega()
  const [mesAtual, setMesAtual] = useState(() => new Date())
  const [dataEscolhida, setDataEscolhida] = useState<string | null>(null)
  const [aGerarPdf, setAGerarPdf] = useState(false)
  useBodyScrollLock(Boolean(pedido))

  const eventosPorDia = useMemo(() => {
    const mapa = new Map<string, number>()
    pedidos?.forEach((p) => {
      if (p.data_entrega && p.estado !== "cancelado" && p.id !== pedido?.id) {
        mapa.set(p.data_entrega, (mapa.get(p.data_entrega) ?? 0) + 1)
      }
    })
    return mapa
  }, [pedidos, pedido?.id])

  const dias = useMemo(() => {
    const primeiro = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1)
    const offset = (primeiro.getDay() + 6) % 7
    const inicioGrelha = new Date(primeiro)
    inicioGrelha.setDate(primeiro.getDate() - offset)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicioGrelha)
      d.setDate(inicioGrelha.getDate() + i)
      return d
    })
  }, [mesAtual])

  function fecharTudo() {
    setDataEscolhida(null)
    setMesAtual(new Date())
    onClose()
  }

  function escolherDia(dia: Date) {
    if (!pedido) return
    if (inicioDoDia(dia) < inicioDoDia(new Date())) return
    const chave = chaveData(dia)
    aprovar.mutate(
      { id: pedido.id, dataEntrega: chave },
      {
        onSuccess: () => setDataEscolhida(chave),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Não foi possível agendar a entrega."),
      }
    )
  }

  async function descarregarGuia() {
    if (!pedido || !dataEscolhida) return
    setAGerarPdf(true)
    try {
      await gerarGuiaEntregaPdf(pedido, dataEscolhida)
    } catch {
      toast.error("Não foi possível gerar a guia.")
    } finally {
      setAGerarPdf(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      {pedido && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
          onClick={fecharTudo}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">
                {dataEscolhida ? "Guia de entrega" : `Agendar entrega — Pedido #${pedido.numero}`}
              </h2>
              <button
                type="button"
                onClick={fecharTudo}
                aria-label="Fechar"
                className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/70"
              >
                <X className="size-4" />
              </button>
            </div>

            {!dataEscolhida && (
              <div className="px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Seleciona o dia em que a entrega deste pedido vai ser feita.
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setMesAtual((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                    className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <p className="text-sm font-semibold capitalize text-foreground">
                    {mesAtual.toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}
                  </p>
                  <button
                    type="button"
                    onClick={() => setMesAtual((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                    className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
                    aria-label="Mês seguinte"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
                  {DIAS_SEMANA.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>

                <div className="mt-1 grid grid-cols-7 gap-1">
                  {dias.map((dia) => {
                    const chave = chaveData(dia)
                    const foraDoMes = dia.getMonth() !== mesAtual.getMonth()
                    const passado = inicioDoDia(dia) < inicioDoDia(new Date())
                    const numEventos = eventosPorDia.get(chave) ?? 0

                    return (
                      <button
                        key={chave}
                        type="button"
                        disabled={passado || aprovar.isPending}
                        onClick={() => escolherDia(dia)}
                        className={cn(
                          "relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs text-foreground transition",
                          foraDoMes && "text-muted-foreground/40",
                          passado ? "cursor-not-allowed opacity-40" : "hover:bg-primary/10"
                        )}
                      >
                        {dia.getDate()}
                        {numEventos > 0 && (
                          <span className="absolute bottom-1 flex gap-0.5">
                            {Array.from({ length: Math.min(numEventos, 3) }).map((_, i) => (
                              <span key={i} className="size-1 rounded-full bg-secondary" />
                            ))}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-secondary" />
                  Dias com outras entregas já agendadas
                </p>
              </div>
            )}

            {dataEscolhida && (
              <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <PackageCheck className="size-6" />
                </span>
                <p className="text-sm text-foreground">
                  Pedido aprovado. Entrega agendada para{" "}
                  <span className="font-semibold">
                    {new Date(`${dataEscolhida}T00:00:00`).toLocaleDateString("pt-PT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  .
                </p>
                <button
                  type="button"
                  onClick={descarregarGuia}
                  disabled={aGerarPdf}
                  className="mt-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  <Download className="size-4" />
                  {aGerarPdf ? "A gerar..." : "Descarregar guia"}
                </button>
                <button
                  type="button"
                  onClick={fecharTudo}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Fechar
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

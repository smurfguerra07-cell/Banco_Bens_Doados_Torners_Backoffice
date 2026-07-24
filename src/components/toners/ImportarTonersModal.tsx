import { type ChangeEvent, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, FileUp, Sparkles, X } from "lucide-react"
import toast from "react-hot-toast"
import {
  CAMPO_LABEL,
  CAMPOS_OBRIGATORIOS,
  type CampoToner,
  type FicheiroParsed,
  normalizarLinhas,
  parseFicheiro,
  sugerirMapeamento,
  type TonerImportado,
} from "@/lib/importToners"
import { useImportarToners, useToners } from "@/hooks/useToners"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"
import { cn } from "@/lib/utils"

const CAMPOS_TODOS: CampoToner[] = [
  "marca",
  "modelo",
  "referencia",
  "quantidade",
  "estado",
  "categoria",
  "cor",
  "localizacao",
  "compatibilidade",
]

type Passo = "upload" | "mapear" | "confirmar"

export function ImportarTonersModal({
  aberto,
  onClose,
}: {
  aberto: boolean
  onClose: () => void
}) {
  const { data: toners } = useToners()
  const importar = useImportarToners()
  const [passo, setPasso] = useState<Passo>("upload")
  const [ficheiro, setFicheiro] = useState<FicheiroParsed | null>(null)
  const [nomeFicheiro, setNomeFicheiro] = useState("")
  const [mapeamento, setMapeamento] = useState<Partial<Record<CampoToner, string>>>({})
  const [aProcessar, setAProcessar] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useBodyScrollLock(aberto)

  const compatibilidadeConhecida = useMemo(() => {
    const mapa = new Map<string, string[]>()
    toners?.forEach((t) => {
      if (t.compatibilidade.length > 0) {
        mapa.set(t.referencia.toLowerCase(), t.compatibilidade)
      }
    })
    return mapa
  }, [toners])

  const itensProcessados = useMemo<TonerImportado[]>(() => {
    if (passo !== "confirmar" || !ficheiro) return []
    return normalizarLinhas(ficheiro.linhas, mapeamento, compatibilidadeConhecida)
  }, [passo, ficheiro, mapeamento, compatibilidadeConhecida])

  const validos = itensProcessados.filter((i) => i.valido)
  const invalidos = itensProcessados.filter((i) => !i.valido)
  const comCompatibilidadeAutomatica = itensProcessados.filter(
    (i) => i.compatibilidadeAutomatica
  ).length

  function reset() {
    setPasso("upload")
    setFicheiro(null)
    setNomeFicheiro("")
    setMapeamento({})
    if (inputRef.current) inputRef.current.value = ""
  }

  function fechar() {
    reset()
    onClose()
  }

  async function handleEscolherFicheiro(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAProcessar(true)
    setNomeFicheiro(file.name)
    try {
      const resultado = await parseFicheiro(file)
      if (resultado.linhas.length === 0) {
        toast.error("Não foi possível encontrar linhas neste ficheiro.")
        return
      }
      setFicheiro(resultado)
      setMapeamento(sugerirMapeamento(resultado.headers))
      setPasso("mapear")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível ler o ficheiro.")
    } finally {
      setAProcessar(false)
    }
  }

  function avancarParaConfirmar() {
    const emFalta = CAMPOS_OBRIGATORIOS.filter((c) => !mapeamento[c])
    if (emFalta.length > 0) {
      toast.error(
        `Associa as colunas obrigatórias: ${emFalta.map((c) => CAMPO_LABEL[c]).join(", ")}`
      )
      return
    }
    setPasso("confirmar")
  }

  function handleImportar() {
    importar.mutate(validos, { onSuccess: fechar })
  }

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
          onClick={fechar}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Importar toners</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Ficheiro CSV ou Excel — marca, modelo, referência e quantidade obrigatórios.
                </p>
              </div>
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar"
                className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/70"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {passo === "upload" && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border py-16 text-center">
                  <FileUp className="size-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Escolhe um ficheiro .csv, .xlsx ou .xls com a lista de toners.
                  </p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleEscolherFicheiro}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={aProcessar}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    {aProcessar ? "A ler ficheiro..." : "Escolher ficheiro"}
                  </button>
                </div>
              )}

              {passo === "mapear" && ficheiro && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{nomeFicheiro}</span> —{" "}
                    {ficheiro.linhas.length} linha(s) encontrada(s). Associa cada campo à coluna
                    correspondente no ficheiro (os campos foram sugeridos automaticamente).
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {CAMPOS_TODOS.map((campo) => (
                      <label key={campo} className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-foreground">
                          {CAMPO_LABEL[campo]}
                          {CAMPOS_OBRIGATORIOS.includes(campo) && " *"}
                        </span>
                        <select
                          value={mapeamento[campo] ?? ""}
                          onChange={(e) =>
                            setMapeamento((m) => ({
                              ...m,
                              [campo]: e.target.value || undefined,
                            }))
                          }
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                        >
                          <option value="">— Não importar —</option>
                          {ficheiro.headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={reset}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                    >
                      Escolher outro ficheiro
                    </button>
                    <button
                      type="button"
                      onClick={avancarParaConfirmar}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              )}

              {passo === "confirmar" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 font-medium text-primary">
                      <CheckCircle2 className="size-3.5" />
                      {validos.length} pronto(s) a importar
                    </span>
                    {invalidos.length > 0 && (
                      <span className="flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1.5 font-medium text-secondary">
                        <AlertTriangle className="size-3.5" />
                        {invalidos.length} com erro (ignorado(s))
                      </span>
                    )}
                    {comCompatibilidadeAutomatica > 0 && (
                      <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 font-medium text-amber-600">
                        <Sparkles className="size-3.5" />
                        {comCompatibilidadeAutomatica} com compatibilidade preenchida
                        automaticamente
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Referências já existentes no catálogo somam a quantidade importada ao stock
                    atual; as novas são criadas.
                  </p>

                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-xs">
                      <thead className="border-b border-border bg-muted/40 text-left uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium">Toner</th>
                          <th className="px-3 py-2 font-medium">Referência</th>
                          <th className="px-3 py-2 font-medium">Qtd.</th>
                          <th className="px-3 py-2 font-medium">Compatibilidade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {itensProcessados.map((item, i) => (
                          <tr
                            key={i}
                            className={cn(!item.valido && "bg-secondary/5 text-muted-foreground")}
                          >
                            <td className="px-3 py-2">
                              {item.valido ? (
                                `${item.marca} ${item.modelo}`
                              ) : (
                                <span className="flex items-center gap-1.5 text-secondary">
                                  <AlertTriangle className="size-3.5 shrink-0" />
                                  {item.erro}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {item.referencia || "—"}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {item.quantidade || "—"}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {item.compatibilidade.length > 0 ? (
                                <span className="flex items-center gap-1">
                                  {item.compatibilidade.slice(0, 2).join(", ")}
                                  {item.compatibilidade.length > 2 && "..."}
                                  {item.compatibilidadeAutomatica && (
                                    <Sparkles className="size-3 shrink-0 text-amber-500" />
                                  )}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPasso("mapear")}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleImportar}
                      disabled={validos.length === 0 || importar.isPending}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                    >
                      {importar.isPending
                        ? "A importar..."
                        : `Importar ${validos.length} toner(s)`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

import { useMemo, useState } from "react"
import { FileDown, FileText } from "lucide-react"
import { useToners } from "@/hooks/useToners"
import { usePedidos } from "@/hooks/usePedidos"
import { useEmpresas } from "@/hooks/useEmpresas"
import { exportarCsv, exportarPdf, type ColunaExport } from "@/lib/export"
import { TONER_ESTADO_LABEL } from "@/types/toner"
import { PEDIDO_ESTADO_LABEL } from "@/types/pedido"
import { EMPRESA_TIPO_LABEL } from "@/types/empresa"
import { cn } from "@/lib/utils"

type Linha = Record<string, string | number>

type TipoRelatorio =
  | "inventario"
  | "disponiveis"
  | "pedidos"
  | "empresas"
  | "mais_requisitados"

const RELATORIOS: { id: TipoRelatorio; titulo: string }[] = [
  { id: "inventario", titulo: "Inventário completo" },
  { id: "disponiveis", titulo: "Toners disponíveis" },
  { id: "pedidos", titulo: "Pedidos por período" },
  { id: "empresas", titulo: "Empresas" },
  { id: "mais_requisitados", titulo: "Produtos mais requisitados" },
]

export function RelatoriosPage() {
  const { data: toners } = useToners()
  const { data: pedidos } = usePedidos()
  const { data: empresas } = useEmpresas()

  const [tipo, setTipo] = useState<TipoRelatorio>("inventario")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  const pedidosFiltrados = useMemo(() => {
    if (!pedidos) return []
    return pedidos.filter((p) => {
      const data = p.created_at.slice(0, 10)
      if (dataInicio && data < dataInicio) return false
      if (dataFim && data > dataFim) return false
      return true
    })
  }, [pedidos, dataInicio, dataFim])

  const { linhas, colunas, titulo } = useMemo(() => {
    switch (tipo) {
      case "inventario": {
        const dados = (toners ?? []).map((t) => ({
          marca: t.marca,
          modelo: t.modelo,
          referencia: t.referencia,
          estado: TONER_ESTADO_LABEL[t.estado],
          quantidade: t.quantidade,
          reservado: t.quantidade_reservada,
          localizacao: t.localizacao ?? "",
          visivel: t.ativo ? "Sim" : "Não",
        }))
        const cols: ColunaExport<Linha>[] = [
          { chave: "marca", titulo: "Marca" },
          { chave: "modelo", titulo: "Modelo" },
          { chave: "referencia", titulo: "Referência" },
          { chave: "estado", titulo: "Estado" },
          { chave: "quantidade", titulo: "Quantidade" },
          { chave: "reservado", titulo: "Reservado" },
          { chave: "localizacao", titulo: "Localização" },
          { chave: "visivel", titulo: "Visível" },
        ]
        return { linhas: dados as Linha[], colunas: cols, titulo: "Inventário completo" }
      }

      case "disponiveis": {
        const dados = (toners ?? [])
          .filter((t) => t.ativo && t.quantidade - t.quantidade_reservada > 0)
          .map((t) => ({
            marca: t.marca,
            modelo: t.modelo,
            referencia: t.referencia,
            estado: TONER_ESTADO_LABEL[t.estado],
            disponivel: t.quantidade - t.quantidade_reservada,
            localizacao: t.localizacao ?? "",
          }))
        const cols: ColunaExport<Linha>[] = [
          { chave: "marca", titulo: "Marca" },
          { chave: "modelo", titulo: "Modelo" },
          { chave: "referencia", titulo: "Referência" },
          { chave: "estado", titulo: "Estado" },
          { chave: "disponivel", titulo: "Disponível" },
          { chave: "localizacao", titulo: "Localização" },
        ]
        return { linhas: dados as Linha[], colunas: cols, titulo: "Toners disponíveis" }
      }

      case "pedidos": {
        const dados = pedidosFiltrados.map((p) => ({
          numero: p.numero,
          empresa: p.empresas?.nome ?? "",
          solicitante: p.profiles?.full_name ?? "",
          estado: PEDIDO_ESTADO_LABEL[p.estado],
          itens: p.pedido_itens.reduce((s, i) => s + i.quantidade, 0),
          data: new Date(p.created_at).toLocaleDateString("pt-PT"),
        }))
        const cols: ColunaExport<Linha>[] = [
          { chave: "numero", titulo: "Nº Pedido" },
          { chave: "empresa", titulo: "Empresa" },
          { chave: "solicitante", titulo: "Solicitante" },
          { chave: "estado", titulo: "Estado" },
          { chave: "itens", titulo: "Total de itens" },
          { chave: "data", titulo: "Data" },
        ]
        return { linhas: dados as Linha[], colunas: cols, titulo: "Pedidos por período" }
      }

      case "empresas": {
        const dados = (empresas ?? []).map((e) => ({
          nome: e.nome,
          tipo: EMPRESA_TIPO_LABEL[e.tipo],
          nif: e.nif ?? "",
          cidade: e.cidade ?? "",
          email: e.email ?? "",
          ativo: e.ativo ? "Sim" : "Não",
        }))
        const cols: ColunaExport<Linha>[] = [
          { chave: "nome", titulo: "Nome" },
          { chave: "tipo", titulo: "Tipo" },
          { chave: "nif", titulo: "NIF" },
          { chave: "cidade", titulo: "Cidade" },
          { chave: "email", titulo: "Email" },
          { chave: "ativo", titulo: "Ativa" },
        ]
        return { linhas: dados as Linha[], colunas: cols, titulo: "Empresas" }
      }

      case "mais_requisitados": {
        const contagem = new Map<string, { marca: string; modelo: string; total: number }>()
        for (const pedido of pedidosFiltrados) {
          for (const item of pedido.pedido_itens) {
            if (!item.toners) continue
            const atual = contagem.get(item.toner_id)
            if (atual) atual.total += item.quantidade
            else
              contagem.set(item.toner_id, {
                marca: item.toners.marca,
                modelo: item.toners.modelo,
                total: item.quantidade,
              })
          }
        }
        const dados = Array.from(contagem.values()).sort((a, b) => b.total - a.total)
        const cols: ColunaExport<Linha>[] = [
          { chave: "marca", titulo: "Marca" },
          { chave: "modelo", titulo: "Modelo" },
          { chave: "total", titulo: "Total requisitado" },
        ]
        return { linhas: dados as Linha[], colunas: cols, titulo: "Produtos mais requisitados" }
      }
    }
  }, [tipo, toners, empresas, pedidosFiltrados])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Relatórios</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Exporta dados da plataforma em CSV (abre em Excel) ou PDF.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {RELATORIOS.map((r) => (
          <button
            key={r.id}
            onClick={() => setTipo(r.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              tipo === r.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {r.titulo}
          </button>
        ))}
      </div>

      {tipo === "pedidos" || tipo === "mais_requisitados" ? (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">De</span>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Até</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none"
            />
          </label>
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {linhas.length} resultado(s)
        </p>
        <div className="flex gap-2">
          <button
            onClick={() =>
              exportarCsv(linhas, colunas, `${titulo.toLowerCase().replace(/\s+/g, "-")}`)
            }
            disabled={linhas.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            <FileDown className="size-3.5" />
            CSV / Excel
          </button>
          <button
            onClick={() =>
              exportarPdf(
                linhas,
                colunas,
                `${titulo.toLowerCase().replace(/\s+/g, "-")}`,
                titulo
              )
            }
            disabled={linhas.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            <FileText className="size-3.5" />
            PDF
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {colunas.map((c) => (
                <th key={String(c.chave)} className="whitespace-nowrap px-4 py-3 font-medium">
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {linhas.length === 0 && (
              <tr>
                <td colSpan={colunas.length} className="px-4 py-8 text-center text-muted-foreground">
                  Sem dados para mostrar.
                </td>
              </tr>
            )}
            {linhas.slice(0, 50).map((linha, i) => (
              <tr key={i} className="hover:bg-muted/30">
                {colunas.map((c) => (
                  <td key={String(c.chave)} className="whitespace-nowrap px-4 py-2.5 text-foreground">
                    {String((linha as Record<string, unknown>)[c.chave as string] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {linhas.length > 50 && (
          <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
            A mostrar 50 de {linhas.length} — exporta para ver tudo.
          </p>
        )}
      </div>
    </div>
  )
}

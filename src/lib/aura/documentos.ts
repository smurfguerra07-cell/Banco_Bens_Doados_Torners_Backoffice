// Geração de documentos operacionais em PDF (ficha de doação, etiqueta
// de toner, briefing diário) — construídos localmente com jsPDF, sem
// nenhum serviço externo.

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PEDIDO_ESTADO_LABEL } from "@/types/pedido"
import type { Pedido } from "@/types/pedido"
import { TICKET_CATEGORIA_LABEL } from "@/types/ticket"
import type { Ticket } from "@/types/ticket"
import type { Toner } from "@/types/toner"

export function gerarFichaDoacaoPdf(params: {
  tonerLabel: string
  quantidade: number
  condicao: string
  empresaNome: string | null
  data: string
}): Blob {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text("Ficha de Doação", 14, 20)
  doc.setFontSize(10)
  doc.text("Banco de Bens Doados", 14, 27)
  doc.setDrawColor(200)
  doc.line(14, 32, 196, 32)

  let y = 46
  const linha = (rotulo: string, valor: string) => {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`${rotulo}:`, 14, y)
    doc.setFont("helvetica", "normal")
    doc.text(valor, 60, y)
    y += 10
  }
  linha("Doador", params.empresaNome ?? "Não associado")
  linha("Toner", params.tonerLabel)
  linha("Quantidade", `${params.quantidade} unidade(s)`)
  linha("Condição", params.condicao)
  linha("Data", new Date(params.data).toLocaleDateString("pt-PT"))

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("Obrigado pelo contributo para a reutilização de material de impressão.", 14, y + 15)

  return doc.output("blob")
}

export function gerarEtiquetaTonerPdf(toner: {
  marca: string
  modelo: string
  referencia: string
  localizacao: string | null
}): Blob {
  const doc = new jsPDF({ unit: "mm", format: [90, 50] })
  doc.setFontSize(13)
  doc.text(`${toner.marca} ${toner.modelo}`, 5, 12, { maxWidth: 80 })
  doc.setFontSize(10)
  doc.text(`Ref: ${toner.referencia}`, 5, 24)
  if (toner.localizacao) doc.text(`Local: ${toner.localizacao}`, 5, 32)
  doc.setFontSize(7)
  doc.text("Banco de Bens Doados", 5, 45)
  return doc.output("blob")
}

export function gerarBriefingDiarioPdf(params: { toners: Toner[]; pedidos: Pedido[]; tickets: Ticket[] }): Blob {
  const doc = new jsPDF()
  const hoje = new Date().toLocaleDateString("pt-PT")

  function cabecalho(subtitulo: string) {
    doc.setFontSize(16)
    doc.text("Briefing Diário", 14, 16)
    doc.setFontSize(9)
    doc.text(`Banco de Bens Doados · ${hoje}`, 14, 22)
    doc.setFontSize(12)
    doc.text(subtitulo, 14, 32)
  }

  const criticos = params.toners.filter((t) => t.ativo && t.quantidade - t.quantidade_reservada <= 3)
  cabecalho(`Stock crítico (${criticos.length})`)
  autoTable(doc, {
    startY: 38,
    head: [["Marca", "Modelo", "Referência", "Stock"]],
    body:
      criticos.length > 0
        ? criticos.map((t) => [t.marca, t.modelo, t.referencia, String(t.quantidade - t.quantidade_reservada)])
        : [["—", "Sem toners em stock crítico", "", ""]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 75, 143] },
  })

  doc.addPage()
  const pendentes = params.pedidos.filter((p) => p.estado === "recebido" || p.estado === "em_analise")
  cabecalho(`Pedidos pendentes (${pendentes.length})`)
  autoTable(doc, {
    startY: 38,
    head: [["Nº", "Empresa", "Estado", "Data"]],
    body:
      pendentes.length > 0
        ? pendentes.map((p) => [
            String(p.numero),
            p.empresas?.nome ?? "—",
            PEDIDO_ESTADO_LABEL[p.estado],
            new Date(p.created_at).toLocaleDateString("pt-PT"),
          ])
        : [["—", "Sem pedidos pendentes", "", ""]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 75, 143] },
  })

  doc.addPage()
  const abertos = params.tickets.filter((t) => t.estado === "aberto")
  cabecalho(`Tickets abertos (${abertos.length})`)
  autoTable(doc, {
    startY: 38,
    head: [["Nº", "Assunto", "Cliente", "Categoria"]],
    body:
      abertos.length > 0
        ? abertos.map((t) => [
            String(t.numero),
            t.assunto,
            t.profiles?.full_name ?? "—",
            TICKET_CATEGORIA_LABEL[t.categoria],
          ])
        : [["—", "Sem tickets abertos", "", ""]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 75, 143] },
  })

  return doc.output("blob")
}

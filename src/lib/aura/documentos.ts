// Geração de documentos operacionais em PDF (ficha de doação, etiqueta
// de toner, briefing diário) — construídos localmente com jsPDF, sem
// nenhum serviço externo.

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { COR_MUTED, COR_NAVY, COR_RED, desenharCabecalho, desenharRodape, ESTILO_TABELA } from "@/lib/pdfBranding"
import { PEDIDO_ESTADO_LABEL } from "@/types/pedido"
import type { Pedido } from "@/types/pedido"
import { TICKET_CATEGORIA_LABEL } from "@/types/ticket"
import type { Ticket } from "@/types/ticket"
import type { Toner } from "@/types/toner"

export async function gerarFichaDoacaoPdf(params: {
  tonerLabel: string
  quantidade: number
  condicao: string
  empresaNome: string | null
  data: string
}): Promise<Blob> {
  const doc = new jsPDF()
  let y = await desenharCabecalho(
    doc,
    "Ficha de Doação",
    "Comprovativo de entrada de material doado para reutilização."
  )
  y += 6

  const linha = (rotulo: string, valor: string) => {
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...COR_NAVY)
    doc.text(`${rotulo}`, 14, y)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(30, 30, 30)
    doc.text(valor, 60, y)
    y += 10
  }
  doc.setDrawColor(230)
  doc.setLineWidth(0.3)
  doc.line(14, y - 5, 196, y - 5)
  y += 4

  linha("Doador", params.empresaNome ?? "Não associado")
  linha("Toner", params.tonerLabel)
  linha("Quantidade", `${params.quantidade} unidade(s)`)
  linha("Condição", params.condicao)
  linha("Data", new Date(params.data).toLocaleDateString("pt-PT"))

  doc.setDrawColor(230)
  doc.line(14, y - 4, 196, y - 4)

  doc.setFontSize(9)
  doc.setFont("helvetica", "italic")
  doc.setTextColor(...COR_MUTED)
  doc.text("Obrigado pelo contributo para a reutilização de material de impressão.", 14, y + 12)

  desenharRodape(doc, 1)
  return doc.output("blob")
}

export async function gerarEtiquetaTonerPdf(toner: {
  marca: string
  modelo: string
  referencia: string
  localizacao: string | null
}): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: [90, 50] })

  doc.setFillColor(...COR_NAVY)
  doc.rect(0, 0, 90, 9, "F")
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text("BANCO DE BENS DOADOS", 5, 6)

  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COR_NAVY)
  doc.text(`${toner.marca} ${toner.modelo}`, 5, 20, { maxWidth: 80 })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text(`Ref: ${toner.referencia}`, 5, 30)
  if (toner.localizacao) doc.text(`Local: ${toner.localizacao}`, 5, 37)

  doc.setDrawColor(...COR_RED)
  doc.setLineWidth(0.8)
  doc.line(5, 43, 85, 43)

  return doc.output("blob")
}

export async function gerarBriefingDiarioPdf(params: {
  toners: Toner[]
  pedidos: Pedido[]
  tickets: Ticket[]
}): Promise<Blob> {
  const doc = new jsPDF()
  const hoje = new Date().toLocaleDateString("pt-PT")

  const criticos = params.toners.filter((t) => t.ativo && t.quantidade - t.quantidade_reservada <= 3)
  let y = await desenharCabecalho(doc, "Briefing Diário", `Resumo operacional de ${hoje}.`)
  doc.setFontSize(12)
  doc.setTextColor(...COR_NAVY)
  doc.text(`Stock crítico (${criticos.length})`, 14, y)
  autoTable(doc, {
    startY: y + 4,
    margin: { left: 14, right: 14 },
    head: [["Marca", "Modelo", "Referência", "Stock"]],
    body:
      criticos.length > 0
        ? criticos.map((t) => [t.marca, t.modelo, t.referencia, String(t.quantidade - t.quantidade_reservada)])
        : [["—", "Sem toners em stock crítico", "", ""]],
    ...ESTILO_TABELA,
    didDrawPage: (data) => desenharRodape(doc, data.pageNumber),
  })

  doc.addPage()
  const pendentes = params.pedidos.filter((p) => p.estado === "recebido" || p.estado === "em_analise")
  y = await desenharCabecalho(doc, "Briefing Diário", `Resumo operacional de ${hoje}.`)
  doc.setFontSize(12)
  doc.setTextColor(...COR_NAVY)
  doc.text(`Pedidos pendentes (${pendentes.length})`, 14, y)
  autoTable(doc, {
    startY: y + 4,
    margin: { left: 14, right: 14 },
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
    ...ESTILO_TABELA,
    didDrawPage: (data) => desenharRodape(doc, data.pageNumber),
  })

  doc.addPage()
  const abertos = params.tickets.filter((t) => t.estado === "aberto")
  y = await desenharCabecalho(doc, "Briefing Diário", `Resumo operacional de ${hoje}.`)
  doc.setFontSize(12)
  doc.setTextColor(...COR_NAVY)
  doc.text(`Tickets abertos (${abertos.length})`, 14, y)
  autoTable(doc, {
    startY: y + 4,
    margin: { left: 14, right: 14 },
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
    ...ESTILO_TABELA,
    didDrawPage: (data) => desenharRodape(doc, data.pageNumber),
  })

  return doc.output("blob")
}

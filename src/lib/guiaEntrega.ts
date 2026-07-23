import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import logoUrl from "@/assets/logo.png"
import type { Pedido } from "@/types/pedido"

async function carregarImagemBase64(url: string): Promise<string> {
  const resposta = await fetch(url)
  const blob = await resposta.blob()
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onloadend = () => resolve(leitor.result as string)
    leitor.onerror = reject
    leitor.readAsDataURL(blob)
  })
}

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export async function gerarGuiaEntregaPdf(pedido: Pedido, dataEntrega: string) {
  const doc = new jsPDF()
  const margemDireita = 196

  try {
    const logoBase64 = await carregarImagemBase64(logoUrl)
    doc.addImage(logoBase64, "PNG", 14, 12, 42, 17)
  } catch {
    // segue sem logo caso o carregamento falhe
  }

  doc.setFontSize(18)
  doc.setTextColor(30, 75, 143)
  doc.text("GUIA DE ENTREGA", margemDireita, 20, { align: "right" })
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text("Banco de Bens Doados · Reutilização de toners", margemDireita, 26, { align: "right" })

  doc.setDrawColor(225)
  doc.line(14, 38, margemDireita, 38)

  const empresa = pedido.empresas
  const solicitante = pedido.profiles

  doc.setFontSize(9)
  doc.setTextColor(130)
  doc.text("ENTREGAR PARA", 14, 47)
  doc.text("DETALHES DO PEDIDO", 115, 47)

  doc.setFontSize(10.5)
  doc.setTextColor(25)
  const linhasEntrega = [
    empresa?.nome ?? "—",
    solicitante?.full_name ? `Ao cuidado de: ${solicitante.full_name}` : null,
    empresa?.morada ?? null,
    [empresa?.codigo_postal, empresa?.cidade].filter(Boolean).join(" "),
    (empresa?.telefone || solicitante?.telefone) &&
      `Tel: ${empresa?.telefone ?? solicitante?.telefone}`,
  ].filter((linha): linha is string => Boolean(linha && linha.trim()))

  let y = 54
  for (const linha of linhasEntrega) {
    doc.text(linha, 14, y)
    y += 6
  }

  let yPedido = 54
  doc.text(`Nº Pedido: #${pedido.numero}`, 115, yPedido)
  yPedido += 6
  doc.text(`Data do pedido: ${new Date(pedido.created_at).toLocaleDateString("pt-PT")}`, 115, yPedido)
  yPedido += 6
  doc.setTextColor(30, 75, 143)
  doc.text(`Data de entrega: ${formatarData(dataEntrega)}`, 115, yPedido)
  doc.setTextColor(25)

  const startY = Math.max(y, yPedido) + 8

  autoTable(doc, {
    startY,
    head: [["Referência", "Toner", "Quantidade"]],
    body: pedido.pedido_itens.map((item) => [
      item.toners?.referencia ?? "—",
      `${item.toners?.marca ?? ""} ${item.toners?.modelo ?? ""}`.trim() || "—",
      String(item.quantidade),
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 75, 143] },
    columnStyles: { 2: { halign: "right", cellWidth: 30 } },
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY

  if (pedido.observacoes) {
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text("Observações:", 14, finalY + 10)
    doc.setTextColor(60)
    doc.text(doc.splitTextToSize(pedido.observacoes, 182), 14, finalY + 16)
  }

  doc.setFontSize(8.5)
  doc.setTextColor(150)
  doc.text(
    "Documento de acompanhamento de doação — material sem qualquer valor comercial.",
    14,
    287
  )

  doc.save(`guia-entrega-pedido-${pedido.numero}.pdf`)
}

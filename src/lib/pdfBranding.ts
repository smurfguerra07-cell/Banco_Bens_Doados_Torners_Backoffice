// Identidade visual partilhada por todos os PDFs gerados na aplicação
// (relatórios, ficha de doação, etiquetas, briefing) — logótipo,
// cores da marca e estilo de tabela consistentes.

import type jsPDF from "jspdf"
import logoUrl from "@/assets/logo.png"

export const COR_NAVY: [number, number, number] = [27, 46, 75]
export const COR_RED: [number, number, number] = [230, 57, 70]
export const COR_MUTED: [number, number, number] = [110, 120, 135]
export const COR_LINHA_ALTERNA: [number, number, number] = [246, 247, 249]

function carregarImagem(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

let logoPromise: Promise<{ dataUrl: string; aspeto: number } | null> | null = null

/** Carrega o logótipo uma única vez (memorizado) e devolve como data URL, pronto para o jsPDF. */
export function carregarLogo(): Promise<{ dataUrl: string; aspeto: number } | null> {
  if (!logoPromise) {
    logoPromise = carregarImagem(logoUrl)
      .then((img) => {
        const canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) return null
        ctx.drawImage(img, 0, 0)
        return { dataUrl: canvas.toDataURL("image/png"), aspeto: img.naturalWidth / img.naturalHeight }
      })
      .catch(() => null)
  }
  return logoPromise
}

/**
 * Desenha o cabeçalho de marca (logótipo, título, subtítulo, descrição
 * e linha divisória) no topo da página atual. Devolve a posição Y a
 * partir de onde o conteúdo seguinte (ex: uma tabela) deve começar.
 */
export async function desenharCabecalho(doc: jsPDF, titulo: string, descricao: string): Promise<number> {
  const logo = await carregarLogo()
  const margem = 14
  let textoX = margem

  if (logo) {
    const altura = 14
    const largura = altura * logo.aspeto
    doc.addImage(logo.dataUrl, "PNG", margem, 10, largura, altura)
    textoX = margem + largura + 6
  }

  doc.setFontSize(16)
  doc.setTextColor(...COR_NAVY)
  doc.text(titulo, textoX, 18)

  doc.setFontSize(9)
  doc.setTextColor(...COR_MUTED)
  doc.text("Banco de Bens Doados", textoX, 24)

  let y = 32
  doc.setDrawColor(...COR_RED)
  doc.setLineWidth(0.6)
  doc.line(margem, y, 196, y)
  y += 7

  doc.setFontSize(9.5)
  doc.setTextColor(70, 70, 70)
  const linhasDescricao = doc.splitTextToSize(descricao, 182)
  doc.text(linhasDescricao, margem, y)
  y += linhasDescricao.length * 4.5 + 4

  doc.setTextColor(0, 0, 0)
  return y
}

/** Escreve o número de página no rodapé — usar no `didDrawPage` do autoTable. */
export function desenharRodape(doc: jsPDF, pageNumber: number) {
  doc.setFontSize(8)
  doc.setTextColor(...COR_MUTED)
  const largura = doc.internal.pageSize.getWidth()
  const altura = doc.internal.pageSize.getHeight()
  doc.text(`Página ${pageNumber}`, largura - 14, altura - 8, { align: "right" })
}

export const ESTILO_TABELA = {
  styles: { fontSize: 9, textColor: [40, 40, 40] as [number, number, number], cellPadding: 3 },
  headStyles: { fillColor: COR_NAVY, textColor: [255, 255, 255] as [number, number, number], fontStyle: "bold" as const },
  alternateRowStyles: { fillColor: COR_LINHA_ALTERNA },
}

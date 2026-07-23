import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export interface ColunaExport<T> {
  chave: keyof T
  titulo: string
}

function valorCelula<T>(linha: T, coluna: ColunaExport<T>): string {
  const valor = linha[coluna.chave]
  if (valor === null || valor === undefined) return ""
  if (Array.isArray(valor)) return valor.join(", ")
  return String(valor)
}

export function exportarCsv<T>(
  dados: T[],
  colunas: ColunaExport<T>[],
  nomeFicheiro: string
) {
  const cabecalho = colunas.map((c) => `"${c.titulo}"`).join(";")
  const linhas = dados.map((linha) =>
    colunas
      .map((c) => `"${valorCelula(linha, c).replace(/"/g, '""')}"`)
      .join(";")
  )
  const conteudo = "﻿" + [cabecalho, ...linhas].join("\r\n")

  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${nomeFicheiro}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportarPdf<T>(
  dados: T[],
  colunas: ColunaExport<T>[],
  nomeFicheiro: string,
  titulo: string
) {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text(titulo, 14, 16)
  doc.setFontSize(9)
  doc.text(`Banco de Bens Doados · gerado em ${new Date().toLocaleString("pt-PT")}`, 14, 22)

  autoTable(doc, {
    startY: 28,
    head: [colunas.map((c) => c.titulo)],
    body: dados.map((linha) => colunas.map((c) => valorCelula(linha, c))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 75, 143] },
  })

  doc.save(`${nomeFicheiro}.pdf`)
}

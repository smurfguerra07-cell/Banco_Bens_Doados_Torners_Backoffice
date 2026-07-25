import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { desenharCabecalho, desenharRodape, ESTILO_TABELA } from "@/lib/pdfBranding"

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

export function criarCsvBlob<T>(dados: T[], colunas: ColunaExport<T>[]): Blob {
  const cabecalho = colunas.map((c) => `"${c.titulo}"`).join(";")
  const linhas = dados.map((linha) =>
    colunas
      .map((c) => `"${valorCelula(linha, c).replace(/"/g, '""')}"`)
      .join(";")
  )
  const conteudo = "﻿" + [cabecalho, ...linhas].join("\r\n")
  return new Blob([conteudo], { type: "text/csv;charset=utf-8;" })
}

export async function criarPdfBlob<T>(
  dados: T[],
  colunas: ColunaExport<T>[],
  titulo: string,
  descricao?: string
): Promise<Blob> {
  const doc = new jsPDF()
  const desc =
    descricao ?? `${dados.length} registo(s) · gerado em ${new Date().toLocaleString("pt-PT")}.`
  const startY = await desenharCabecalho(doc, titulo, desc)

  autoTable(doc, {
    startY,
    margin: { left: 14, right: 14 },
    head: [colunas.map((c) => c.titulo)],
    body: dados.map((linha) => colunas.map((c) => valorCelula(linha, c))),
    ...ESTILO_TABELA,
    didDrawPage: (data) => desenharRodape(doc, data.pageNumber),
  })

  return doc.output("blob")
}

function descarregarBlob(blob: Blob, nomeFicheiro: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nomeFicheiro
  a.click()
  URL.revokeObjectURL(url)
}

export function exportarCsv<T>(
  dados: T[],
  colunas: ColunaExport<T>[],
  nomeFicheiro: string
) {
  descarregarBlob(criarCsvBlob(dados, colunas), `${nomeFicheiro}.csv`)
}

export async function exportarPdf<T>(
  dados: T[],
  colunas: ColunaExport<T>[],
  nomeFicheiro: string,
  titulo: string,
  descricao?: string
) {
  descarregarBlob(await criarPdfBlob(dados, colunas, titulo, descricao), `${nomeFicheiro}.pdf`)
}

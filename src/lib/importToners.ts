import Papa from "papaparse"
import ExcelJS from "exceljs"
import type { TonerEstado } from "@/types/toner"

export type CampoToner =
  | "marca"
  | "modelo"
  | "referencia"
  | "quantidade"
  | "estado"
  | "categoria"
  | "cor"
  | "localizacao"
  | "compatibilidade"

export const CAMPOS_OBRIGATORIOS: CampoToner[] = ["marca", "modelo", "referencia", "quantidade"]

export const CAMPO_LABEL: Record<CampoToner, string> = {
  marca: "Marca",
  modelo: "Modelo",
  referencia: "Referência",
  quantidade: "Quantidade",
  estado: "Estado",
  categoria: "Categoria",
  cor: "Cor",
  localizacao: "Localização",
  compatibilidade: "Compatibilidade",
}

const SINONIMOS: Record<CampoToner, string[]> = {
  marca: ["marca", "brand", "fabricante", "manufacturer"],
  modelo: ["modelo", "model", "nome", "produto", "product", "descricao", "description", "name"],
  referencia: [
    "referencia",
    "ref",
    "sku",
    "codigo",
    "code",
    "partnumber",
    "pn",
    "artigo",
    "reference",
  ],
  quantidade: ["quantidade", "qtd", "qty", "quantity", "stock", "unidades", "units", "qte"],
  estado: ["estado", "condition", "condicao", "state"],
  categoria: ["categoria", "category", "tipo", "type"],
  cor: ["cor", "color", "colour"],
  localizacao: ["localizacao", "location", "armazem", "warehouse", "local"],
  compatibilidade: [
    "compatibilidade",
    "compatibility",
    "compativel",
    "compativeis",
    "compatible",
    "impressoras",
    "printers",
    "printer",
    "modelosimpressora",
  ],
}

export interface FicheiroParsed {
  headers: string[]
  linhas: Record<string, string>[]
}

export interface TonerImportado {
  marca: string
  modelo: string
  referencia: string
  quantidade: number
  estado?: TonerEstado
  categoria?: string
  cor?: string
  localizacao?: string
  compatibilidade: string[]
  compatibilidadeAutomatica: boolean
  valido: boolean
  erro?: string
}

function normalizarTexto(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

export async function parseFicheiro(file: File): Promise<FicheiroParsed> {
  const nome = file.name.toLowerCase()

  if (nome.endsWith(".csv")) {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (resultado) => {
          resolve({
            headers: resultado.meta.fields ?? [],
            linhas: resultado.data,
          })
        },
        error: reject,
      })
    })
  }

  if (nome.endsWith(".xlsx") || nome.endsWith(".xls")) {
    const workbook = new ExcelJS.Workbook()
    const buffer = await file.arrayBuffer()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.worksheets[0]
    if (!sheet) return { headers: [], linhas: [] }

    const headerRow = sheet.getRow(1)
    const headers: string[] = []
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      headers[colNumber - 1] = String(cell.value ?? "").trim()
    })

    const linhas: Record<string, string>[] = []
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const linha: Record<string, string> = {}
      let temValor = false
      headers.forEach((header, i) => {
        if (!header) return
        const valor = row.getCell(i + 1).value
        const texto = valor === null || valor === undefined ? "" : String(valor).trim()
        if (texto) temValor = true
        linha[header] = texto
      })
      if (temValor) linhas.push(linha)
    })

    return { headers: headers.filter(Boolean), linhas }
  }

  throw new Error("Formato não suportado. Usa um ficheiro .csv, .xlsx ou .xls.")
}

export function sugerirMapeamento(headers: string[]): Partial<Record<CampoToner, string>> {
  const mapa: Partial<Record<CampoToner, string>> = {}
  for (const campo of Object.keys(SINONIMOS) as CampoToner[]) {
    const sinonimos = SINONIMOS[campo]
    const header = headers.find((h) => sinonimos.includes(normalizarTexto(h)))
    if (header) mapa[campo] = header
  }
  return mapa
}

function normalizarEstado(valor: string | undefined): TonerEstado | undefined {
  if (!valor) return undefined
  const v = normalizarTexto(valor)
  if (["novo", "new", "novos"].includes(v)) return "novo"
  if (["usado", "used", "usada", "usados"].includes(v)) return "usado"
  if (
    ["reconstruido", "reconstruida", "refurbished", "remanufactured", "remanufaturado"].includes(v)
  )
    return "reconstruido"
  return undefined
}

function separarCompatibilidade(valor: string | undefined): string[] {
  if (!valor) return []
  return valor
    .split(/[,;/|]/)
    .map((v) => v.trim())
    .filter(Boolean)
}

function parseQuantidade(valor: string | undefined): number {
  if (!valor) return 0
  const limpo = String(valor).replace(/[^\d-]/g, "")
  const numero = parseInt(limpo, 10)
  return Number.isFinite(numero) && numero > 0 ? numero : 0
}

/**
 * Constrói os toners prontos a importar a partir das linhas do ficheiro,
 * do mapeamento de colunas escolhido, e do catálogo já existente (para
 * preencher automaticamente a compatibilidade quando a referência já é
 * conhecida e o ficheiro não a trouxer).
 */
export function normalizarLinhas(
  linhas: Record<string, string>[],
  mapeamento: Partial<Record<CampoToner, string>>,
  compatibilidadeConhecida: Map<string, string[]>
): TonerImportado[] {
  return linhas.map((linha) => {
    const val = (campo: CampoToner) => {
      const coluna = mapeamento[campo]
      return coluna ? linha[coluna]?.trim() : undefined
    }

    const marca = val("marca") ?? ""
    const modelo = val("modelo") ?? ""
    const referencia = val("referencia") ?? ""
    const quantidade = parseQuantidade(val("quantidade"))
    const compatibilidadeFicheiro = separarCompatibilidade(val("compatibilidade"))

    let compatibilidade = compatibilidadeFicheiro
    let compatibilidadeAutomatica = false
    if (compatibilidade.length === 0 && referencia) {
      const conhecida = compatibilidadeConhecida.get(referencia.toLowerCase())
      if (conhecida && conhecida.length > 0) {
        compatibilidade = conhecida
        compatibilidadeAutomatica = true
      }
    }

    let erro: string | undefined
    if (!marca) erro = "Falta a marca"
    else if (!modelo) erro = "Falta o modelo"
    else if (!referencia) erro = "Falta a referência"
    else if (quantidade <= 0) erro = "Quantidade inválida"

    return {
      marca,
      modelo,
      referencia,
      quantidade,
      estado: normalizarEstado(val("estado")),
      categoria: val("categoria"),
      cor: val("cor"),
      localizacao: val("localizacao"),
      compatibilidade,
      compatibilidadeAutomatica,
      valido: !erro,
      erro,
    }
  })
}

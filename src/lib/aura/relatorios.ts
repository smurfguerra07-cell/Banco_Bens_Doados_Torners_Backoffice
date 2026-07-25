// Geração de relatórios a partir do pedido em linguagem natural do
// utilizador — deteta o tipo de relatório, o formato e os filtros por
// palavras-chave (sem IA generativa) e reaproveita os mesmos dados que
// a página de Relatórios usa.

import { algumParece, encontrarMarca, tokens } from "./nlu"
import type { ColunaExport } from "@/lib/export"
import type { Empresa } from "@/types/empresa"
import { EMPRESA_TIPO_LABEL } from "@/types/empresa"
import type { Pedido } from "@/types/pedido"
import { PEDIDO_ESTADO_LABEL } from "@/types/pedido"
import type { Toner } from "@/types/toner"
import { TONER_ESTADO_LABEL } from "@/types/toner"

const LIMITE_STOCK_BAIXO = 3

export type TipoRelatorioAura =
  | "inventario"
  | "disponiveis"
  | "critico"
  | "pedidos"
  | "empresas"
  | "mais_requisitados"
  | "impacto"

export const TIPO_RELATORIO_LABEL: Record<TipoRelatorioAura, string> = {
  inventario: "Inventário completo",
  disponiveis: "Toners disponíveis",
  critico: "Stock crítico para compra",
  pedidos: "Pedidos",
  empresas: "Empresas",
  mais_requisitados: "Produtos mais requisitados",
  impacto: "Impacto ambiental",
}

export function detetarTipoRelatorio(mensagem: string): TipoRelatorioAura {
  const msgTokens = new Set(tokens(mensagem))
  if (algumParece(msgTokens, "critico") || algumParece(msgTokens, "compra")) return "critico"
  if (algumParece(msgTokens, "impacto") || algumParece(msgTokens, "ambiental")) return "impacto"
  if (
    algumParece(msgTokens, "empresas") ||
    algumParece(msgTokens, "instituicoes") ||
    algumParece(msgTokens, "doadores") ||
    algumParece(msgTokens, "beneficiarias")
  ) {
    return "empresas"
  }
  if (algumParece(msgTokens, "requisitados") || algumParece(msgTokens, "populares")) {
    return "mais_requisitados"
  }
  if (algumParece(msgTokens, "pedidos") || algumParece(msgTokens, "pedido")) return "pedidos"
  if (algumParece(msgTokens, "disponiveis") || algumParece(msgTokens, "disponivel")) return "disponiveis"
  return "inventario"
}

export function detetarFormatoRelatorio(mensagem: string): "csv" | "pdf" {
  const msgTokens = new Set(tokens(mensagem))
  if (algumParece(msgTokens, "pdf") || algumParece(msgTokens, "imprimir")) return "pdf"
  return "csv"
}

export interface PeriodoRelatorio {
  dataInicio: string | null
  label: string | null
}

export function detetarPeriodoRelatorio(mensagem: string): PeriodoRelatorio {
  const msgTokens = new Set(tokens(mensagem))
  const hoje = new Date()
  if (algumParece(msgTokens, "semestre")) {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1)
    return { dataInicio: inicio.toISOString().slice(0, 10), label: "este semestre" }
  }
  if (algumParece(msgTokens, "trimestre")) {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1)
    return { dataInicio: inicio.toISOString().slice(0, 10), label: "este trimestre" }
  }
  if (algumParece(msgTokens, "mes") || algumParece(msgTokens, "mensal")) {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    return { dataInicio: inicio.toISOString().slice(0, 10), label: "este mês" }
  }
  return { dataInicio: null, label: null }
}

export function detetarMarcaRelatorio(mensagem: string, toners: Toner[]): string | undefined {
  return encontrarMarca(mensagem, toners.map((t) => t.marca)) ?? undefined
}

export function pedeApenasPendentes(mensagem: string): boolean {
  return algumParece(new Set(tokens(mensagem)), "pendentes")
}

type Linha = Record<string, string | number>

export interface RelatorioParams {
  toners: Toner[]
  pedidos: Pedido[]
  empresas: Empresa[]
  marcaFiltro?: string
  dataInicio?: string | null
  pendentesOnly?: boolean
}

export interface RelatorioResultado {
  linhas: Linha[]
  colunas: ColunaExport<Linha>[]
  titulo: string
}

function filtrarPorMarca<T extends { marca: string }>(itens: T[], marcaFiltro?: string): T[] {
  if (!marcaFiltro) return itens
  return itens.filter((i) => i.marca.toLowerCase() === marcaFiltro.toLowerCase())
}

/** Constrói as linhas/colunas de um relatório — a mesma lógica de dados usada na página de Relatórios. */
export function construirRelatorio(
  tipo: TipoRelatorioAura,
  { toners, pedidos, empresas, marcaFiltro, dataInicio, pendentesOnly }: RelatorioParams
): RelatorioResultado {
  const titulo = TIPO_RELATORIO_LABEL[tipo]

  const pedidosFiltrados = pedidos.filter((p) => {
    if (dataInicio && p.created_at.slice(0, 10) < dataInicio) return false
    if (pendentesOnly && !(p.estado === "recebido" || p.estado === "em_analise")) return false
    return true
  })

  switch (tipo) {
    case "inventario": {
      const dados = filtrarPorMarca(toners, marcaFiltro).map((t) => ({
        marca: t.marca,
        modelo: t.modelo,
        referencia: t.referencia,
        estado: TONER_ESTADO_LABEL[t.estado],
        quantidade: t.quantidade,
        reservado: t.quantidade_reservada,
        localizacao: t.localizacao ?? "",
        visivel: t.ativo ? "Sim" : "Não",
      }))
      const colunas: ColunaExport<Linha>[] = [
        { chave: "marca", titulo: "Marca" },
        { chave: "modelo", titulo: "Modelo" },
        { chave: "referencia", titulo: "Referência" },
        { chave: "estado", titulo: "Estado" },
        { chave: "quantidade", titulo: "Quantidade" },
        { chave: "reservado", titulo: "Reservado" },
        { chave: "localizacao", titulo: "Localização" },
        { chave: "visivel", titulo: "Visível" },
      ]
      return { linhas: dados as Linha[], colunas, titulo }
    }

    case "disponiveis": {
      const dados = filtrarPorMarca(toners, marcaFiltro)
        .filter((t) => t.ativo && t.quantidade - t.quantidade_reservada > 0)
        .map((t) => ({
          marca: t.marca,
          modelo: t.modelo,
          referencia: t.referencia,
          estado: TONER_ESTADO_LABEL[t.estado],
          disponivel: t.quantidade - t.quantidade_reservada,
          localizacao: t.localizacao ?? "",
        }))
      const colunas: ColunaExport<Linha>[] = [
        { chave: "marca", titulo: "Marca" },
        { chave: "modelo", titulo: "Modelo" },
        { chave: "referencia", titulo: "Referência" },
        { chave: "estado", titulo: "Estado" },
        { chave: "disponivel", titulo: "Disponível" },
        { chave: "localizacao", titulo: "Localização" },
      ]
      return { linhas: dados as Linha[], colunas, titulo }
    }

    case "critico": {
      const dados = filtrarPorMarca(toners, marcaFiltro)
        .filter((t) => t.ativo && t.quantidade - t.quantidade_reservada <= LIMITE_STOCK_BAIXO)
        .map((t) => {
          const disponivel = t.quantidade - t.quantidade_reservada
          return {
            marca: t.marca,
            modelo: t.modelo,
            referencia: t.referencia,
            stock_atual: disponivel,
            minimo: LIMITE_STOCK_BAIXO,
            diferenca: disponivel - LIMITE_STOCK_BAIXO,
          }
        })
      const colunas: ColunaExport<Linha>[] = [
        { chave: "marca", titulo: "Marca" },
        { chave: "modelo", titulo: "Modelo" },
        { chave: "referencia", titulo: "Referência" },
        { chave: "stock_atual", titulo: "Stock atual" },
        { chave: "minimo", titulo: "Mínimo" },
        { chave: "diferenca", titulo: "Diferença" },
      ]
      return { linhas: dados as Linha[], colunas, titulo }
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
      const colunas: ColunaExport<Linha>[] = [
        { chave: "numero", titulo: "Nº Pedido" },
        { chave: "empresa", titulo: "Empresa" },
        { chave: "solicitante", titulo: "Solicitante" },
        { chave: "estado", titulo: "Estado" },
        { chave: "itens", titulo: "Total de itens" },
        { chave: "data", titulo: "Data" },
      ]
      return { linhas: dados as Linha[], colunas, titulo }
    }

    case "empresas": {
      const dados = empresas.map((e) => ({
        nome: e.nome,
        tipo: EMPRESA_TIPO_LABEL[e.tipo],
        nif: e.nif ?? "",
        cidade: e.cidade ?? "",
        email: e.email ?? "",
        ativo: e.ativo ? "Sim" : "Não",
      }))
      const colunas: ColunaExport<Linha>[] = [
        { chave: "nome", titulo: "Nome" },
        { chave: "tipo", titulo: "Tipo" },
        { chave: "nif", titulo: "NIF" },
        { chave: "cidade", titulo: "Cidade" },
        { chave: "email", titulo: "Email" },
        { chave: "ativo", titulo: "Ativa" },
      ]
      return { linhas: dados as Linha[], colunas, titulo }
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
      const colunas: ColunaExport<Linha>[] = [
        { chave: "marca", titulo: "Marca" },
        { chave: "modelo", titulo: "Modelo" },
        { chave: "total", titulo: "Total requisitado" },
      ]
      return { linhas: dados as Linha[], colunas, titulo }
    }

    case "impacto": {
      const FATOR_CO2_KG_POR_TONER = 2.5
      const concluidos = pedidosFiltrados.filter((p) => p.estado === "concluido")
      const tonersReutilizados = concluidos.reduce(
        (soma, p) => soma + p.pedido_itens.reduce((s, i) => s + i.quantidade, 0),
        0
      )
      const entidades = new Set(concluidos.map((p) => p.empresa_id)).size
      const co2 = Math.round(tonersReutilizados * FATOR_CO2_KG_POR_TONER)
      const dados = [
        { metrica: "Toners reutilizados", valor: tonersReutilizados },
        { metrica: "Instituições apoiadas", valor: entidades },
        { metrica: "CO₂ evitado (kg)", valor: co2 },
      ]
      const colunas: ColunaExport<Linha>[] = [
        { chave: "metrica", titulo: "Métrica" },
        { chave: "valor", titulo: "Valor" },
      ]
      return { linhas: dados as Linha[], colunas, titulo }
    }
  }
}

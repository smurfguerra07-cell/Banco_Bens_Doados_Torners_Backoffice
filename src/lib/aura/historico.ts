// Histórico de doadores e beneficiários — respostas geradas a partir
// dos movimentos de stock (doações) e dos pedidos concluídos (entregas
// a instituições), sem IA generativa.

import { encontrarEmpresa, encontrarMarca } from "./nlu"
import { detetarPeriodoRelatorio } from "./relatorios"
import type { Empresa } from "@/types/empresa"
import type { MovimentoStock } from "@/types/movimento"
import type { Pedido } from "@/types/pedido"
import type { Toner } from "@/types/toner"

export function respostaHistoricoDoadores(
  mensagem: string,
  movimentosDoacao: MovimentoStock[],
  toners: Toner[],
  empresas: Empresa[]
): string {
  const periodo = detetarPeriodoRelatorio(mensagem)
  const marca = encontrarMarca(mensagem, toners.map((t) => t.marca)) ?? undefined
  const empresaAchada = encontrarEmpresa(
    mensagem,
    empresas.map((e) => ({ id: e.id, nome: e.nome }))
  )

  let filtrados = movimentosDoacao
  if (periodo.dataInicio) {
    filtrados = filtrados.filter((m) => m.created_at.slice(0, 10) >= periodo.dataInicio!)
  }
  if (marca) {
    filtrados = filtrados.filter((m) => m.toners?.marca.toLowerCase() === marca.toLowerCase())
  }

  const detalhes = [marca ? `de ${marca}` : null, periodo.label ? `em ${periodo.label}` : null].filter(
    Boolean
  )
  const sufixo = detalhes.length > 0 ? ` ${detalhes.join(" ")}` : ""

  if (empresaAchada) {
    const doEmpresa = filtrados.filter((m) => m.empresa_id === empresaAchada.empresa.id)
    if (doEmpresa.length === 0) {
      return `Não encontrei doações${sufixo} de **${empresaAchada.empresa.nome}**.`
    }
    const total = doEmpresa.reduce((s, m) => s + m.quantidade, 0)
    return `**${empresaAchada.empresa.nome}** doou **${total}** toner(s)${sufixo}, em ${doEmpresa.length} entrega(s).`
  }

  if (filtrados.length === 0) {
    return `Não há doações registadas${sufixo}.`
  }

  const porEmpresa = new Map<string, number>()
  for (const m of filtrados) {
    const nome = m.empresas?.nome ?? "—"
    porEmpresa.set(nome, (porEmpresa.get(nome) ?? 0) + m.quantidade)
  }
  const lista = [...porEmpresa.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([nome, total]) => `• ${nome} — ${total} unidade(s)`)
    .join("\n")

  return `Doadores${sufixo}:\n\n${lista}`
}

export function respostaHistoricoBeneficiarios(mensagem: string, pedidos: Pedido[]): string {
  const periodo = detetarPeriodoRelatorio(mensagem)
  const concluidos = pedidos.filter((p) => {
    if (p.estado !== "concluido") return false
    if (!periodo.dataInicio) return true
    return (p.concluido_em ?? p.created_at).slice(0, 10) >= periodo.dataInicio
  })

  const sufixo = periodo.label ? ` em ${periodo.label}` : ""

  if (concluidos.length === 0) return `Não há pedidos concluídos${sufixo}.`

  const porEmpresa = new Map<string, number>()
  for (const p of concluidos) {
    const nome = p.empresas?.nome ?? "—"
    const total = p.pedido_itens.reduce((s, i) => s + i.quantidade, 0)
    porEmpresa.set(nome, (porEmpresa.get(nome) ?? 0) + total)
  }
  const lista = [...porEmpresa.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([nome, total]) => `• ${nome} — ${total} toner(s)`)
    .join("\n")

  return `Instituições que receberam toners${sufixo}:\n\n${lista}`
}

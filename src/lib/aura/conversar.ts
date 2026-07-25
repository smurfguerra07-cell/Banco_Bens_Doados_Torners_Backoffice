import { detetarIntent, encontrarToner, extrairNumero, mencionaTicket, type CandidatoToner } from "./nlu"
import type { Pedido, PedidoEstado } from "@/types/pedido"
import type { Toner } from "@/types/toner"

const LIMITE_STOCK_BAIXO = 3
const FATOR_CO2_KG_POR_TONER = 2.5

export type AuraState =
  | { fase: "idle" }
  | { fase: "aguardar_toner"; quantidade: number }
  | { fase: "aguardar_quantidade"; tonerId: string; tonerLabel: string }
  | { fase: "confirmar_aumento"; tonerId: string; tonerLabel: string; quantidade: number }

export interface AuraContexto {
  toners: Toner[]
  pedidos: Pedido[]
}

export interface AuraResultado {
  resposta: string
  estado: AuraState
  /** Efeito a executar pelo componente (precisa de acesso à app real). */
  executar?:
    | { tipo: "incrementar_stock"; tonerId: string; tonerLabel: string; quantidade: number }
    | { tipo: "consultar_ticket"; numero: number }
}

const ESTADOS_PENDENTES: PedidoEstado[] = ["recebido", "em_analise"]

function tonerLabel(t: { marca: string; modelo: string; referencia: string }) {
  return `${t.marca} ${t.modelo} (Ref. ${t.referencia})`
}

function candidatos(toners: Toner[]): CandidatoToner[] {
  return toners.map((t) => ({ id: t.id, marca: t.marca, modelo: t.modelo, referencia: t.referencia }))
}

function respostaStockCritico(toners: Toner[]): string {
  const criticos = toners.filter(
    (t) => t.ativo && t.quantidade - t.quantidade_reservada <= LIMITE_STOCK_BAIXO
  )
  if (criticos.length === 0) return "Neste momento não há nenhum toner em stock crítico. 👍"
  const lista = criticos
    .map((t) => `• ${t.marca} ${t.modelo} — ${t.quantidade - t.quantidade_reservada} unidade(s)`)
    .join("\n")
  return `Há ${criticos.length} toner(s) em stock crítico (≤ ${LIMITE_STOCK_BAIXO} unidades):\n\n${lista}`
}

function respostaListaStock(toners: Toner[]): string {
  const ativos = toners.filter((t) => t.ativo)
  const comStock = ativos.filter((t) => t.quantidade - t.quantidade_reservada > 0)
  const semStock = ativos.filter((t) => t.quantidade - t.quantidade_reservada <= 0)

  if (ativos.length === 0) return "Ainda não há toners ativos registados."

  const partes: string[] = []
  if (comStock.length > 0) {
    const lista = comStock
      .slice(0, 12)
      .map((t) => `• ${t.marca} ${t.modelo} — ${t.quantidade - t.quantidade_reservada} unidade(s)`)
      .join("\n")
    const resto = comStock.length > 12 ? `\n… e mais ${comStock.length - 12}.` : ""
    partes.push(`Com stock (${comStock.length}):\n${lista}${resto}`)
  }
  if (semStock.length > 0) {
    const lista = semStock
      .slice(0, 12)
      .map((t) => `• ${t.marca} ${t.modelo}`)
      .join("\n")
    const resto = semStock.length > 12 ? `\n… e mais ${semStock.length - 12}.` : ""
    partes.push(`Sem stock (${semStock.length}):\n${lista}${resto}`)
  }
  return partes.join("\n\n")
}

function respostaResumoPedidos(pedidos: Pedido[]): string {
  const pendentes = pedidos.filter((p) => ESTADOS_PENDENTES.includes(p.estado))
  if (pendentes.length === 0) return "Não há pedidos pendentes de análise neste momento. 👍"
  const lista = pendentes
    .slice(0, 8)
    .map((p) => `• Pedido #${p.numero} — ${p.empresas?.nome ?? "—"}`)
    .join("\n")
  const resto = pendentes.length > 8 ? `\n… e mais ${pendentes.length - 8}.` : ""
  return `Tens ${pendentes.length} pedido(s) por analisar:\n\n${lista}${resto}`
}

function respostaImpacto(pedidos: Pedido[]): string {
  const concluidos = pedidos.filter((p) => p.estado === "concluido")
  const tonersReutilizados = concluidos.reduce(
    (soma, p) => soma + p.pedido_itens.reduce((s, i) => s + i.quantidade, 0),
    0
  )
  const entidades = new Set(concluidos.map((p) => p.empresa_id)).size
  const co2 = tonersReutilizados * FATOR_CO2_KG_POR_TONER
  const co2Texto = co2 >= 1000 ? `${(co2 / 1000).toFixed(1)} toneladas` : `${co2.toFixed(0)} kg`
  return `Até agora: ${tonersReutilizados} toner(s) reutilizados, ${entidades} instituição(ões) apoiadas, e ${co2Texto} de CO₂ evitado.`
}

/** Processa uma mensagem do utilizador e devolve a resposta da Aura + o novo estado da conversa. */
export function processarMensagem(
  mensagem: string,
  estado: AuraState,
  contexto: AuraContexto
): AuraResultado {
  const numero = extrairNumero(mensagem)

  // Estados de preenchimento de dados em falta (têm prioridade sobre a deteção de intenção).
  if (estado.fase === "aguardar_toner") {
    const encontrado = encontrarToner(mensagem, candidatos(contexto.toners))
    if (!encontrado || encontrado.score < 0.34) {
      return {
        resposta: "Não encontrei esse toner. Podes indicar a marca, modelo ou referência?",
        estado,
      }
    }
    return {
      resposta: `Queres mesmo aumentar o stock de ${tonerLabel(encontrado.toner)} em ${estado.quantidade} unidade(s)?`,
      estado: {
        fase: "confirmar_aumento",
        tonerId: encontrado.toner.id,
        tonerLabel: tonerLabel(encontrado.toner),
        quantidade: estado.quantidade,
      },
    }
  }

  if (estado.fase === "aguardar_quantidade") {
    if (!numero || numero <= 0) {
      return { resposta: "Quantas unidades queres adicionar? (só preciso de um número)", estado }
    }
    return {
      resposta: `Queres mesmo aumentar o stock de ${estado.tonerLabel} em ${numero} unidade(s)?`,
      estado: {
        fase: "confirmar_aumento",
        tonerId: estado.tonerId,
        tonerLabel: estado.tonerLabel,
        quantidade: numero,
      },
    }
  }

  if (estado.fase === "confirmar_aumento") {
    const intent = detetarIntent(mensagem)
    if (intent.id === "confirmar") {
      return {
        resposta: `A atualizar o stock de ${estado.tonerLabel}…`,
        estado: { fase: "idle" },
        executar: {
          tipo: "incrementar_stock",
          tonerId: estado.tonerId,
          tonerLabel: estado.tonerLabel,
          quantidade: estado.quantidade,
        },
      }
    }
    return {
      resposta: "Ok, não fiz nenhuma alteração.",
      estado: { fase: "idle" },
    }
  }

  // Sem pedido em curso — deteta a intenção normalmente.
  const intent = detetarIntent(mensagem)

  if (intent.id === "saudacao") {
    return { resposta: "Olá! Em que posso ajudar?", estado: { fase: "idle" } }
  }

  if (intent.id === "stock_critico" && intent.score >= 0.4) {
    return { resposta: respostaStockCritico(contexto.toners), estado: { fase: "idle" } }
  }

  if (intent.id === "listar_stock" && intent.score >= 0.4) {
    return { resposta: respostaListaStock(contexto.toners), estado: { fase: "idle" } }
  }

  if (intent.id === "resumo_pedidos" && intent.score >= 0.4) {
    return { resposta: respostaResumoPedidos(contexto.pedidos), estado: { fase: "idle" } }
  }

  if (intent.id === "impacto" && intent.score >= 0.4) {
    return { resposta: respostaImpacto(contexto.pedidos), estado: { fase: "idle" } }
  }

  if (intent.id === "aumentar_stock" && intent.score >= 0.34) {
    const encontrado = encontrarToner(mensagem, candidatos(contexto.toners))
    if (!encontrado || encontrado.score < 0.34) {
      return {
        resposta: "A que toner te referes? Diz-me a marca, o modelo ou a referência.",
        estado: { fase: "aguardar_toner", quantidade: numero ?? 1 },
      }
    }
    if (!numero || numero <= 0) {
      return {
        resposta: `Quantas unidades queres adicionar a ${tonerLabel(encontrado.toner)}?`,
        estado: {
          fase: "aguardar_quantidade",
          tonerId: encontrado.toner.id,
          tonerLabel: tonerLabel(encontrado.toner),
        },
      }
    }
    return {
      resposta: `Queres mesmo aumentar o stock de ${tonerLabel(encontrado.toner)} em ${numero} unidade(s)?`,
      estado: {
        fase: "confirmar_aumento",
        tonerId: encontrado.toner.id,
        tonerLabel: tonerLabel(encontrado.toner),
        quantidade: numero,
      },
    }
  }

  if (intent.id === "consultar_ticket" || (numero !== null && mencionaTicket(mensagem))) {
    if (!numero) {
      return { resposta: "Qual é o número do ticket? (ex: \"ticket #5\")", estado: { fase: "idle" } }
    }
    return {
      resposta: `A ir buscar o contexto do ticket #${numero}…`,
      estado: { fase: "idle" },
      executar: { tipo: "consultar_ticket", numero },
    }
  }

  if (intent.id === "cancelar") {
    return { resposta: "Tudo bem, fico por aqui.", estado: { fase: "idle" } }
  }

  return {
    resposta:
      "Não percebi bem. Podes perguntar-me sobre: quais toners tenho em stock, stock crítico, pedidos pendentes, impacto ambiental, pedir para aumentar o stock de um toner, ou pedir o contexto de um ticket (ex: \"ticket #5\").",
    estado: { fase: "idle" },
  }
}

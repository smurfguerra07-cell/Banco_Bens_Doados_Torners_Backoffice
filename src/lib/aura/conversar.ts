import {
  detetarIntent,
  encontrarMarca,
  encontrarTicket,
  encontrarToner,
  extrairConteudoDitado,
  extrairNumero,
  mencionaTicket,
  pedeStockDeToner,
  temVerboResposta,
  tokens,
  algumParece,
  type CandidatoTicket,
  type CandidatoToner,
} from "./nlu"
import type { Pedido, PedidoEstado } from "@/types/pedido"
import type { Ticket } from "@/types/ticket"
import type { Toner } from "@/types/toner"

const LIMITE_STOCK_BAIXO = 3
const FATOR_CO2_KG_POR_TONER = 2.5

export type AuraState =
  | {
      fase: "idle"
      falhasSeguidas?: number
      ultimaMarca?: string
      ultimoTicket?: { id: string; numero: number }
    }
  | { fase: "aguardar_toner"; quantidade: number }
  | { fase: "aguardar_quantidade"; tonerId: string; tonerLabel: string }
  | {
      fase: "confirmar_aumento"
      tonerId: string
      tonerLabel: string
      quantidade: number
      quantidadeAtual: number
    }
  | { fase: "confirmar_resposta_ticket"; ticketId: string; ticketNumero: number; conteudo: string }

export interface AuraContexto {
  toners: Toner[]
  pedidos: Pedido[]
  tickets: Ticket[]
}

export interface AuraResultado {
  resposta: string
  estado: AuraState
  /** Efeito a executar pelo componente (precisa de acesso à app real). */
  executar?:
    | {
        tipo: "incrementar_stock"
        tonerId: string
        tonerLabel: string
        quantidade: number
        quantidadeAtual: number
      }
    | { tipo: "consultar_ticket"; numero: number }
    | { tipo: "preparar_resposta_ticket"; ticketId: string; ticketNumero: number }
    | { tipo: "responder_ticket"; ticketId: string; ticketNumero: number; conteudo: string }
}

const ESTADOS_PENDENTES: PedidoEstado[] = ["recebido", "em_analise"]

function tonerLabel(t: { marca: string; modelo: string; referencia: string }) {
  return `${t.marca} ${t.modelo} (Ref. ${t.referencia})`
}

function candidatos(toners: Toner[]): CandidatoToner[] {
  return toners.map((t) => ({ id: t.id, marca: t.marca, modelo: t.modelo, referencia: t.referencia }))
}

function quantidadeDoToner(tonerId: string, toners: Toner[]): number {
  return toners.find((t) => t.id === tonerId)?.quantidade ?? 0
}

type IdleState = Extract<AuraState, { fase: "idle" }>

/**
 * Devolve o novo estado "idle", preservando a memória da sessão
 * (última marca filtrada, último ticket referido) exceto onde o
 * chamador explicitamente indica um novo valor (incluindo `undefined`
 * para limpar essa memória).
 */
function comMemoria(base: IdleState, patch: Partial<Omit<IdleState, "fase">>): AuraState {
  return {
    fase: "idle",
    ultimaMarca: "ultimaMarca" in patch ? patch.ultimaMarca : base.ultimaMarca,
    ultimoTicket: "ultimoTicket" in patch ? patch.ultimoTicket : base.ultimoTicket,
    falhasSeguidas: "falhasSeguidas" in patch ? patch.falhasSeguidas : undefined,
  }
}

/**
 * Decide a marca a usar num filtro de stock: marca explícita na
 * mensagem > pedido explícito de "todos" (limpa o filtro) > marca
 * lembrada de uma pergunta anterior na mesma sessão.
 */
function marcaParaResposta(mensagem: string, toners: Toner[], memoria?: string): string | undefined {
  const encontrada = encontrarMarca(mensagem, toners.map((t) => t.marca))
  if (encontrada) return encontrada
  const msgTokens = new Set(tokens(mensagem))
  if (algumParece(msgTokens, "todos") || algumParece(msgTokens, "todas")) return undefined
  return memoria
}

/** Mensagem de confirmação antes de qualquer alteração real de stock, sempre com o antes/depois. */
function mensagemConfirmarAumento(nome: string, atual: number, quantidade: number): string {
  return `Vou atualizar o stock do **${nome}** de **${atual}** para **${atual + quantidade}** unidades.\nEsta alteração fica registada imediatamente.\nConfirmas? — **sim** ou **não**`
}

/** Encontra o ticket a que a mensagem se refere: por número (prioridade) ou por assunto/quem abriu. */
function encontrarTicketAlvo(mensagem: string, numero: number | null, tickets: Ticket[]): Ticket | null {
  if (numero) {
    const porNumero = tickets.find((t) => t.numero === numero)
    if (porNumero) return porNumero
  }
  const candidatosTicket: CandidatoTicket[] = tickets.map((t) => ({
    id: t.id,
    numero: t.numero,
    assunto: t.assunto,
    autor: t.profiles?.full_name ?? null,
  }))
  const achado = encontrarTicket(mensagem, candidatosTicket)
  if (!achado) return null
  return tickets.find((t) => t.id === achado.ticket.id) ?? null
}

function respostaStockCritico(toners: Toner[], marcaFiltro?: string): string {
  const criticos = toners.filter(
    (t) =>
      t.ativo &&
      t.quantidade - t.quantidade_reservada <= LIMITE_STOCK_BAIXO &&
      (!marcaFiltro || t.marca.toLowerCase() === marcaFiltro.toLowerCase())
  )
  const sufixoMarca = marcaFiltro ? ` da marca ${marcaFiltro}` : ""
  if (criticos.length === 0) return `Neste momento não há nenhum toner${sufixoMarca} em stock crítico. 👍`
  const lista = criticos
    .map((t) => `• ${t.marca} ${t.modelo} — ${t.quantidade - t.quantidade_reservada} unidade(s)`)
    .join("\n")
  return `Há ${criticos.length} toner(s)${sufixoMarca} em stock crítico (≤ ${LIMITE_STOCK_BAIXO} unidades):\n\n${lista}`
}

function respostaListaStock(toners: Toner[], marcaFiltro?: string): string {
  const ativos = toners.filter(
    (t) => t.ativo && (!marcaFiltro || t.marca.toLowerCase() === marcaFiltro.toLowerCase())
  )
  const comStock = ativos.filter((t) => t.quantidade - t.quantidade_reservada > 0)
  const semStock = ativos.filter((t) => t.quantidade - t.quantidade_reservada <= 0)

  if (ativos.length === 0) {
    return marcaFiltro
      ? `Não encontrei toners da marca ${marcaFiltro}.`
      : "Ainda não há toners ativos registados."
  }

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

function respostaStockDeToner(toner: Toner): string {
  const disponivel = toner.quantidade - toner.quantidade_reservada
  if (disponivel <= 0) return `O **${tonerLabel(toner)}** está sem stock disponível neste momento.`
  return `O **${tonerLabel(toner)}** tem **${disponivel}** unidade(s) em stock.`
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
    const atual = quantidadeDoToner(encontrado.toner.id, contexto.toners)
    return {
      resposta: mensagemConfirmarAumento(tonerLabel(encontrado.toner), atual, estado.quantidade),
      estado: {
        fase: "confirmar_aumento",
        tonerId: encontrado.toner.id,
        tonerLabel: tonerLabel(encontrado.toner),
        quantidade: estado.quantidade,
        quantidadeAtual: atual,
      },
    }
  }

  if (estado.fase === "aguardar_quantidade") {
    if (!numero || numero <= 0) {
      return { resposta: "Quantas unidades queres adicionar? (só preciso de um número)", estado }
    }
    const atual = quantidadeDoToner(estado.tonerId, contexto.toners)
    return {
      resposta: mensagemConfirmarAumento(estado.tonerLabel, atual, numero),
      estado: {
        fase: "confirmar_aumento",
        tonerId: estado.tonerId,
        tonerLabel: estado.tonerLabel,
        quantidade: numero,
        quantidadeAtual: atual,
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
          quantidadeAtual: estado.quantidadeAtual,
        },
      }
    }
    return {
      resposta: "Ação cancelada. Nada foi alterado.",
      estado: { fase: "idle" },
    }
  }

  if (estado.fase === "confirmar_resposta_ticket") {
    const intent = detetarIntent(mensagem)
    if (intent.id === "confirmar") {
      return {
        resposta: `A enviar a resposta no ticket #${estado.ticketNumero}…`,
        estado: { fase: "idle" },
        executar: {
          tipo: "responder_ticket",
          ticketId: estado.ticketId,
          ticketNumero: estado.ticketNumero,
          conteudo: estado.conteudo,
        },
      }
    }
    return {
      resposta: "Ação cancelada. Nada foi alterado.",
      estado: { fase: "idle" },
    }
  }

  // Sem pedido em curso — deteta a intenção normalmente.
  const intent = detetarIntent(mensagem)

  if (intent.id === "saudacao") {
    return { resposta: "Olá! Em que posso ajudar?", estado: comMemoria(estado, {}) }
  }

  if (intent.id === "stock_critico" && intent.score >= 0.4) {
    const marca = marcaParaResposta(mensagem, contexto.toners, estado.ultimaMarca)
    return {
      resposta: respostaStockCritico(contexto.toners, marca),
      estado: comMemoria(estado, { ultimaMarca: marca }),
    }
  }

  if (intent.id === "listar_stock" && intent.score >= 0.4) {
    const marca = marcaParaResposta(mensagem, contexto.toners, estado.ultimaMarca)
    return {
      resposta: respostaListaStock(contexto.toners, marca),
      estado: comMemoria(estado, { ultimaMarca: marca }),
    }
  }

  if (intent.id === "resumo_pedidos" && intent.score >= 0.4) {
    return { resposta: respostaResumoPedidos(contexto.pedidos), estado: comMemoria(estado, {}) }
  }

  if (intent.id === "impacto" && intent.score >= 0.4) {
    return { resposta: respostaImpacto(contexto.pedidos), estado: comMemoria(estado, {}) }
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
    const atual = quantidadeDoToner(encontrado.toner.id, contexto.toners)
    return {
      resposta: mensagemConfirmarAumento(tonerLabel(encontrado.toner), atual, numero),
      estado: {
        fase: "confirmar_aumento",
        tonerId: encontrado.toner.id,
        tonerLabel: tonerLabel(encontrado.toner),
        quantidade: numero,
        quantidadeAtual: atual,
      },
    }
  }

  // Pergunta sobre o stock de UM toner específico (ex: "stock do HP 85A",
  // "HP 85A quantas unidades temos?") — reconhecida pelo toner nomeado na
  // mensagem, não por uma frase fixa, por isso funciona com qualquer ordem
  // de palavras. Só entra em jogo se nenhuma intenção mais específica (ex:
  // aumentar_stock, listar_stock) já tiver respondido acima.
  if (pedeStockDeToner(mensagem)) {
    const tonerAlvo = encontrarToner(mensagem, candidatos(contexto.toners))
    if (tonerAlvo && tonerAlvo.score >= 0.34) {
      const completo = contexto.toners.find((t) => t.id === tonerAlvo.toner.id)
      if (completo) {
        return { resposta: respostaStockDeToner(completo), estado: comMemoria(estado, {}) }
      }
    }
  }

  // Pede para responder/explicar um ticket — por referência explícita
  // (número, título, quem o abriu) ou, se não houver nenhuma, pelo último
  // ticket de que se falou nesta sessão (ex: "abre o ticket 423" seguido
  // de "responde dizendo que já foi enviado").
  if (temVerboResposta(mensagem)) {
    let alvo: Ticket | null = null
    if (numero || mencionaTicket(mensagem)) {
      alvo = encontrarTicketAlvo(mensagem, numero, contexto.tickets)
    }
    if (!alvo && estado.ultimoTicket) {
      alvo = contexto.tickets.find((t) => t.id === estado.ultimoTicket!.id) ?? null
    }
    if (!alvo) {
      return {
        resposta: "A que ticket te referes? Diz-me o número, o título ou o nome de quem o abriu.",
        estado: comMemoria(estado, {}),
      }
    }

    const ditado = extrairConteudoDitado(mensagem)
    if (ditado) {
      return {
        resposta: `Aqui está a resposta que vou enviar no ticket **#${alvo.numero}**:\n"${ditado}"\nQueres enviar isto ao cliente? Uma vez enviada, não é possível retirar. — **sim** ou **não**`,
        estado: {
          fase: "confirmar_resposta_ticket",
          ticketId: alvo.id,
          ticketNumero: alvo.numero,
          conteudo: ditado,
        },
      }
    }
    return {
      resposta: `A analisar o ticket #${alvo.numero}…`,
      estado: comMemoria(estado, { ultimoTicket: { id: alvo.id, numero: alvo.numero } }),
      executar: { tipo: "preparar_resposta_ticket", ticketId: alvo.id, ticketNumero: alvo.numero },
    }
  }

  if (intent.id === "consultar_ticket" || (numero !== null && mencionaTicket(mensagem))) {
    if (!numero) {
      return { resposta: "Qual é o número do ticket? (ex: \"ticket #5\")", estado: comMemoria(estado, {}) }
    }
    const ticketAlvo = contexto.tickets.find((t) => t.numero === numero)
    return {
      resposta: `A ir buscar o contexto do ticket #${numero}…`,
      estado: comMemoria(estado, {
        ultimoTicket: ticketAlvo ? { id: ticketAlvo.id, numero: ticketAlvo.numero } : undefined,
      }),
      executar: { tipo: "consultar_ticket", numero },
    }
  }

  if (intent.id === "cancelar") {
    return { resposta: "Tudo bem, fico por aqui.", estado: comMemoria(estado, {}) }
  }

  const falhasAnteriores = estado.falhasSeguidas ?? 0
  if (falhasAnteriores >= 1) {
    return {
      resposta: "Ainda não sei responder a isso. Para este tipo de pedido, fala diretamente com a equipa técnica.",
      estado: { fase: "idle", falhasSeguidas: 0 },
    }
  }
  return {
    resposta:
      "Isso está fora do meu campo de ação. Consigo ajudar com stocks, pedidos pendentes, impacto ambiental e tickets — queres tentar por aí?",
    estado: { fase: "idle", falhasSeguidas: 1 },
  }
}

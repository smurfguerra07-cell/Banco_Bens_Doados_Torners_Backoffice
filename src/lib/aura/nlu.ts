// Reconhecimento de intenção "leve" — sem IA generativa. Compara as
// palavras-chave da mensagem do utilizador com frases de exemplo por
// intenção, tolerando frases diferentes, erros e linguagem pouco clara.

export type IntentId =
  | "saudacao"
  | "stock_critico"
  | "listar_stock"
  | "resumo_pedidos"
  | "impacto"
  | "aumentar_stock"
  | "consultar_ticket"
  | "confirmar"
  | "cancelar"
  | "ajuda"

const STOPWORDS = new Set([
  "a",
  "o",
  "as",
  "os",
  "de",
  "do",
  "da",
  "dos",
  "das",
  "e",
  "em",
  "um",
  "uma",
  "para",
  "por",
  "que",
  "com",
  "no",
  "na",
  "nos",
  "nas",
  "se",
  "ao",
  "aos",
  "é",
  "foi",
  "sao",
  "esta",
  "estao",
  "tem",
  "ha",
  "me",
  "te",
  "isso",
  "isto",
])

export function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
}

export function tokens(s: string): string[] {
  return normalizar(s)
    .replace(/[^a-z0-9\s#]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t))
}

/** Distância de Levenshtein simples — usada para tolerar erros de escrita. */
function distancia(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const dp = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    let anterior = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]
      dp[j] = a[i - 1] === b[j - 1] ? anterior : 1 + Math.min(anterior, dp[j], dp[j - 1])
      anterior = temp
    }
  }
  return dp[n]
}

/** Verifica se um token da mensagem "parece" com uma palavra-alvo, tolerando erros de escrita. */
function pareceCom(token: string, alvo: string): boolean {
  if (token === alvo) return true
  if (token.length < 4 || alvo.length < 4) return false
  const maxDistancia = alvo.length <= 5 ? 1 : 2
  return distancia(token, alvo) <= maxDistancia
}

export function algumParece(msgTokens: Set<string>, alvo: string): boolean {
  for (const t of msgTokens) {
    if (pareceCom(t, alvo)) return true
  }
  return false
}

interface IntentDef {
  id: IntentId
  /** Pelo menos uma destas palavras tem de estar na mensagem para a intenção ser considerada. */
  ancoras: string[]
  exemplos: string[]
}

const INTENTS: IntentDef[] = [
  {
    id: "saudacao",
    ancoras: ["ola", "boa", "bom", "ei", "tudo"],
    exemplos: ["ola", "boa tarde", "bom dia", "boa noite", "ei aura", "tudo bem"],
  },
  {
    id: "confirmar",
    ancoras: ["sim", "confirmo", "confirmar", "ok", "pode", "vai"],
    exemplos: ["sim confirmo", "sim pode ser", "confirmo", "pode ser", "ok pode avancar", "sim faz isso"],
  },
  {
    id: "cancelar",
    ancoras: ["nao", "cancela", "cancelar", "esquece", "para"],
    exemplos: ["nao cancela", "esquece deixa estar", "nao e preciso", "para nao faças isso"],
  },
  {
    id: "stock_critico",
    ancoras: ["critico", "criticos", "baixo", "baixos", "pouco", "poucos", "falta", "faltam", "acabar", "acabando", "alerta", "alertas"],
    exemplos: [
      "que toners estao em stock critico",
      "o que esta com pouco stock",
      "quais produtos tem stock baixo",
      "alertas de stock",
      "falta de toners",
      "toners a acabar",
      "so os criticos",
      "filtra so os criticos",
      "mostra so os criticos",
    ],
  },
  {
    id: "listar_stock",
    ancoras: ["quais", "lista", "listar", "inventario", "catalogo", "todos", "todas", "mostra", "mostrar"],
    exemplos: [
      "quais toners estao em stock",
      "lista todos os toners",
      "mostra o inventario",
      "que toners tenho",
      "mostra todos os produtos",
      "quais produtos tenho",
    ],
  },
  {
    id: "resumo_pedidos",
    ancoras: ["pedidos", "pedido"],
    exemplos: [
      "resume os pedidos pendentes",
      "quantos pedidos ha para analisar",
      "pedidos por responder",
      "o que tenho para aprovar",
      "pedidos urgentes",
      "pedidos por analisar",
    ],
  },
  {
    id: "impacto",
    ancoras: ["impacto", "co2", "ambiental", "reutilizados", "instituicoes", "toneladas"],
    exemplos: [
      "qual foi o impacto ambiental",
      "quanto co2 evitamos",
      "impacto deste mes",
      "quantos toners reutilizados",
      "quantas instituicoes apoiamos",
    ],
  },
  {
    id: "aumentar_stock",
    ancoras: [
      "aumenta",
      "aumentar",
      "adiciona",
      "adicionar",
      "reabastece",
      "reabastecer",
      "reabastecimento",
      "mete",
      "sobe",
      "subir",
      "chegou",
      "chegada",
      "entrada",
      "reposicao",
      "repor",
      "recebi",
      "recebemos",
    ],
    exemplos: [
      "aumenta o stock de",
      "adiciona unidades ao toner",
      "reabastece o toner",
      "mete mais stock no toner",
      "sobe o stock do toner",
      "chegou stock novo de",
      "entrada de stock",
      "recebemos mais toners de",
    ],
  },
  {
    id: "consultar_ticket",
    ancoras: ["ticket", "tickets"],
    exemplos: [
      "o que se passa no ticket",
      "da me o contexto do ticket",
      "resume o ticket numero",
      "mostra o ticket",
      "abre o ticket",
      "o que diz o ticket",
    ],
  },
  {
    id: "ajuda",
    ancoras: ["ajuda", "consegues", "funcionas", "perguntas"],
    exemplos: ["ajuda", "o que consegues fazer", "que perguntas posso fazer", "como funcionas"],
  },
]

export interface DeteccaoIntent {
  id: IntentId
  score: number
}

/**
 * Devolve a intenção mais provável, com uma pontuação de 0 a 1.
 *
 * Cada intenção só é considerada se a mensagem contiver pelo menos uma
 * das suas palavras-âncora (evita que uma palavra genérica como "stock"
 * sozinha empate entre intenções diferentes); dentro das que passam
 * esse filtro, pontua por sobreposição de palavras com as frases de
 * exemplo.
 */
export function detetarIntent(mensagem: string): DeteccaoIntent {
  const msgTokens = new Set(tokens(mensagem))
  let melhor: DeteccaoIntent = { id: "ajuda", score: 0 }

  if (msgTokens.size === 0) return melhor

  for (const intent of INTENTS) {
    const temAncora = intent.ancoras.some((a) => algumParece(msgTokens, a))
    if (!temAncora) continue

    for (const exemplo of intent.exemplos) {
      const exTokens = tokens(exemplo)
      if (exTokens.length === 0) continue
      const encontrados = exTokens.filter((t) => algumParece(msgTokens, t)).length
      const score = encontrados / exTokens.length
      if (score > melhor.score) melhor = { id: intent.id, score }
    }
  }

  return melhor
}

/** Verifica se a mensagem parece mencionar um ticket (tolera erros de escrita). */
export function mencionaTicket(mensagem: string): boolean {
  const msgTokens = new Set(tokens(mensagem))
  return algumParece(msgTokens, "ticket") || algumParece(msgTokens, "tickets")
}

const PALAVRAS_STOCK = [
  "stock",
  "estoque",
  "quantidade",
  "quantas",
  "quantos",
  "unidades",
  "temos",
  "tenho",
  "ha",
  "existe",
  "disponivel",
  "disponiveis",
  "sobra",
  "sobram",
]

/**
 * Verifica se a mensagem pergunta por quantidade/stock — usado para
 * reconhecer perguntas sobre o stock de UM toner específico,
 * independentemente da ordem das palavras (ex: "stock do HP 85A" e
 * "HP 85A quantas unidades temos?" contam como o mesmo pedido).
 */
export function pedeStockDeToner(mensagem: string): boolean {
  const msgTokens = new Set(tokens(mensagem))
  return PALAVRAS_STOCK.some((p) => algumParece(msgTokens, p))
}

const VERBOS_RESPOSTA_TICKET = ["responde", "responder", "respondas", "resposta", "explica", "explicar"]

/** Verifica se a mensagem pede à Aura para responder/explicar um ticket (não só consultar). */
export function temVerboResposta(mensagem: string): boolean {
  const msgTokens = new Set(tokens(mensagem))
  return VERBOS_RESPOSTA_TICKET.some((v) => algumParece(msgTokens, v))
}

/**
 * Extrai o conteúdo que o utilizador ditou para enviar (ex: "responde
 * dizendo que já foi enviado" → "já foi enviado"), para quando a Aura
 * não deve gerar a resposta sozinha mas usar exatamente o que lhe foi
 * pedido para dizer.
 */
export function extrairConteudoDitado(mensagem: string): string | null {
  const match = mensagem.match(/(?:dizendo|a dizer|informando|avisando)\s+que\s+(.+)/i)
  if (!match) return null
  const conteudo = match[1].trim()
  if (conteudo.length === 0) return null
  return conteudo.charAt(0).toUpperCase() + conteudo.slice(1)
}

/**
 * Encontra a marca (entre as marcas realmente em catálogo) mencionada na
 * mensagem — usado para filtrar respostas de stock por marca (ex: "mostra
 * os toners HP") e para lembrar esse filtro em perguntas seguintes.
 */
export function encontrarMarca(mensagem: string, marcasDisponiveis: string[]): string | null {
  const msgTokens = new Set(tokens(mensagem))
  const marcasUnicas = [...new Set(marcasDisponiveis.map((m) => m.trim()).filter(Boolean))]
  for (const marca of marcasUnicas) {
    const marcaTokens = tokens(marca)
    if (marcaTokens.length === 0) continue
    if (marcaTokens.every((t) => algumParece(msgTokens, t))) return marca
  }
  return null
}

export interface CandidatoTicket {
  id: string
  numero: number
  assunto: string
  autor: string | null
}

/**
 * Encontra o ticket mais parecido com o que a mensagem descreve, pelo
 * assunto ou pelo nome de quem o abriu — usado quando o utilizador não
 * indica o número do ticket.
 */
export function encontrarTicket(
  mensagem: string,
  tickets: CandidatoTicket[]
): { ticket: CandidatoTicket; score: number } | null {
  const msgTokens = new Set(tokens(mensagem))
  if (tickets.length === 0) return null

  let melhor: { ticket: CandidatoTicket; score: number } | null = null

  for (const ticket of tickets) {
    const rotuloTokens = [...new Set(tokens(`${ticket.assunto} ${ticket.autor ?? ""}`))]
    if (rotuloTokens.length === 0) continue
    const encontrados = rotuloTokens.filter((t) => algumParece(msgTokens, t)).length
    const score = encontrados / rotuloTokens.length
    if (!melhor || score > melhor.score) melhor = { ticket, score }
  }

  return melhor && melhor.score >= 0.34 ? melhor : null
}

/** Extrai o primeiro número inteiro presente na mensagem (quantidade, nº de ticket, etc.). */
export function extrairNumero(mensagem: string): number | null {
  const match = mensagem.match(/\d+/)
  return match ? parseInt(match[0], 10) : null
}

export interface CandidatoToner {
  id: string
  marca: string
  modelo: string
  referencia: string
}

/**
 * Encontra o toner mais parecido com o que a mensagem descreve, por
 * sobreposição de palavras com a marca/modelo/referência — sem
 * embeddings, só comparação de texto.
 */
export function encontrarToner(
  mensagem: string,
  toners: CandidatoToner[]
): { toner: CandidatoToner; score: number } | null {
  const msgNormalizada = normalizar(mensagem)
  const msgTokens = new Set(tokens(mensagem))
  if (toners.length === 0) return null

  let melhor: { toner: CandidatoToner; score: number } | null = null

  for (const toner of toners) {
    const referenciaNorm = normalizar(toner.referencia)
    // Referência exata mencionada na frase é o sinal mais forte.
    if (referenciaNorm.length >= 3 && msgNormalizada.includes(referenciaNorm)) {
      return { toner, score: 1 }
    }

    const rotuloTokens = [...new Set(tokens(`${toner.marca} ${toner.modelo} ${toner.referencia}`))]
    if (rotuloTokens.length === 0) continue
    const encontrados = rotuloTokens.filter((t) => algumParece(msgTokens, t)).length
    const score = encontrados / rotuloTokens.length
    if (!melhor || score > melhor.score) melhor = { toner, score }
  }

  return melhor && melhor.score > 0 ? melhor : null
}

// Reconhecimento de intenção "leve" — sem IA generativa. Compara as
// palavras-chave da mensagem do utilizador com frases de exemplo por
// intenção, tolerando frases diferentes, erros e linguagem pouco clara.

export type IntentId =
  | "saudacao"
  | "stock_critico"
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
    const temAncora = intent.ancoras.some((a) => msgTokens.has(a))
    if (!temAncora) continue

    for (const exemplo of intent.exemplos) {
      const exTokens = tokens(exemplo)
      if (exTokens.length === 0) continue
      const encontrados = exTokens.filter((t) => msgTokens.has(t)).length
      const score = encontrados / exTokens.length
      if (score > melhor.score) melhor = { id: intent.id, score }
    }
  }

  return melhor
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
    const encontrados = rotuloTokens.filter((t) => msgTokens.has(t)).length
    const score = encontrados / rotuloTokens.length
    if (!melhor || score > melhor.score) melhor = { toner, score }
  }

  return melhor && melhor.score > 0 ? melhor : null
}

// Motor de correspondência da Aura, portado para dentro desta Edge
// Function (Deno só vê ficheiros dentro da própria pasta da função).
// Terceira cópia dos mesmos primitivos sem dependências externas —
// já portados uma vez de backoffice/src/lib/aura/nlu.ts para
// portal/src/lib/aura/{nlu,tonerMatch,categorias,motor,pedidoStatus}.ts.
// Aqui consolidados num único ficheiro por não haver razão para os
// separar dentro de uma função isolada.

// ---------- Primitivos de texto ----------

const STOPWORDS = new Set([
  "a", "o", "as", "os", "de", "do", "da", "dos", "das", "e", "em", "um",
  "uma", "para", "por", "que", "com", "no", "na", "nos", "nas", "se",
  "ao", "aos", "é", "foi", "sao", "esta", "estao", "tem", "ha", "me",
  "te", "isso", "isto",
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

export function extrairNumero(mensagem: string): number | null {
  const match = mensagem.match(/\d+/)
  return match ? parseInt(match[0], 10) : null
}

// ---------- Artigos da base de conhecimento ----------

export type KbCategoria =
  | "instalacao" | "problemas" | "pedidos" | "entregas" | "devolucoes"
  | "doacoes" | "conta" | "plataforma" | "faq"

export interface CandidatoArtigo {
  id: string
  categoria: string
  titulo: string
  palavras_chave: string[]
  sinonimos: string[]
}

export interface DeteccaoArtigo {
  artigo: CandidatoArtigo
  score: number
}

export function encontrarArtigo(
  mensagem: string,
  artigos: CandidatoArtigo[],
  categoria?: string
): DeteccaoArtigo[] {
  const msgNormalizada = normalizar(mensagem)
  const msgTokens = new Set(tokens(mensagem))
  const candidatos = categoria ? artigos.filter((a) => a.categoria === categoria) : artigos

  const resultados: DeteccaoArtigo[] = []

  for (const artigo of candidatos) {
    const frasesFortes = [...artigo.palavras_chave, ...artigo.sinonimos]
    const matchForte = frasesFortes.some((f) => {
      const fNorm = normalizar(f)
      return fNorm.length >= 3 && msgNormalizada.includes(fNorm)
    })
    if (matchForte) {
      resultados.push({ artigo, score: 1 })
      continue
    }

    const tituloTokens = tokens(artigo.titulo)
    const chaveTokens = tokens(artigo.palavras_chave.join(" "))
    const sinonimoTokens = tokens(artigo.sinonimos.join(" "))
    const todosTokens = [...new Set([...tituloTokens, ...chaveTokens, ...sinonimoTokens])]
    if (todosTokens.length === 0) continue

    let pontos = 0
    let maxPontos = 0
    for (const t of tituloTokens) {
      maxPontos += 3
      if (algumParece(msgTokens, t)) pontos += 3
    }
    for (const t of [...new Set(chaveTokens)]) {
      maxPontos += 2
      if (algumParece(msgTokens, t)) pontos += 2
    }
    for (const t of [...new Set(sinonimoTokens)]) {
      maxPontos += 1
      if (algumParece(msgTokens, t)) pontos += 1
    }
    if (maxPontos === 0) continue

    const score = pontos / maxPontos
    if (score > 0) resultados.push({ artigo, score })
  }

  return resultados.sort((a, b) => b.score - a.score)
}

// ---------- Toners ----------

export interface CandidatoToner {
  id: string
  marca: string
  modelo: string
  referencia: string
}

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

// ---------- Categorias ----------

function algumaAncoraPresente(mensagem: string, ancoras: string[]): boolean {
  const msgTokens = new Set(tokens(mensagem))
  return ancoras.some((a) => algumParece(msgTokens, a))
}

const ANCORAS_INSTALACAO = ["instalar", "instalacao", "colocar", "encaixar", "montar", "trocar"]
const ANCORAS_PROBLEMA = [
  "problema", "problemas", "avaria", "avariado", "falha", "mancha",
  "manchado", "risca", "riscado", "vazamento", "borrado", "fraco",
]
const ANCORAS_ESTADO_PEDIDO = ["pedido", "encomenda", "rastreio", "seguimento"]
const ANCORAS_ENTREGAS = ["entrega", "entregas", "envio", "enviar", "transportadora", "levantamento"]
const ANCORAS_DEVOLUCOES = ["devolver", "devolucao", "devolucoes", "reembolso", "anular"]
const ANCORAS_DOACOES = ["doacao", "doacoes", "doar", "doador", "doadora"]
const ANCORAS_CONTA = ["conta", "perfil", "password", "senha", "email", "dados"]
const ANCORAS_PLATAFORMA = ["plataforma", "funciona", "site", "banco"]

export function detetarCategoria(mensagem: string): KbCategoria | null {
  if (algumaAncoraPresente(mensagem, ANCORAS_INSTALACAO)) return "instalacao"
  if (algumaAncoraPresente(mensagem, ANCORAS_PROBLEMA)) return "problemas"
  if (algumaAncoraPresente(mensagem, ANCORAS_DEVOLUCOES)) return "devolucoes"
  if (algumaAncoraPresente(mensagem, ANCORAS_ENTREGAS)) return "entregas"
  if (algumaAncoraPresente(mensagem, ANCORAS_DOACOES)) return "doacoes"
  if (algumaAncoraPresente(mensagem, ANCORAS_CONTA)) return "conta"
  if (algumaAncoraPresente(mensagem, ANCORAS_PLATAFORMA)) return "plataforma"
  if (algumaAncoraPresente(mensagem, ANCORAS_ESTADO_PEDIDO)) return "pedidos"
  return null
}

// ---------- Confiança / escalonamento ----------

const LIMIAR_CONFIANTE = 0.55
const LIMIAR_MINIMO = 0.34
const MARGEM_DESAMBIGUACAO = 0.15

export type ResultadoMotor =
  | { tipo: "resolvida"; melhor: DeteccaoArtigo }
  | { tipo: "desambiguar"; opcoes: DeteccaoArtigo[] }
  | { tipo: "escalar" }

export function resolverPergunta(
  mensagem: string,
  artigos: CandidatoArtigo[],
  categoria?: KbCategoria
): ResultadoMotor {
  const resultados = encontrarArtigo(mensagem, artigos, categoria)
  if (resultados.length === 0) return { tipo: "escalar" }

  const [melhor, segundo] = resultados

  if (melhor.score >= LIMIAR_CONFIANTE && (!segundo || melhor.score - segundo.score >= MARGEM_DESAMBIGUACAO)) {
    return { tipo: "resolvida", melhor }
  }

  const proximos = resultados.filter((r) => melhor.score - r.score < MARGEM_DESAMBIGUACAO && r.score >= LIMIAR_MINIMO)
  if (proximos.length >= 2) {
    return { tipo: "desambiguar", opcoes: proximos.slice(0, 3) }
  }

  if (melhor.score >= LIMIAR_CONFIANTE) {
    return { tipo: "resolvida", melhor }
  }

  return { tipo: "escalar" }
}

// ---------- Estado do pedido ----------

export interface PedidoItem {
  toners: { marca: string; modelo: string; referencia: string } | null
}

export interface Pedido {
  id: string
  numero: number
  estado:
    | "recebido" | "em_analise" | "aprovado" | "recusado"
    | "em_preparacao" | "pronto_levantamento" | "concluido" | "cancelado"
  motivo_recusa: string | null
  pedido_itens: PedidoItem[]
}

const PEDIDO_ESTADO_LABEL: Record<Pedido["estado"], string> = {
  recebido: "Recebido",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  recusado: "Recusado",
  em_preparacao: "Em preparação",
  pronto_levantamento: "Pronto para levantamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
}

const PEDIDO_FLUXO: Pedido["estado"][] = [
  "recebido", "em_analise", "aprovado", "em_preparacao", "pronto_levantamento", "concluido",
]

function pedidoTerminalNegativo(estado: Pedido["estado"]): boolean {
  return estado === "recusado" || estado === "cancelado"
}

const EXPLICACAO_ESTADO: Record<Pedido["estado"], string> = {
  recebido: "recebemos o teu pedido e vamos analisá-lo em breve.",
  em_analise: "a nossa equipa está a analisar a disponibilidade dos toners pedidos.",
  aprovado: "o teu pedido foi aprovado e vai entrar em preparação.",
  recusado: "infelizmente o teu pedido foi recusado.",
  em_preparacao: "os toners estão a ser preparados para entrega/levantamento.",
  pronto_levantamento: "o teu pedido já está pronto para levantamento.",
  concluido: "o teu pedido foi concluído.",
  cancelado: "o teu pedido foi cancelado.",
}

export function encontrarPedidoReferido(mensagem: string, pedidos: Pedido[]): Pedido | null {
  if (pedidos.length === 0) return null
  const numero = extrairNumero(mensagem)
  if (numero !== null) {
    const encontrado = pedidos.find((p) => p.numero === numero)
    if (encontrado) return encontrado
  }
  return pedidos[0]
}

export function explicarEstadoPedido(pedido: Pedido): string {
  const label = PEDIDO_ESTADO_LABEL[pedido.estado]
  const explicacao = EXPLICACAO_ESTADO[pedido.estado]
  const linhas = [`O pedido **#${pedido.numero}** está **${label}** — ${explicacao}`]

  if (pedido.estado === "recusado" && pedido.motivo_recusa) {
    linhas.push(`Motivo: ${pedido.motivo_recusa}`)
  }

  if (!pedidoTerminalNegativo(pedido.estado) && pedido.estado !== "concluido") {
    const indice = PEDIDO_FLUXO.indexOf(pedido.estado)
    const proximo = indice >= 0 ? PEDIDO_FLUXO[indice + 1] : undefined
    if (proximo) {
      linhas.push(`Próximo passo: **${PEDIDO_ESTADO_LABEL[proximo]}**.`)
    }
  }

  return linhas.join("\n")
}

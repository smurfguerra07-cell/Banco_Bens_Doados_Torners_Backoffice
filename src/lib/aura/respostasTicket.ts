// Geração de respostas para tickets — sem IA generativa. Deteta a
// categoria do problema por palavras-chave na mensagem do cliente e
// combina um texto pré-escrito com os dados reais do toner em causa
// (nome e, se existir, vídeo explicativo).

import { algumParece, encontrarToner, tokens } from "./nlu"
import type { Ticket, TicketMensagem } from "@/types/ticket"
import type { Toner } from "@/types/toner"

interface CategoriaProblema {
  id: string
  palavras: string[]
  resposta: (toner?: string) => string
}

const CATEGORIAS: CategoriaProblema[] = [
  {
    id: "compatibilidade",
    palavras: ["encaixa", "encaixar", "cabe", "entra", "compativel", "compatibilidade", "serve"],
    resposta: (toner) =>
      `Obrigado por nos contactares.${toner ? ` Verificámos que se trata do toner ${toner}.` : ""} Antes de mais, confirma o modelo exato da tua impressora (normalmente indicado na etiqueta frontal ou no menu de definições) e compara com a compatibilidade indicada na ficha do produto. Se o toner não encaixar fisicamente no compartimento, é sinal de que não é compatível com esse modelo — responde-nos com o modelo da tua impressora que tratamos da troca por um compatível.`,
  },
  {
    id: "qualidade",
    palavras: ["vazio", "manchas", "risco", "riscos", "borrado", "fraca", "qualidade", "apagado"],
    resposta: (toner) =>
      `Lamentamos o incómodo.${toner ? ` Sobre o toner ${toner}: ` : " "}nos toners reconstruídos é normal alguma variação de qualidade nas primeiras páginas — tenta retirar o toner, agitá-lo suavemente de um lado para o outro (para redistribuir o pó) e voltar a instalar. Se o problema persistir nas páginas seguintes, responde a esta mensagem que tratamos da substituição sem custos.`,
  },
  {
    id: "avaria",
    palavras: ["avariado", "partido", "defeito", "estragado", "quebrado"],
    resposta: (toner) =>
      `Lamentamos muito.${toner ? ` Sobre o toner ${toner}: ` : " "}podes enviar-nos uma foto do estado em que chegou? Assim que a recebermos, avançamos de imediato com a substituição ou o reembolso, conforme preferires.`,
  },
  {
    id: "entrega",
    palavras: ["atraso", "demora", "chegou", "entrega", "transportadora"],
    resposta: () =>
      `Pedimos desculpa pela demora. Vamos verificar o estado da entrega do teu pedido e voltamos a contactar-te com uma atualização o mais rapidamente possível.`,
  },
]

/**
 * Gera uma resposta para o ticket com base no conteúdo das mensagens do
 * cliente, no toner identificado (se houver) e, se o toner tiver um
 * vídeo explicativo associado, inclui esse link.
 */
export function gerarRespostaTicket(
  ticket: Pick<Ticket, "assunto">,
  mensagensCliente: TicketMensagem[],
  toners: Toner[]
): string {
  const textoCompleto = [ticket.assunto, ...mensagensCliente.map((m) => m.conteudo ?? "")].join(" ")
  const msgTokens = new Set(tokens(textoCompleto))

  const encontrado = encontrarToner(
    textoCompleto,
    toners.map((t) => ({ id: t.id, marca: t.marca, modelo: t.modelo, referencia: t.referencia }))
  )
  const tonerCompleto =
    encontrado && encontrado.score >= 0.34 ? toners.find((t) => t.id === encontrado.toner.id) : undefined
  const tonerLabel = tonerCompleto
    ? `${tonerCompleto.marca} ${tonerCompleto.modelo} (Ref. ${tonerCompleto.referencia})`
    : undefined

  const categoria = CATEGORIAS.find((c) => c.palavras.some((p) => algumParece(msgTokens, p)))
  let resposta = categoria
    ? categoria.resposta(tonerLabel)
    : `Obrigado por nos contactares.${tonerLabel ? ` Sobre o toner ${tonerLabel}: ` : " "}a nossa equipa vai analisar o teu pedido com mais atenção e volta a responder-te em breve com mais detalhes.`

  if (tonerCompleto?.video_url) {
    resposta += `\n\n📹 Vídeo explicativo: ${tonerCompleto.video_url}`
  }

  return resposta
}

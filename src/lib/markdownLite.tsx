import type { ReactNode } from "react"

/** Renderiza **negrito** dentro de uma linha, sem precisar de um parser de markdown completo. */
function renderComNegrito(texto: string): ReactNode {
  return texto.split(/\*\*(.+?)\*\*/g).map((parte, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {parte}
      </strong>
    ) : (
      parte
    )
  )
}

/**
 * Subconjunto pequeno de Markdown usado no conteúdo dos artigos da Aura:
 * **negrito**, listas "- item", avisos "> aviso" e parágrafos separados
 * por linha. Sem dependências externas — o texto fica sempre em `text`
 * simples na base de dados, portável para um futuro contexto de LLM.
 */
export function MarkdownLite({ texto }: { texto: string }) {
  const linhas = texto.split("\n")
  const blocos: ReactNode[] = []
  let listaAtual: string[] = []

  function fecharLista() {
    if (listaAtual.length === 0) return
    blocos.push(
      <ul key={`lista-${blocos.length}`} className="ml-5 list-disc space-y-1">
        {listaAtual.map((item, i) => (
          <li key={i}>{renderComNegrito(item)}</li>
        ))}
      </ul>
    )
    listaAtual = []
  }

  linhas.forEach((linha, i) => {
    const linhaLista = linha.match(/^\s*-\s+(.*)/)
    const linhaAviso = linha.match(/^\s*>\s+(.*)/)

    if (linhaLista) {
      listaAtual.push(linhaLista[1])
      return
    }
    fecharLista()

    if (linhaAviso) {
      blocos.push(
        <p
          key={`aviso-${i}`}
          className="rounded-lg border border-secondary/20 bg-secondary/5 px-3 py-2 text-secondary"
        >
          {renderComNegrito(linhaAviso[1])}
        </p>
      )
      return
    }

    if (linha.trim() === "") {
      blocos.push(<div key={`vazio-${i}`} className="h-2" />)
      return
    }

    blocos.push(<p key={`p-${i}`}>{renderComNegrito(linha)}</p>)
  })
  fecharLista()

  return <div className="space-y-2 text-sm leading-relaxed text-foreground/90">{blocos}</div>
}

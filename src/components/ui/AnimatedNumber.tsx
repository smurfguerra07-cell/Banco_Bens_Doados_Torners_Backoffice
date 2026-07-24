import { useEffect, useRef, useState } from "react"

/** Anima um número a subir (ou descer) suavemente até ao valor atual. */
export function AnimatedNumber({
  value,
  duration = 700,
  formatar,
}: {
  value: number
  duration?: number
  formatar?: (n: number) => string
}) {
  const [exibido, setExibido] = useState(0)
  const valorAnteriorRef = useRef(0)

  useEffect(() => {
    const valorInicial = valorAnteriorRef.current
    const diferenca = value - valorInicial
    let inicio: number | null = null
    let frame: number

    function tick(timestamp: number) {
      if (inicio === null) inicio = timestamp
      const progresso = Math.min((timestamp - inicio) / duration, 1)
      const facilitado = 1 - Math.pow(1 - progresso, 3)
      setExibido(valorInicial + diferenca * facilitado)
      if (progresso < 1) frame = requestAnimationFrame(tick)
      else valorAnteriorRef.current = value
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return <>{formatar ? formatar(exibido) : Math.round(exibido)}</>
}

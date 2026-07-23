// Shape customizado para o Recharts <Bar>, a simular um efeito 3D
// (cubóide isométrico) sem depender de nenhuma biblioteca de gráficos 3D.

interface BarShapeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
}

const DEPTH = 8

function sombrear(hex: string, fator: number) {
  const n = parseInt(hex.replace("#", ""), 16)
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + fator))
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + fator))
  const b = Math.min(255, Math.max(0, (n & 255) + fator))
  return `rgb(${r}, ${g}, ${b})`
}

export function Bar3D(props: BarShapeProps) {
  const { x = 0, y = 0, width = 0, height = 0, fill = "#1e4b8f" }: BarShapeProps = props

  if (height <= 0 || width <= 0) return null

  const topoClaro = sombrear(fill, 35)
  const ladoEscuro = sombrear(fill, -35)

  return (
    <g>
      {/* face lateral (direita) */}
      <polygon
        points={`${x + width},${y} ${x + width + DEPTH},${y - DEPTH} ${x + width + DEPTH},${y + height - DEPTH} ${x + width},${y + height}`}
        fill={ladoEscuro}
      />
      {/* topo */}
      <polygon
        points={`${x},${y} ${x + DEPTH},${y - DEPTH} ${x + width + DEPTH},${y - DEPTH} ${x + width},${y}`}
        fill={topoClaro}
      />
      {/* frente */}
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={2} />
    </g>
  )
}

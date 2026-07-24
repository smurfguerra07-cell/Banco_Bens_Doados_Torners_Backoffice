import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Badge de estado consistente em toda a app — fundo suave + ponto a pulsar para estados que precisam de atenção. */
export function EstadoBadge({
  className,
  pulsar,
  children,
}: {
  className: string
  pulsar?: boolean
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {pulsar && <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-current" />}
      {children}
    </span>
  )
}

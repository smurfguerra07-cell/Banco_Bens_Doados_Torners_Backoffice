import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

export function EmptyState({
  icon: Icon,
  titulo,
  descricao,
}: {
  icon: LucideIcon
  titulo: string
  descricao?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-2 py-14 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground/60">
        <Icon className="size-6" />
      </span>
      <p className="text-sm font-medium text-foreground">{titulo}</p>
      {descricao && <p className="text-xs text-muted-foreground">{descricao}</p>}
    </motion.div>
  )
}

import { useEffect } from "react"

/** Impede o scroll da página por trás enquanto um modal está aberto. */
export function useBodyScrollLock(travado: boolean) {
  useEffect(() => {
    if (!travado) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [travado])
}

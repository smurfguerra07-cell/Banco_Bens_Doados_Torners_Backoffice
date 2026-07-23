import { useAuth } from "@/contexts/AuthContext"

export function DashboardPage() {
  const { profile } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">
        Olá{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Este é o teu dashboard. Os widgets (pedidos pendentes, stock baixo,
        gráficos, etc.) e a personalização por arrastar vêm nas próximas
        fases.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Pedidos pendentes", "Stock baixo", "Últimas entradas", "Pedidos aprovados"].map(
          (titulo) => (
            <div
              key={titulo}
              className="rounded-xl border border-border bg-card p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {titulo}
              </p>
              <p className="mt-2 text-3xl font-semibold text-foreground">—</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}

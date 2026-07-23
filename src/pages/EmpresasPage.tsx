import { useMemo, useState } from "react"
import { Building2, Pencil, Plus, Search } from "lucide-react"
import { useEmpresas, useEmpresaMutations } from "@/hooks/useEmpresas"
import { EmpresaFormModal } from "@/components/empresas/EmpresaFormModal"
import { EMPRESA_TIPO_LABEL, type Empresa, type EmpresaInput } from "@/types/empresa"
import { cn } from "@/lib/utils"

export function EmpresasPage() {
  const { data: empresas, isLoading } = useEmpresas()
  const { guardar, alternarAtivo } = useEmpresaMutations()
  const [pesquisa, setPesquisa] = useState("")
  const [modalAberto, setModalAberto] = useState(false)
  const [empresaEditar, setEmpresaEditar] = useState<Empresa | null>(null)

  const filtradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()
    if (!termo) return empresas ?? []
    return (empresas ?? []).filter((e) => e.nome.toLowerCase().includes(termo))
  }, [empresas, pesquisa])

  function abrirCriar() {
    setEmpresaEditar(null)
    setModalAberto(true)
  }

  function abrirEditar(empresa: Empresa) {
    setEmpresaEditar(empresa)
    setModalAberto(true)
  }

  function handleSubmit(input: EmpresaInput) {
    guardar.mutate(
      { id: empresaEditar?.id, input },
      { onSuccess: () => setModalAberto(false) }
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Empresas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entidades doadoras e beneficiárias.
          </p>
        </div>
        <button
          onClick={abrirCriar}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="size-4" />
          Nova empresa
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:max-w-sm">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder="Pesquisar por nome..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Contacto</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  A carregar...
                </td>
              </tr>
            )}

            {!isLoading && filtradas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Sem empresas para mostrar.
                </td>
              </tr>
            )}

            {filtradas.map((empresa) => (
              <tr key={empresa.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Building2 className="size-4" />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{empresa.nome}</p>
                      {empresa.nif && (
                        <p className="text-xs text-muted-foreground">
                          NIF {empresa.nif}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {EMPRESA_TIPO_LABEL[empresa.tipo]}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {empresa.email ?? empresa.telefone ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      alternarAtivo.mutate({ id: empresa.id, ativo: !empresa.ativo })
                    }
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition",
                      empresa.ativo
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    )}
                  >
                    {empresa.ativo ? "Ativa" : "Inativa"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => abrirEditar(empresa)}
                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EmpresaFormModal
        empresa={empresaEditar}
        aberto={modalAberto}
        aGuardar={guardar.isPending}
        onClose={() => setModalAberto(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

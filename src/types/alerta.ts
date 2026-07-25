export interface AlertaStock {
  id: string
  toner_id: string
  limite: number
  criado_por: string | null
  ativo: boolean
  created_at: string
  toners: { marca: string; modelo: string; referencia: string } | null
}

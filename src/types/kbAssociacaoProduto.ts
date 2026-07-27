export interface KbAssociacaoProduto {
  id: string
  artigo_id: string
  toner_id: string | null
  marca: string | null
  modelo: string | null
  referencia: string | null
  created_at: string
  toners?: { marca: string; modelo: string; referencia: string } | null
}

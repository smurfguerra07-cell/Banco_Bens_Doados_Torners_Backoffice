-- ============================================================
-- Políticas de Storage para o bucket "toners-images".
-- ============================================================
-- Pré-requisito: o bucket "toners-images" tem de existir
-- (Supabase Dashboard → Storage → New bucket → "toners-images").
-- Pode ser criado como privado — a leitura pública é garantida
-- pela policy de select abaixo, não pela flag "Public bucket".

create policy "Leitura pública de imagens de toners"
  on storage.objects for select
  to public
  using (bucket_id = 'toners-images');

create policy "Staff faz upload de imagens de toners"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'toners-images' and public.can_write_staff());

create policy "Staff atualiza imagens de toners"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'toners-images' and public.can_write_staff())
  with check (bucket_id = 'toners-images' and public.can_write_staff());

create policy "Staff elimina imagens de toners"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'toners-images' and public.can_write_staff());

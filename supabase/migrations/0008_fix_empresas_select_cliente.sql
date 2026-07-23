-- ============================================================
-- Fix: cliente não conseguia criar a sua entidade de teste.
-- ============================================================
-- "insert ... returning" (o que o supabase-js faz com .insert().select())
-- exige que a linha inserida também passe por uma política de SELECT.
-- Só existiam políticas de SELECT para staff — um cliente comum não
-- conseguia "ler de volta" a empresa que acabou de criar, e o pedido
-- inteiro falhava com 403.
--
-- Informação de empresas (nome, tipo, contactos) não é sensível o
-- suficiente para justificar esconder de outros utilizadores
-- autenticados, por isso simplificamos para leitura aberta a
-- qualquer sessão autenticada.

create policy "Utilizadores autenticados veem empresas"
  on public.empresas for select
  to authenticated
  using (true);

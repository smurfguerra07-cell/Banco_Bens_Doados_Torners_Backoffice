-- ============================================================
-- Rendimento (páginas) e instruções de instalação do toner —
-- usados pela Aura para responder a perguntas sobre um toner
-- específico (base de conhecimento por produto).
-- ============================================================

alter table public.toners
  add column if not exists rendimento_paginas integer,
  add column if not exists instrucoes_instalacao text;

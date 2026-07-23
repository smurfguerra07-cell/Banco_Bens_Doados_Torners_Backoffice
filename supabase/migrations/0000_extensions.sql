-- Fase 1: extensões base do PostgreSQL usadas por todo o projeto.
-- As tabelas de negócio (toners, pedidos, empresas, utilizadores, etc.)
-- são criadas na Fase 2 (Modelação da base de dados).

-- UUIDs criptograficamente seguros para chaves primárias
create extension if not exists "pgcrypto";

-- Pesquisa por semelhança de texto (ex: pesquisa instantânea no catálogo)
create extension if not exists "pg_trgm";

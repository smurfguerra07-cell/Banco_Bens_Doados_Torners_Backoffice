-- ============================================================
-- Fix: recursão infinita nas funções is_staff()/can_write_staff().
-- ============================================================
-- Estas funções consultam "profiles", mas "profiles" tem uma
-- política que também chama estas funções — ciclo infinito para
-- qualquer utilizador autenticado (erro 500 "stack depth exceeded").
--
-- Corrigido com SECURITY DEFINER: a função passa a correr com os
-- privilégios do dono (ignora RLS na sua própria consulta interna),
-- quebrando o ciclo. security_invoker=false é o default, mas
-- deixamos explícito com "security definer".

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('administrador', 'gestor', 'operador', 'leitor')
  );
$$;

create or replace function public.can_write_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('administrador', 'gestor', 'operador')
  );
$$;

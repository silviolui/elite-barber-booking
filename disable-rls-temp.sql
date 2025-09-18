-- DESABILITAR RLS TEMPORARIAMENTE PARA TESTES
-- Execute este SQL no Supabase SQL Editor para resolver erros 401

-- 1. DESABILITAR RLS NAS TABELAS PRINCIPAIS
ALTER TABLE IF EXISTS public.unidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profissionais DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.servicos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.horario_funcionamento DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agendamentos DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER POLÍTICAS EXISTENTES SE HOUVER
DROP POLICY IF EXISTS "Acesso publico leitura unidades" ON public.unidades;
DROP POLICY IF EXISTS "Acesso publico leitura profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Acesso publico leitura servicos" ON public.servicos;
DROP POLICY IF EXISTS "Acesso publico leitura horarios" ON public.horario_funcionamento;
DROP POLICY IF EXISTS "Acesso total para testes" ON public.agendamentos;

-- 3. VERIFICAR TABELAS SEM RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('unidades', 'profissionais', 'servicos', 'horario_funcionamento', 'agendamentos')
ORDER BY tablename;

-- LOG
SELECT 'RLS desabilitado para todas as tabelas - app deve funcionar agora!' as status;

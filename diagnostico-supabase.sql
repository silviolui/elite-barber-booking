-- DIAGNÓSTICO COMPLETO DO SUPABASE
-- Execute este SQL no Supabase SQL Editor para identificar problemas

-- 1. VERIFICAR QUAIS TABELAS EXISTEM
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. VERIFICAR STATUS DO RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrlsA
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. VERIFICAR POLÍTICAS ATIVAS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. FORÇAR DESABILITAÇÃO DO RLS (se as tabelas existirem)
DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name IN ('unidades', 'profissionais', 'servicos', 'horario_funcionamento', 'agendamentos')
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(table_record.table_name) || ' DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'RLS desabilitado para: %', table_record.table_name;
    END LOOP;
END $$;

-- 5. REMOVER TODAS AS POLÍTICAS
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON ' || quote_ident(policy_record.schemaname) || '.' || quote_ident(policy_record.tablename);
        RAISE NOTICE 'Política removida: % da tabela %', policy_record.policyname, policy_record.tablename;
    END LOOP;
END $$;

-- 6. VERIFICAÇÃO FINAL
SELECT 
    'DIAGNÓSTICO COMPLETO - VERIFIQUE OS RESULTADOS ACIMA' as status;

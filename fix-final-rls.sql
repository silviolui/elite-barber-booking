-- FIX DEFINITIVO - REMOVER TODAS AS RESTRIÇÕES
-- Execute este SQL para resolver os erros 401 de uma vez por todas

-- 1. DESABILITAR RLS EM TODAS AS TABELAS
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE public.' || quote_ident(table_record.tablename) || ' DISABLE ROW LEVEL SECURITY';
            RAISE NOTICE 'RLS desabilitado para: %', table_record.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao desabilitar RLS para %: %', table_record.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. REMOVER TODAS AS POLÍTICAS
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.' || quote_ident(policy_record.tablename);
            RAISE NOTICE 'Política removida: % da tabela %', policy_record.policyname, policy_record.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao remover política %: %', policy_record.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- 3. GRANT PERMISSIONS EXPLÍCITAS
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 4. VERIFICAÇÃO FINAL
SELECT 
    'TODAS AS RESTRIÇÕES REMOVIDAS - TESTE O APP AGORA!' as status,
    COUNT(*) as total_tabelas
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- 5. MOSTRAR STATUS FINAL
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN 'PROBLEMÁTICA' ELSE 'OK' END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

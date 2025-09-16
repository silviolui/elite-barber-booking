-- VERIFICAR SE AS TABELAS TÊM DADOS
-- Execute no SQL Editor do Supabase

-- 1. Verificar empresas
SELECT 'empresas' as tabela, count(*) as total FROM empresas;

-- 2. Verificar unidades  
SELECT 'unidades' as tabela, count(*) as total FROM unidades;

-- 3. Verificar se as colunas estão em português
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'unidades' 
AND table_schema = 'public';

-- 4. Mostrar dados das unidades
SELECT id, nome, endereco, ativo FROM unidades LIMIT 5;

-- 5. Verificar se RLS está bloqueando
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('empresas', 'unidades', 'profissionais', 'servicos');

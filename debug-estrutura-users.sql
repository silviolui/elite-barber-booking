-- Debug: Verificar estrutura da tabela users para encontrar os nomes reais

-- 1. Ver estrutura completa da tabela users
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ver alguns registros da tabela users (TODOS OS CAMPOS)
SELECT *
FROM public.users 
LIMIT 5;

-- 3. Verificar se existe uma coluna com nomes reais
SELECT 
    id,
    email,
    CASE 
        WHEN raw_user_meta_data IS NOT NULL THEN raw_user_meta_data
        WHEN user_metadata IS NOT NULL THEN user_metadata
        ELSE '{}'::jsonb
    END as metadata
FROM public.users 
WHERE email LIKE '%silvioluigmj%'
LIMIT 5;

-- 4. Buscar nas tabelas relacionadas por nome/perfil do cliente
-- (pode existir uma tabela de perfis separada)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%perfil%' 
OR table_name LIKE '%cliente%' 
OR table_name LIKE '%user%'
ORDER BY table_name;

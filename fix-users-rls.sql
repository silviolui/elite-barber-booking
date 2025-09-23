-- CORRIGIR RLS DA TABELA USERS PARA PERMITIR CONSULTA DO HISTÓRICO

-- 1. Verificar RLS atual da tabela users
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 2. Verificar policies atuais da tabela users
SELECT * FROM pg_policies WHERE tablename = 'users';

-- 3. TEMPORARIAMENTE desabilitar RLS na tabela users para admin poder consultar
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. Verificar se funcionou
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 5. Testar consulta direta do usuário específico
SELECT id, email, nome, telefone, raw_user_meta_data
FROM public.users 
WHERE id = '2ba8832d-63ae-43fd-a930-7832e2e0fe6c';

SELECT 'RLS da tabela users desabilitado para permitir consulta do histórico' as resultado;

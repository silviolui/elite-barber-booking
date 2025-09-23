-- CORRIGIR RLS DA TABELA USERS - VERSÃO CORRIGIDA

-- 1. Primeiro verificar a estrutura real da tabela users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. DESABILITAR RLS na tabela users para admin poder consultar
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se funcionou
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 4. Testar consulta do usuário específico SEM raw_user_meta_data
SELECT id, email, nome, telefone
FROM public.users 
WHERE id = '2ba8832d-63ae-43fd-a930-7832e2e0fe6c';

-- 5. Verificar todos os usuários disponíveis
SELECT id, email, nome, telefone, criado_em
FROM public.users 
LIMIT 5;

SELECT 'RLS da tabela users desabilitado com sucesso!' as resultado;

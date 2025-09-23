-- Primeiro, adicionar a coluna tipo_pagamento se não existir
ALTER TABLE public.historico 
ADD COLUMN IF NOT EXISTS tipo_pagamento VARCHAR(50);

-- Verificar estrutura da tabela admin_usuarios para identificar as colunas corretas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_usuarios' 
  AND table_schema = 'public';

-- Dropar policies antigas se existirem
DROP POLICY IF EXISTS "Users can view own history" ON public.historico;
DROP POLICY IF EXISTS "Admins can view all history" ON public.historico;
DROP POLICY IF EXISTS "Users can insert own history" ON public.historico;
DROP POLICY IF EXISTS "Admins can insert all history" ON public.historico;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.historico;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.historico;
DROP POLICY IF EXISTS "Admin can insert all history" ON public.historico;
DROP POLICY IF EXISTS "Admin can select all history" ON public.historico;
DROP POLICY IF EXISTS "Users can select own history" ON public.historico;

-- TEMPORARIAMENTE desabilitar RLS para permitir inserções
ALTER TABLE public.historico DISABLE ROW LEVEL SECURITY;

-- Verificar se funcionou
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'historico' AND schemaname = 'public';

-- Verificar dados atuais na tabela
SELECT COUNT(*) as total_registros FROM public.historico;

-- CORRIGIR: Adicionar política INSERT para permitir criação de perfil
-- Execute no SQL Editor do Supabase

-- 1. Adicionar política para permitir INSERT quando usuário é criado
CREATE POLICY "Enable insert for authenticated users during signup" 
ON users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. OU ALTERNATIVA: Política mais ampla que permite INSERT para service_role
-- (Descomente se a primeira não funcionar)
-- CREATE POLICY "Enable insert for service role during signup" 
-- ON users FOR INSERT 
-- TO service_role 
-- WITH CHECK (true);

-- 3. VERIFICAR se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';

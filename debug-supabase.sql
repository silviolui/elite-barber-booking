-- DEBUG: Verificar se o trigger e função existem e estão funcionando
-- Execute no SQL Editor do Supabase

-- 1. Verificar se a função existe
SELECT routines.routine_name
FROM information_schema.routines
WHERE routines.specific_schema = 'public'
AND routines.routine_name = 'handle_new_user';

-- 2. Verificar se o trigger existe
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 3. Verificar políticas RLS da tabela users
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';

-- 4. SOLUÇÃO TEMPORÁRIA - Desabilitar RLS na tabela users para debug
-- (Execute apenas se necessário para debug)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 5. RECRIAR a função de forma mais simples (se necessário)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, nome)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$;

-- 6. RECRIAR o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

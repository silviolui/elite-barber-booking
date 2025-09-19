-- Configurar políticas simples para upload de fotos
-- Execute estes comandos diretamente no SQL Editor do Supabase

-- 1. Criar bucket se não existir (via SQL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profissionais-fotos',
  'profissionais-fotos', 
  true,
  5242880, -- 5MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 2. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public uploads" ON storage.objects;

-- 3. Criar políticas simples
-- Permitir leitura pública para todos
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'profissionais-fotos');

-- Permitir upload público (sem autenticação para simplicidade)
CREATE POLICY "Public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profissionais-fotos');

-- Permitir atualização pública
CREATE POLICY "Public updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profissionais-fotos');

-- Permitir exclusão pública  
CREATE POLICY "Public deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'profissionais-fotos');

-- 4. Verificar se foi criado
SELECT 
  'BUCKET CONFIGURADO:' as info,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'profissionais-fotos';

-- 5. Verificar políticas
SELECT 
  'POLÍTICAS CRIADAS:' as info,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%profissionais-fotos%' OR policyname LIKE '%Public%';

SELECT 'Storage configurado com políticas simples!' as resultado;

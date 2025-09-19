-- Configurar Supabase Storage para fotos de profissionais

-- 1. Criar bucket para fotos (execute no SQL Editor do Supabase)
-- Nota: Este comando deve ser executado como superuser no Supabase

-- Verificar se bucket existe
SELECT name FROM storage.buckets WHERE name = 'profissionais-fotos';

-- Se não existir, criar (você pode fazer isso também via Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('profissionais-fotos', 'profissionais-fotos', true);

-- 2. Políticas de acesso para o bucket (permitir upload e visualização)
-- Execute estas políticas no Dashboard do Supabase ou aqui:

-- Política para visualizar fotos (público)
-- CREATE POLICY "Permitir visualização pública de fotos" ON storage.objects
-- FOR SELECT USING (bucket_id = 'profissionais-fotos');

-- Política para upload de fotos (usuários autenticados)
-- CREATE POLICY "Permitir upload de fotos" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'profissionais-fotos');

-- Política para atualizar fotos (usuários autenticados)  
-- CREATE POLICY "Permitir atualização de fotos" ON storage.objects
-- FOR UPDATE USING (bucket_id = 'profissionais-fotos');

-- Política para deletar fotos (usuários autenticados)
-- CREATE POLICY "Permitir exclusão de fotos" ON storage.objects
-- FOR DELETE USING (bucket_id = 'profissionais-fotos');

-- 3. Verificar configuração
SELECT 
    'BUCKET CONFIGURADO:' as info,
    name as bucket_name,
    public as publico,
    created_at
FROM storage.buckets 
WHERE name = 'profissionais-fotos';

-- INSTRUÇÕES MANUAIS:
-- 
-- 1. VÁ PARA SUPABASE DASHBOARD:
--    https://supabase.com/dashboard/project/SEU_PROJECT/storage/buckets
--
-- 2. CLIQUE "NEW BUCKET":
--    - Name: profissionais-fotos
--    - Public bucket: ✅ (checked)
--    - Clique "Save"
--
-- 3. CONFIGURE POLÍTICAS:
--    - Clique no bucket criado
--    - Vá para "Policies" 
--    - Clique "Add policy"
--    - Escolha template "Allow public read access"
--    - Escolha template "Allow authenticated uploads"
--
-- 4. RESULTADO:
--    - URLs das fotos: https://PROJECT_URL/storage/v1/object/public/profissionais-fotos/NOME_ARQUIVO
--    - Upload funcionando via JavaScript

SELECT 'Storage configurado! Agora você pode fazer upload de fotos.' as resultado;

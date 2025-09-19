-- CORREÇÃO DAS POLÍTICAS RLS PARA FOLGAS_PROFISSIONAIS
-- Execute este arquivo se você já criou a tabela mas está com erro de RLS

-- Remover políticas existentes (caso existam)
DROP POLICY IF EXISTS "Acesso publico leitura folgas" ON folgas_profissionais;
DROP POLICY IF EXISTS "Acesso publico insercao folgas" ON folgas_profissionais;
DROP POLICY IF EXISTS "Acesso publico atualizacao folgas" ON folgas_profissionais;
DROP POLICY IF EXISTS "Acesso publico exclusao folgas" ON folgas_profissionais;

-- Criar políticas completas para CRUD
CREATE POLICY "Acesso publico leitura folgas" ON folgas_profissionais FOR SELECT USING (true);
CREATE POLICY "Acesso publico insercao folgas" ON folgas_profissionais FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso publico atualizacao folgas" ON folgas_profissionais FOR UPDATE USING (true);
CREATE POLICY "Acesso publico exclusao folgas" ON folgas_profissionais FOR DELETE USING (true);

-- Verificar se as políticas foram criadas
SELECT 
  'POLÍTICAS CRIADAS:' as info,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'folgas_profissionais'
ORDER BY policyname;

SELECT 'Políticas RLS corrigidas com sucesso!' as resultado;

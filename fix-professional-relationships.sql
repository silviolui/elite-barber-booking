-- CORRIGIR RELACIONAMENTO PROFISSIONAIS → UNIDADES
-- Execute no SQL Editor do Supabase

-- 1. Atualizar Ana Santos para unidade Boulevard Shopping Camaçari
UPDATE profissionais 
SET unidade_id = (
  SELECT id FROM unidades WHERE nome = 'BookIA - Boulevard Shopping Camaçari' LIMIT 1
)
WHERE nome = 'Ana Santos';

-- 2. Atualizar Carlos Silva para unidade Boulevard Shopping Camaçari  
UPDATE profissionais 
SET unidade_id = (
  SELECT id FROM unidades WHERE nome = 'BookIA - Boulevard Shopping Camaçari' LIMIT 1
)
WHERE nome = 'Carlos Silva';

-- 3. Atualizar João Costa para unidade Centro Camaçari
UPDATE profissionais 
SET unidade_id = (
  SELECT id FROM unidades WHERE nome = 'BookIA - Centro Camaçari' LIMIT 1
)
WHERE nome = 'João Costa';

-- 4. Verificar se funcionou
SELECT 
  u.nome as unidade,
  p.nome as profissional,
  p.especialidade
FROM unidades u
LEFT JOIN profissionais p ON u.id = p.unidade_id
WHERE u.ativo = true AND p.ativo = true
ORDER BY u.nome, p.nome;

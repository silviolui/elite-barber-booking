-- VERIFICAR RELACIONAMENTO ENTRE UNIDADES E PROFISSIONAIS
-- Execute no SQL Editor do Supabase

-- 1. Ver unidades e seus IDs
SELECT id, nome, ativo FROM unidades ORDER BY nome;

-- 2. Ver profissionais e seus unidade_id
SELECT id, nome, unidade_id, ativo FROM profissionais ORDER BY nome;

-- 3. Verificar relacionamento (JOIN)
SELECT 
  u.nome as unidade,
  u.id as unidade_id,
  p.nome as profissional,
  p.especialidade,
  p.ativo as prof_ativo
FROM unidades u
LEFT JOIN profissionais p ON u.id = p.unidade_id
WHERE u.ativo = true
ORDER BY u.nome, p.nome;

-- 4. Contar profissionais por unidade
SELECT 
  u.nome as unidade,
  COUNT(p.id) as total_profissionais
FROM unidades u
LEFT JOIN profissionais p ON u.id = p.unidade_id AND p.ativo = true
WHERE u.ativo = true
GROUP BY u.id, u.nome
ORDER BY u.nome;

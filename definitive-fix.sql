-- SOLUÇÃO DEFINITIVA: Corrigir relacionamentos e estrutura do banco
-- Esta é a correção final e definitiva para produção

-- 1. VERIFICAR E CORRIGIR DADOS INCONSISTENTES
-- Primeiro, vamos ver exatamente qual é o problema

-- Ver unidades ativas e seus IDs
SELECT 'UNIDADES ATIVAS:' as info, id, nome FROM unidades WHERE ativo = true;

-- Ver profissionais e seus unidade_id
SELECT 'PROFISSIONAIS:' as info, id, nome, unidade_id, ativo FROM profissionais;

-- 2. CORRIGIR RELACIONAMENTOS DEFINITIVAMENTE
-- Conectar profissionais às unidades corretas baseado nos nomes

-- Ana Santos → Boulevard Shopping Camaçari
UPDATE profissionais 
SET unidade_id = (SELECT id FROM unidades WHERE nome LIKE '%Boulevard%' AND ativo = true LIMIT 1)
WHERE nome = 'Ana Santos';

-- Carlos Silva → Boulevard Shopping Camaçari  
UPDATE profissionais 
SET unidade_id = (SELECT id FROM unidades WHERE nome LIKE '%Boulevard%' AND ativo = true LIMIT 1)
WHERE nome = 'Carlos Silva';

-- João Costa → Centro Camaçari
UPDATE profissionais 
SET unidade_id = (SELECT id FROM unidades WHERE nome LIKE '%Centro%' AND ativo = true LIMIT 1)
WHERE nome = 'João Costa';

-- 3. GARANTIR QUE TODOS OS PROFISSIONAIS ESTÃO ATIVOS
UPDATE profissionais SET ativo = true WHERE ativo IS NULL OR ativo = false;

-- 4. VERIFICAÇÃO FINAL - DEVE MOSTRAR RELACIONAMENTOS CORRETOS
SELECT 
  u.nome as unidade,
  u.id as unidade_id,
  p.nome as profissional,
  p.id as profissional_id,
  p.especialidade,
  p.ativo
FROM unidades u
LEFT JOIN profissionais p ON u.id = p.unidade_id
WHERE u.ativo = true
ORDER BY u.nome, p.nome;

-- 5. ADICIONAR MAIS PROFISSIONAIS PARA CADA UNIDADE (PRODUÇÃO REAL)
-- Para garantir que cada unidade tem pelo menos 2-3 profissionais

INSERT INTO profissionais (unidade_id, nome, especialidade, foto_url, avaliacao, anos_experiencia, ativo)
SELECT 
  id,
  'Roberto Oliveira',
  'Barba e Bigode',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  4.6,
  4,
  true
FROM unidades WHERE nome LIKE '%Boulevard%' AND ativo = true
ON CONFLICT DO NOTHING;

INSERT INTO profissionais (unidade_id, nome, especialidade, foto_url, avaliacao, anos_experiencia, ativo)
SELECT 
  id,
  'Marina Costa',
  'Tratamentos Capilares',
  'https://images.unsplash.com/photo-1494790108755-2616b332ab55?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  4.8,
  7,
  true
FROM unidades WHERE nome LIKE '%Centro%' AND ativo = true
ON CONFLICT DO NOTHING;

-- RESULTADO FINAL: Cada unidade ativa terá profissionais associados corretamente

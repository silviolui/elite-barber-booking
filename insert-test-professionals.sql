-- INSERIR PROFISSIONAIS DE TESTE PARA RESOLVER TELA BRANCA
-- Execute no SQL Editor do Supabase

-- Primeiro, vamos ver os IDs das unidades
SELECT id, nome FROM unidades ORDER BY nome;

-- Inserir profissionais para TODAS as unidades ativas
-- (Substitua os UUIDs pelos IDs reais das suas unidades)

-- Para unidade Boulevard Shopping Camaçari
INSERT INTO profissionais (unidade_id, nome, especialidade, foto_url, avaliacao, anos_experiencia, ativo)
SELECT 
  id,
  'Carlos Silva',
  'Especialista em Cortes',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  4.9,
  8,
  true
FROM unidades WHERE nome = 'BookIA - Boulevard Shopping Camaçari'
ON CONFLICT DO NOTHING;

-- Para unidade Centro Camaçari  
INSERT INTO profissionais (unidade_id, nome, especialidade, foto_url, avaliacao, anos_experiencia, ativo)
SELECT 
  id,
  'Ana Santos',
  'Coloração e Design',
  'https://images.unsplash.com/photo-1494790108755-2616b332ab55?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  4.8,
  6,
  true
FROM unidades WHERE nome = 'BookIA - Centro Camaçari'
ON CONFLICT DO NOTHING;

-- Verificar se inseriu
SELECT u.nome as unidade, p.nome as profissional, p.especialidade
FROM unidades u
LEFT JOIN profissionais p ON u.id = p.unidade_id
WHERE u.ativo = true
ORDER BY u.nome, p.nome;

-- INSERIR DADOS DE TESTE PARA FUNCIONAR IMEDIATAMENTE
-- Execute se as tabelas estiverem vazias

-- 1. Inserir empresa
INSERT INTO empresas (nome, descricao) VALUES 
('BookIA Elite Barber', 'Rede de barbearias premium com agendamento inteligente')
ON CONFLICT DO NOTHING;

-- 2. Inserir unidades (com nome em português)
INSERT INTO unidades (empresa_id, nome, endereco, telefone, imagem_url, ativo) 
SELECT 
  e.id,
  'BookIA - Boulevard Shopping Camaçari',
  'BA-535, s/n - Industrial, s/n, Camaçari',
  '(71) 99999-0001',
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  true
FROM empresas e WHERE e.nome = 'BookIA Elite Barber'
ON CONFLICT DO NOTHING;

INSERT INTO unidades (empresa_id, nome, endereco, telefone, imagem_url, ativo)
SELECT 
  e.id,
  'BookIA - Salvador Norte Shopping', 
  'BA-535, s/n, Salvador',
  '(71) 99999-0002',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  true
FROM empresas e WHERE e.nome = 'BookIA Elite Barber'
ON CONFLICT DO NOTHING;

INSERT INTO unidades (empresa_id, nome, endereco, telefone, imagem_url, ativo)
SELECT 
  e.id,
  'BookIA - Centro Camaçari',
  'Radial B, 80, Camaçari', 
  '(71) 99999-0003',
  'https://images.unsplash.com/photo-1562004760-aceed7bb0fe3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  true
FROM empresas e WHERE e.nome = 'BookIA Elite Barber'
ON CONFLICT DO NOTHING;

-- 3. Inserir profissionais
INSERT INTO profissionais (unidade_id, nome, especialidade, foto_url, avaliacao, anos_experiencia, ativo)
SELECT 
  u.id,
  'Carlos Silva',
  'Especialista em Cortes',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  4.9,
  8,
  true
FROM unidades u WHERE u.nome = 'BookIA - Boulevard Shopping Camaçari'
ON CONFLICT DO NOTHING;

-- 4. Inserir serviços
INSERT INTO servicos (profissional_id, nome, duracao_minutos, preco, ativo)
SELECT 
  p.id,
  'Corte Masculino',
  30,
  45.00,
  true
FROM profissionais p WHERE p.nome = 'Carlos Silva'
ON CONFLICT DO NOTHING;

-- Verificar se inseriu
SELECT 'Resultado' as status, 
  (SELECT count(*) FROM unidades) as unidades,
  (SELECT count(*) FROM profissionais) as profissionais,
  (SELECT count(*) FROM servicos) as servicos;

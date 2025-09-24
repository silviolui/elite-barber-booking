-- Função para criar agendamentos de forma flexível (com ou sem usuário cadastrado)
-- Execute após aplicar o script agendamentos-campos-opcionais.sql

CREATE OR REPLACE FUNCTION criar_agendamento_flexivel(
  -- Dados obrigatórios
  p_profissional_id UUID,
  p_unidade_id UUID,
  p_servico_id UUID,
  p_data_agendamento DATE,
  p_horario_inicio TIME,
  
  -- Dados do cliente (opcionais - usar apenas um dos grupos)
  p_usuario_id UUID DEFAULT NULL,
  p_cliente_nome TEXT DEFAULT NULL,
  p_cliente_telefone TEXT DEFAULT NULL,
  p_cliente_email TEXT DEFAULT NULL,
  
  -- Dados opcionais do agendamento
  p_observacoes TEXT DEFAULT NULL,
  p_preco_total DECIMAL(10,2) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_agendamento_id UUID;
  v_horario_fim TIME;
  v_preco_servico DECIMAL(10,2);
  v_duracao_servico INTEGER;
BEGIN
  -- Validar entrada: deve ter usuario_id OU (nome + telefone)
  IF p_usuario_id IS NULL AND (p_cliente_nome IS NULL OR p_cliente_telefone IS NULL) THEN
    RAISE EXCEPTION 'Deve fornecer usuario_id OU (cliente_nome + cliente_telefone)';
  END IF;
  
  -- Se forneceu usuario_id E dados diretos, priorizar usuario_id
  IF p_usuario_id IS NOT NULL THEN
    p_cliente_nome := NULL;
    p_cliente_telefone := NULL;
    p_cliente_email := NULL;
  END IF;
  
  -- Buscar dados do serviço
  SELECT preco, duracao_minutos INTO v_preco_servico, v_duracao_servico
  FROM servicos 
  WHERE id = p_servico_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Serviço não encontrado';
  END IF;
  
  -- Calcular horário de fim
  v_horario_fim := p_horario_inicio + (v_duracao_servico || ' minutes')::INTERVAL;
  
  -- Usar preço do serviço se não foi fornecido
  IF p_preco_total IS NULL THEN
    p_preco_total := v_preco_servico;
  END IF;
  
  -- Verificar conflito de horário
  IF EXISTS (
    SELECT 1 FROM agendamentos 
    WHERE profissional_id = p_profissional_id 
      AND data_agendamento = p_data_agendamento
      AND status NOT IN ('cancelled')
      AND (
        (p_horario_inicio >= horario_inicio AND p_horario_inicio < horario_fim) OR
        (v_horario_fim > horario_inicio AND v_horario_fim <= horario_fim) OR
        (p_horario_inicio <= horario_inicio AND v_horario_fim >= horario_fim)
      )
  ) THEN
    RAISE EXCEPTION 'Conflito de horário detectado para este profissional';
  END IF;
  
  -- Criar o agendamento
  INSERT INTO agendamentos (
    usuario_id,
    cliente_nome,
    cliente_telefone,
    cliente_email,
    profissional_id,
    unidade_id,
    servico_id,
    data_agendamento,
    horario_inicio,
    horario_fim,
    preco_total,
    observacoes,
    status,
    status_pagamento
  ) VALUES (
    p_usuario_id,
    p_cliente_nome,
    p_cliente_telefone,
    p_cliente_email,
    p_profissional_id,
    p_unidade_id,
    p_servico_id,
    p_data_agendamento,
    p_horario_inicio,
    v_horario_fim,
    p_preco_total,
    p_observacoes,
    'pending',
    'pending'
  ) RETURNING id INTO v_agendamento_id;
  
  RETURN v_agendamento_id;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar ou criar usuário por telefone
CREATE OR REPLACE FUNCTION buscar_ou_criar_usuario(
  p_nome TEXT,
  p_telefone TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Procurar usuário existente por telefone
  SELECT id INTO v_user_id 
  FROM users 
  WHERE phone = p_telefone;
  
  -- Se não encontrou, criar novo usuário
  IF NOT FOUND THEN
    INSERT INTO users (name, phone, email)
    VALUES (p_nome, p_telefone, p_email)
    RETURNING id INTO v_user_id;
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Exemplos de uso:

-- 1. Criar agendamento com usuário já cadastrado:
/*
SELECT criar_agendamento_flexivel(
  p_profissional_id := 'uuid-do-profissional',
  p_unidade_id := 'uuid-da-unidade', 
  p_servico_id := 'uuid-do-servico',
  p_data_agendamento := '2024-03-01',
  p_horario_inicio := '14:00',
  p_usuario_id := 'uuid-do-usuario'
);
*/

-- 2. Criar agendamento com dados diretos (sem cadastrar usuário):
/*
SELECT criar_agendamento_flexivel(
  p_profissional_id := 'uuid-do-profissional',
  p_unidade_id := 'uuid-da-unidade',
  p_servico_id := 'uuid-do-servico', 
  p_data_agendamento := '2024-03-01',
  p_horario_inicio := '15:30',
  p_cliente_nome := 'João Silva',
  p_cliente_telefone := '(11) 99999-9999',
  p_cliente_email := 'joao@email.com'
);
*/

-- 3. Buscar ou criar usuário e fazer agendamento:
/*
DO $$
DECLARE
  v_user_id UUID;
  v_agendamento_id UUID;
BEGIN
  -- Buscar ou criar usuário
  v_user_id := buscar_ou_criar_usuario(
    p_nome := 'Maria Santos',
    p_telefone := '(11) 88888-8888',
    p_email := 'maria@email.com'
  );
  
  -- Criar agendamento
  v_agendamento_id := criar_agendamento_flexivel(
    p_profissional_id := 'uuid-do-profissional',
    p_unidade_id := 'uuid-da-unidade',
    p_servico_id := 'uuid-do-servico',
    p_data_agendamento := '2024-03-01', 
    p_horario_inicio := '16:00',
    p_usuario_id := v_user_id
  );
  
  RAISE NOTICE 'Agendamento criado: %', v_agendamento_id;
END $$;
*/

SELECT '✅ Funções para criar agendamentos flexíveis criadas com sucesso!' as status;

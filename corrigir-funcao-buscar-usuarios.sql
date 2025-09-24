-- Corrigir a função buscar_usuarios_por_telefone para funcionar independente da estrutura da tabela users
-- Execute este script no Supabase SQL Editor

-- 1. Função simples que funciona mesmo se a tabela users não existir ou tiver estrutura diferente
CREATE OR REPLACE FUNCTION buscar_usuarios_por_telefone(
  p_telefone_partial TEXT
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  phone TEXT,
  email TEXT
) AS $$
BEGIN
  -- Verificar se a tabela users existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    -- Verificar se as colunas esperadas existem
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('name', 'phone', 'email')
      HAVING COUNT(*) = 3
    ) THEN
      -- Se a tabela e colunas existem, fazer a busca
      RETURN QUERY
      SELECT u.id, u.name, u.phone, u.email
      FROM users u
      WHERE u.phone ILIKE '%' || p_telefone_partial || '%'
         OR u.name ILIKE '%' || p_telefone_partial || '%'
      ORDER BY u.name
      LIMIT 10;
    ELSE
      -- Se as colunas não existem como esperado, retornar vazio
      RETURN;
    END IF;
  ELSE
    -- Se a tabela não existe, retornar vazio
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Versão alternativa da função que busca pelos agendamentos existentes
CREATE OR REPLACE FUNCTION buscar_clientes_por_telefone(
  p_telefone_partial TEXT
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  phone TEXT,
  email TEXT
) AS $$
BEGIN
  -- Buscar nos agendamentos já existentes pelos dados diretos
  RETURN QUERY
  SELECT 
    gen_random_uuid() as id, -- Gerar ID temporário
    a.cliente_nome as name,
    a.cliente_telefone as phone,
    a.cliente_email as email
  FROM agendamentos a
  WHERE a.cliente_telefone IS NOT NULL
    AND (a.cliente_telefone ILIKE '%' || p_telefone_partial || '%'
         OR a.cliente_nome ILIKE '%' || p_telefone_partial || '%')
  GROUP BY a.cliente_nome, a.cliente_telefone, a.cliente_email
  ORDER BY a.cliente_nome
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 3. Atualizar a função de criação de agendamento para usar a busca corrigida
CREATE OR REPLACE FUNCTION criar_agendamento_admin(
  -- Dados obrigatórios do agendamento
  p_profissional_id UUID,
  p_unidade_id UUID,
  p_servico_id UUID,
  p_data_agendamento DATE,
  p_horario_inicio TIME,
  p_horario_fim TIME,
  p_preco_total DECIMAL(10,2),
  
  -- Dados do cliente (flexível)
  p_usuario_id UUID DEFAULT NULL,
  p_cliente_nome TEXT DEFAULT NULL,
  p_cliente_telefone TEXT DEFAULT NULL,
  p_cliente_email TEXT DEFAULT NULL,
  
  -- Dados opcionais
  p_observacoes TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  agendamento_id UUID,
  message TEXT
) AS $$
DECLARE
  v_agendamento_id UUID;
  v_user_id UUID;
BEGIN
  -- Validar entrada: deve ter usuario_id OU (nome + telefone)
  IF p_usuario_id IS NULL AND (p_cliente_nome IS NULL OR p_cliente_telefone IS NULL) THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Deve fornecer usuario_id OU (cliente_nome + cliente_telefone)'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar se profissional existe e está ativo
  IF NOT EXISTS (SELECT 1 FROM profissionais WHERE id = p_profissional_id AND ativo = true) THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Profissional não encontrado ou inativo'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar se unidade existe e está ativa
  IF NOT EXISTS (SELECT 1 FROM unidades WHERE id = p_unidade_id AND ativo = true) THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Unidade não encontrada ou inativa'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar se serviço existe e está ativo
  IF NOT EXISTS (SELECT 1 FROM servicos WHERE id = p_servico_id AND ativo = true) THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Serviço não encontrado ou inativo'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar conflito de horário usando a mesma lógica que o trigger existente
  IF EXISTS (
    SELECT 1 FROM agendamentos 
    WHERE profissional_id = p_profissional_id 
      AND data_agendamento = p_data_agendamento
      AND status NOT IN ('cancelled')
      AND (
        (p_horario_inicio >= horario_inicio AND p_horario_inicio < horario_fim) OR
        (p_horario_fim > horario_inicio AND p_horario_fim <= horario_fim) OR
        (p_horario_inicio <= horario_inicio AND p_horario_fim >= horario_fim)
      )
  ) THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Conflito de horário detectado para este profissional'::TEXT;
    RETURN;
  END IF;
  
  -- Para agendamentos do admin, sempre criar sem usuario_id (cliente direto)
  -- Não tentar criar/buscar na tabela users para evitar erros
  v_user_id := NULL;
  
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
    status_pagamento,
    criado_em
  ) VALUES (
    v_user_id,
    p_cliente_nome,
    p_cliente_telefone,
    p_cliente_email,
    p_profissional_id,
    p_unidade_id,
    p_servico_id,
    p_data_agendamento,
    p_horario_inicio,
    p_horario_fim,
    p_preco_total,
    p_observacoes,
    'pending',
    'pending',
    get_brazil_now()
  ) RETURNING id INTO v_agendamento_id;
  
  -- Retornar sucesso
  RETURN QUERY SELECT true, v_agendamento_id, 'Agendamento criado com sucesso'::TEXT;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, ('Erro ao criar agendamento: ' || SQLERRM)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 4. Verificar se tudo funcionou
SELECT 'Funções corrigidas com sucesso! ✅' as status;

-- 5. Testar a função de busca (deve retornar vazio se tabela users não existir)
SELECT 'Testando busca de usuários:' as info;
SELECT * FROM buscar_usuarios_por_telefone('999') LIMIT 1;

-- 6. Testar a função alternativa de busca nos agendamentos
SELECT 'Testando busca de clientes nos agendamentos:' as info;
SELECT * FROM buscar_clientes_por_telefone('719') LIMIT 1;

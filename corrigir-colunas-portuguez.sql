-- Corrigir as funções para usar nomes das colunas em português da tabela users
-- Execute este script no Supabase SQL Editor

-- 1. Corrigir função buscar_usuarios_por_telefone com nomes corretos das colunas
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
    -- Usar os nomes corretos das colunas em português
    RETURN QUERY
    SELECT 
      u.id, 
      u.nome as name,        -- coluna 'nome' retornada como 'name' 
      u.telefone as phone,   -- coluna 'telefone' retornada como 'phone'
      u.email
    FROM users u
    WHERE u.telefone ILIKE '%' || p_telefone_partial || '%'
       OR u.nome ILIKE '%' || p_telefone_partial || '%'
    ORDER BY u.nome
    LIMIT 10;
  ELSE
    -- Se a tabela não existe, retornar vazio
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Corrigir função criar_agendamento_admin para usar nomes corretos
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
  
  -- Verificar conflito de horário
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
  
  -- Se forneceu usuario_id, usar ele
  IF p_usuario_id IS NOT NULL THEN
    -- Verificar se usuário existe
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_usuario_id) THEN
      RETURN QUERY SELECT false, NULL::UUID, 'Usuário não encontrado'::TEXT;
      RETURN;
    END IF;
    v_user_id := p_usuario_id;
  ELSE
    -- Tentar encontrar usuário existente por telefone (usando nome correto da coluna)
    SELECT id INTO v_user_id FROM users WHERE telefone = p_cliente_telefone LIMIT 1;
    
    -- Se não encontrou, criar novo usuário
    IF v_user_id IS NULL THEN
      INSERT INTO users (nome, telefone, email)
      VALUES (p_cliente_nome, p_cliente_telefone, p_cliente_email)
      RETURNING id INTO v_user_id;
    END IF;
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
    status_pagamento,
    criado_em
  ) VALUES (
    v_user_id,
    CASE WHEN p_usuario_id IS NULL THEN p_cliente_nome ELSE NULL END,
    CASE WHEN p_usuario_id IS NULL THEN p_cliente_telefone ELSE NULL END,
    CASE WHEN p_usuario_id IS NULL THEN p_cliente_email ELSE NULL END,
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

-- 3. Atualizar view agendamentos_admin para usar nomes corretos
CREATE OR REPLACE VIEW agendamentos_admin AS
SELECT 
  a.id,
  a.data_agendamento,
  a.horario_inicio,
  a.horario_fim,
  a.preco_total,
  a.observacoes,
  a.status,
  a.status_pagamento,
  a.criado_em,
  a.atualizado_em,
  a.usuario_id,
  
  -- Dados do cliente (unificados) - usando nomes corretos das colunas
  COALESCE(u.nome, a.cliente_nome, 'Cliente') as nome_cliente,
  COALESCE(u.telefone, a.cliente_telefone, 'Não informado') as telefone_cliente,
  COALESCE(u.email, a.cliente_email, '') as email_cliente,
  
  -- Tipo de cliente
  CASE 
    WHEN a.usuario_id IS NOT NULL THEN 'cadastrado'
    ELSE 'direto'
  END as tipo_cliente,
  
  -- Dados do profissional
  p.id as profissional_id,
  p.nome as nome_profissional,
  p.especialidade as especialidade_profissional,
  
  -- Dados da unidade
  un.id as unidade_id,
  un.nome as nome_unidade,
  un.endereco as endereco_unidade,
  
  -- Dados do serviço
  s.id as servico_id,
  s.nome as nome_servico,
  s.duracao_minutos as duracao_servico,
  s.preco as preco_servico
  
FROM agendamentos a
LEFT JOIN users u ON a.usuario_id = u.id  -- Agora vai funcionar com as colunas corretas
LEFT JOIN profissionais p ON a.profissional_id = p.id
LEFT JOIN unidades un ON a.unidade_id = un.id
LEFT JOIN servicos s ON a.servico_id = s.id;

-- 4. Verificar se tudo funcionou
SELECT 'Funções corrigidas para usar colunas em português! ✅' as status;

-- 5. Testar a função de busca
SELECT 'Testando busca de usuários:' as info;
SELECT * FROM buscar_usuarios_por_telefone('719') LIMIT 3;

-- 6. Testar a view
SELECT 'Testando view agendamentos_admin:' as info;
SELECT nome_cliente, telefone_cliente FROM agendamentos_admin LIMIT 3;

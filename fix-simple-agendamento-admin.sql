-- Script simples para corrigir a view agendamentos_admin
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, verificar se as colunas necessárias existem na tabela agendamentos
DO $$ 
BEGIN
    -- Verificar se as colunas cliente_* existem na tabela agendamentos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agendamentos' AND column_name = 'cliente_nome'
    ) THEN
        RAISE EXCEPTION 'Execute primeiro o script agendamentos-campos-opcionais.sql para adicionar as colunas necessárias';
    END IF;
    
    RAISE NOTICE 'Colunas cliente_nome, cliente_telefone, cliente_email já existem na tabela agendamentos ✅';
END $$;

-- 2. Remover a view existente se houver
DROP VIEW IF EXISTS agendamentos_admin;

-- 3. Criar a view simplificada que funciona
CREATE VIEW agendamentos_admin AS
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
  
  -- Dados do cliente
  COALESCE(a.cliente_nome, 'Cliente') as nome_cliente,
  COALESCE(a.cliente_telefone, 'Não informado') as telefone_cliente,  
  COALESCE(a.cliente_email, '') as email_cliente,
  
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
LEFT JOIN profissionais p ON a.profissional_id = p.id
LEFT JOIN unidades un ON a.unidade_id = un.id
LEFT JOIN servicos s ON a.servico_id = s.id;

-- 4. Testar a view
SELECT 'View agendamentos_admin criada com sucesso! ✅' as status;

-- 5. Mostrar as primeiras linhas para verificar se funciona
SELECT 
    'Teste da view - Mostrando primeiros agendamentos:' as info
UNION ALL
SELECT 
    CONCAT('ID: ', id::text, ' | Cliente: ', nome_cliente, ' | Data: ', data_agendamento::text) as info
FROM agendamentos_admin
LIMIT 3;

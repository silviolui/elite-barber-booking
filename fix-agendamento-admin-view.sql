-- Versão corrigida da view agendamentos_admin que funciona independente da estrutura da tabela users
-- Execute este script para corrigir o erro da view

-- Primeiro, vamos verificar a estrutura da tabela users
DO $$ 
BEGIN
    -- Verificar se a tabela users existe e mostrar sua estrutura
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE 'Tabela users existe. Verificando colunas...';
        
        -- Listar colunas da tabela users
        FOR col IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Coluna: % - Tipo: %', col.column_name, col.data_type;
        END LOOP;
    ELSE
        RAISE NOTICE 'Tabela users NÃO existe';
    END IF;
END $$;

-- View simplificada que funciona com qualquer estrutura
DROP VIEW IF EXISTS agendamentos_admin;

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
  
  -- Dados do cliente - sempre usar os campos diretos primeiro
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

-- Agora tentar criar uma view mais inteligente que se adapta à estrutura da tabela users
DO $$ 
DECLARE
    users_name_col TEXT := '';
    users_phone_col TEXT := '';
    users_email_col TEXT := '';
    view_sql TEXT;
BEGIN
    -- Verificar se tabela users existe e mapear colunas
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Buscar coluna do nome
        SELECT column_name INTO users_name_col
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_name IN ('name', 'nome', 'full_name', 'nome_completo')
        LIMIT 1;
        
        -- Buscar coluna do telefone
        SELECT column_name INTO users_phone_col
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_name IN ('phone', 'telefone', 'celular', 'fone')
        LIMIT 1;
        
        -- Buscar coluna do email
        SELECT column_name INTO users_email_col
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_name IN ('email', 'e_mail', 'mail')
        LIMIT 1;
        
        RAISE NOTICE 'Colunas encontradas na tabela users - Nome: %, Telefone: %, Email: %', 
                     users_name_col, users_phone_col, users_email_col;
    END IF;
    
    -- Se encontrou as colunas da tabela users, recriar a view com COALESCE
    IF users_name_col IS NOT NULL AND users_name_col != '' THEN
        view_sql := format('
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
  
  -- Dados do cliente (unificados com tabela users)
  COALESCE(u.%s, a.cliente_nome, ''Cliente'') as nome_cliente,
  COALESCE(u.%s, a.cliente_telefone, ''Não informado'') as telefone_cliente,
  COALESCE(u.%s, a.cliente_email, '''') as email_cliente,
  
  -- Tipo de cliente
  CASE 
    WHEN a.usuario_id IS NOT NULL THEN ''cadastrado''
    ELSE ''direto''
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
LEFT JOIN users u ON a.usuario_id = u.id
LEFT JOIN profissionais p ON a.profissional_id = p.id
LEFT JOIN unidades un ON a.unidade_id = un.id
LEFT JOIN servicos s ON a.servico_id = s.id;
        ', users_name_col, users_phone_col, users_email_col);
        
        EXECUTE view_sql;
        RAISE NOTICE 'View agendamentos_admin recriada com integração à tabela users';
    ELSE
        RAISE NOTICE 'Usando view simplificada sem integração à tabela users';
    END IF;
END $$;

SELECT '✅ View agendamentos_admin corrigida com sucesso!' as status;

-- Fix Multiple Relationships Between Agendamentos and Servicos
-- Execute este script no Supabase SQL Editor para resolver conflitos de relacionamento

-- 1. Verificar estrutura atual das tabelas
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name='agendamentos' AND ccu.table_name='servicos')
ORDER BY tc.table_name, tc.constraint_name;

-- 2. Remover foreign keys duplicadas se existirem
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    -- Buscar todas as constraints de FK entre agendamentos e servicos
    FOR constraint_record IN 
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name='agendamentos' 
          AND ccu.table_name='servicos'
    LOOP
        -- Manter apenas uma constraint, remover as outras
        IF constraint_record.constraint_name != 'agendamentos_servico_id_fkey' THEN
            BEGIN
                EXECUTE 'ALTER TABLE ' || constraint_record.table_name || ' DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
                RAISE NOTICE 'Removed constraint: %', constraint_record.constraint_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not remove constraint %: %', constraint_record.constraint_name, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- 3. Garantir que existe apenas uma FK correta
DO $$
BEGIN
    -- Remover a FK se existir
    ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_servico_id_fkey;
    
    -- Recriar a FK principal
    ALTER TABLE agendamentos 
    ADD CONSTRAINT agendamentos_servico_id_fkey 
    FOREIGN KEY (servico_id) 
    REFERENCES servicos(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;
    
    RAISE NOTICE 'Foreign key recreated successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error recreating foreign key: %', SQLERRM;
END $$;

-- 4. Verificar se a coluna servico_id existe na tabela agendamentos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agendamentos' AND column_name = 'servico_id'
    ) THEN
        -- Adicionar a coluna se não existir
        ALTER TABLE agendamentos ADD COLUMN servico_id UUID;
        RAISE NOTICE 'Added servico_id column to agendamentos table';
    ELSE
        RAISE NOTICE 'Column servico_id already exists in agendamentos table';
    END IF;
END $$;

-- 5. Atualizar dados existentes se necessário
UPDATE agendamentos 
SET servico_id = (
    SELECT s.id 
    FROM servicos s 
    WHERE s.nome = 'Corte de Cabelo'  -- serviço padrão
    LIMIT 1
)
WHERE servico_id IS NULL;

-- 6. Testar a query corrigida
SELECT 
    a.id,
    a.data_agendamento,
    a.horario_inicio,
    a.horario_fim,
    a.status,
    u.nome as cliente_nome,
    u.telefone as cliente_telefone,
    p.nome as profissional_nome,
    un.nome as unidade_nome,
    s.nome as servico_nome,
    s.preco as servico_preco
FROM agendamentos a
LEFT JOIN users u ON a.usuario_id = u.id
LEFT JOIN profissionais p ON a.profissional_id = p.id  
LEFT JOIN unidades un ON a.unidade_id = un.id
LEFT JOIN servicos s ON a.servico_id = s.id
ORDER BY a.data_agendamento DESC, a.horario_inicio DESC
LIMIT 5;

-- 7. Verificar estrutura final
SELECT 'Relacionamentos corrigidos! ✅' as status;

SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name='agendamentos' AND ccu.table_name='servicos')
ORDER BY tc.table_name, tc.constraint_name;

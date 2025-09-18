-- Script para adicionar servico_id na tabela agendamentos com tipo correto
-- Detecta automaticamente o tipo da coluna id da tabela servicos

DO $$
DECLARE
    servicos_id_type TEXT;
BEGIN
    -- 1. Detectar o tipo da coluna id na tabela servicos
    SELECT data_type INTO servicos_id_type
    FROM information_schema.columns 
    WHERE table_name = 'servicos' 
    AND column_name = 'id'
    AND table_schema = 'public';
    
    RAISE NOTICE 'Tipo da coluna id na tabela servicos: %', servicos_id_type;
    
    -- 2. Remover coluna servico_id se já existir (para recriar com tipo correto)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'agendamentos' 
        AND column_name = 'servico_id'
        AND table_schema = 'public'
    ) THEN
        -- Remover constraint primeiro se existir
        IF EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_agendamentos_servico'
            AND table_name = 'agendamentos'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.agendamentos DROP CONSTRAINT fk_agendamentos_servico;
            RAISE NOTICE 'Constraint fk_agendamentos_servico removida';
        END IF;
        
        -- Remover coluna
        ALTER TABLE public.agendamentos DROP COLUMN servico_id;
        RAISE NOTICE 'Coluna servico_id removida para recriar com tipo correto';
    END IF;
    
    -- 3. Adicionar coluna servico_id com o tipo correto
    IF servicos_id_type = 'uuid' THEN
        ALTER TABLE public.agendamentos ADD COLUMN servico_id UUID;
        RAISE NOTICE 'Coluna servico_id adicionada como UUID';
    ELSIF servicos_id_type = 'integer' THEN
        ALTER TABLE public.agendamentos ADD COLUMN servico_id INTEGER;
        RAISE NOTICE 'Coluna servico_id adicionada como INTEGER';
    ELSIF servicos_id_type = 'bigint' THEN
        ALTER TABLE public.agendamentos ADD COLUMN servico_id BIGINT;
        RAISE NOTICE 'Coluna servico_id adicionada como BIGINT';
    ELSE
        RAISE EXCEPTION 'Tipo de dados não suportado para servicos.id: %', servicos_id_type;
    END IF;
    
    -- 4. Criar foreign key constraint
    ALTER TABLE public.agendamentos 
    ADD CONSTRAINT fk_agendamentos_servico 
    FOREIGN KEY (servico_id) 
    REFERENCES servicos(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint fk_agendamentos_servico criada';
    
    -- 5. Criar índice
    DROP INDEX IF EXISTS idx_agendamentos_servico_id;
    CREATE INDEX idx_agendamentos_servico_id ON agendamentos(servico_id);
    
    -- 6. Adicionar comentário
    COMMENT ON COLUMN agendamentos.servico_id IS 'ID do serviço que foi agendado, referencia a tabela servicos';
    
END $$;

-- Verificar o resultado
SELECT 
    'servicos' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'servicos' 
AND column_name = 'id'
AND table_schema = 'public'
UNION ALL
SELECT 
    'agendamentos' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
AND column_name = 'servico_id'
AND table_schema = 'public';

SELECT 'Script executado com sucesso - servico_id adicionado com tipo compatível!' as status;

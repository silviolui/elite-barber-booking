-- Adicionar coluna servico_id na tabela agendamentos
-- Esta coluna vai referenciar a tabela servicos para identificar qual serviço foi agendado

-- 1. Adicionar a coluna servico_id se ela não existir
DO $$
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'agendamentos' 
        AND column_name = 'servico_id'
        AND table_schema = 'public'
    ) THEN
        -- Verificar tipo da coluna id na tabela servicos
        -- e adicionar servico_id com o tipo compatível
        
        -- Primeiro tentar UUID (padrão do sistema)
        ALTER TABLE public.agendamentos 
        ADD COLUMN servico_id UUID;
        
        RAISE NOTICE 'Coluna servico_id adicionada à tabela agendamentos';
    ELSE
        RAISE NOTICE 'Coluna servico_id já existe na tabela agendamentos';
    END IF;
END $$;

-- 2. Criar a foreign key constraint para referenciar a tabela servicos
DO $$
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_agendamentos_servico'
        AND table_name = 'agendamentos'
        AND table_schema = 'public'
    ) THEN
        -- Adicionar a foreign key
        ALTER TABLE public.agendamentos 
        ADD CONSTRAINT fk_agendamentos_servico 
        FOREIGN KEY (servico_id) 
        REFERENCES servicos(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint fk_agendamentos_servico criada';
    ELSE
        RAISE NOTICE 'Foreign key constraint fk_agendamentos_servico já existe';
    END IF;
END $$;

-- 3. Criar índice para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_agendamentos_servico_id 
ON agendamentos(servico_id);

-- 4. Adicionar comentário para documentação
COMMENT ON COLUMN agendamentos.servico_id IS 'ID do serviço que foi agendado, referencia a tabela servicos';

-- 5. Verificar a estrutura final da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- LOGS
SELECT 'Coluna servico_id adicionada à tabela agendamentos com sucesso!' as status;

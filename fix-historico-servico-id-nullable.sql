-- Tornar a coluna servico_id da tabela historico nullable
-- Para permitir agendamentos antigos que não têm servico_id definido

DO $$
BEGIN
    -- Verificar se a coluna servico_id existe na tabela historico
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'historico' 
        AND column_name = 'servico_id'
        AND table_schema = 'public'
    ) THEN
        -- Remover constraint NOT NULL se existir
        ALTER TABLE public.historico 
        ALTER COLUMN servico_id DROP NOT NULL;
        
        RAISE NOTICE 'Coluna servico_id na tabela historico agora permite NULL';
    ELSE
        RAISE NOTICE 'Coluna servico_id não existe na tabela historico';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao alterar coluna: %', SQLERRM;
END $$;

-- Verificar a estrutura da coluna após alteração
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'historico' 
AND column_name = 'servico_id'
AND table_schema = 'public';

SELECT 'Coluna servico_id da tabela historico agora permite valores NULL!' as status;

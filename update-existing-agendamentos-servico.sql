-- Script para atualizar agendamentos existentes que não têm servico_id
-- Define um serviço padrão para agendamentos com servico_id NULL

DO $$
DECLARE
    servico_padrao_id UUID;
    agendamentos_sem_servico INTEGER;
BEGIN
    -- 1. Contar quantos agendamentos não têm serviço
    SELECT COUNT(*) INTO agendamentos_sem_servico
    FROM agendamentos 
    WHERE servico_id IS NULL;
    
    RAISE NOTICE 'Encontrados % agendamentos sem serviço definido', agendamentos_sem_servico;
    
    IF agendamentos_sem_servico > 0 THEN
        -- 2. Buscar um serviço padrão (primeiro serviço ativo da tabela)
        SELECT id INTO servico_padrao_id
        FROM servicos 
        WHERE ativo = true 
        ORDER BY nome
        LIMIT 1;
        
        IF servico_padrao_id IS NOT NULL THEN
            -- 3. Atualizar agendamentos sem serviço com o serviço padrão
            UPDATE agendamentos 
            SET servico_id = servico_padrao_id
            WHERE servico_id IS NULL;
            
            RAISE NOTICE 'Agendamentos atualizados com serviço padrão: %', servico_padrao_id;
        ELSE
            RAISE NOTICE 'Nenhum serviço ativo encontrado na tabela servicos';
        END IF;
    ELSE
        RAISE NOTICE 'Todos os agendamentos já têm serviço definido';
    END IF;
END $$;

-- Verificar o resultado
SELECT 
    'Antes da atualização' as status,
    COUNT(*) as total_agendamentos,
    COUNT(servico_id) as com_servico,
    COUNT(*) - COUNT(servico_id) as sem_servico
FROM agendamentos
UNION ALL
SELECT 
    'Serviço usado como padrão' as status,
    s.nome as total_agendamentos,
    '' as com_servico, 
    '' as sem_servico
FROM servicos s
WHERE s.ativo = true
ORDER BY s.nome
LIMIT 1;

SELECT 'Agendamentos atualizados com sucesso!' as resultado;

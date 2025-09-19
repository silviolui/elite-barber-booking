-- Tornar serviços específicos por unidade
-- Cada unidade gerencia apenas seus próprios serviços

-- 1. Adicionar coluna unidade_id na tabela servicos
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_servicos_unidade_id ON servicos(unidade_id);

-- 3. Atualizar serviços existentes para serem globais (NULL) temporariamente
-- Isso permite que todas as unidades vejam os serviços existentes inicialmente
UPDATE servicos 
SET unidade_id = NULL 
WHERE unidade_id IS NULL;

-- 4. OU se preferir, associar serviços existentes a unidades específicas
-- Descomente e execute o bloco abaixo se quiser associar serviços às unidades:

/*
DO $$
DECLARE
    unidade_boulevard UUID;
    unidade_centro UUID;
    servico_corte UUID;
    servico_barba UUID;
BEGIN
    -- Buscar IDs das unidades
    SELECT id INTO unidade_boulevard FROM unidades WHERE nome ILIKE '%boulevard%' LIMIT 1;
    SELECT id INTO unidade_centro FROM unidades WHERE nome ILIKE '%centro%' LIMIT 1;
    
    -- Buscar IDs dos serviços
    SELECT id INTO servico_corte FROM servicos WHERE nome ILIKE '%corte%' LIMIT 1;
    SELECT id INTO servico_barba FROM servicos WHERE nome ILIKE '%barba%' LIMIT 1;
    
    -- Associar serviços às unidades (exemplo)
    IF unidade_boulevard IS NOT NULL AND servico_corte IS NOT NULL THEN
        UPDATE servicos SET unidade_id = unidade_boulevard WHERE id = servico_corte;
        RAISE NOTICE 'Serviço Corte associado ao Boulevard';
    END IF;
    
    IF unidade_centro IS NOT NULL AND servico_barba IS NOT NULL THEN
        UPDATE servicos SET unidade_id = unidade_centro WHERE id = servico_barba;
        RAISE NOTICE 'Serviço Barba associado ao Centro';
    END IF;
END $$;
*/

-- 5. Comentário para documentação
COMMENT ON COLUMN servicos.unidade_id IS 'ID da unidade proprietária do serviço. NULL = serviço global (visível para todas)';

-- 6. Verificar estrutura
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'servicos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Verificar serviços e suas unidades
SELECT 
    s.nome as servico,
    COALESCE(u.nome, 'SERVIÇO GLOBAL') as unidade,
    s.preco,
    s.ativo
FROM servicos s
LEFT JOIN unidades u ON s.unidade_id = u.id
ORDER BY u.nome NULLS FIRST, s.nome;

SELECT 'Serviços agora são específicos por unidade!' as resultado;

-- INSTRUÇÕES DE USO:
-- 
-- 1. CRIAR SERVIÇO PARA UNIDADE ESPECÍFICA:
-- INSERT INTO servicos (nome, preco, duracao_minutos, unidade_id) 
-- VALUES ('Serviço Específico', 50.00, 30, 'UUID_DA_UNIDADE');
--
-- 2. TORNAR SERVIÇO GLOBAL (visível para todas as unidades):
-- UPDATE servicos SET unidade_id = NULL WHERE id = 'UUID_DO_SERVICO';
--
-- 3. MOVER SERVIÇO PARA OUTRA UNIDADE:
-- UPDATE servicos SET unidade_id = 'UUID_NOVA_UNIDADE' WHERE id = 'UUID_DO_SERVICO';

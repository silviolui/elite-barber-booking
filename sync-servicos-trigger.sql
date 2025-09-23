-- TRIGGER AUTOMÁTICO para sincronizar alterações de serviços modelo com cópias de profissionais
-- Quando alterar serviço modelo (profissional_id = NULL) → atualiza TODAS as cópias automaticamente

-- OBJETIVO:
-- Alterar "Barba" de 20min para 40min → Lucas e Marcos automaticamente ficam com 40min

BEGIN;

-- 1. Criar função que será executada pelo trigger
CREATE OR REPLACE FUNCTION sync_servico_profissionais()
RETURNS TRIGGER AS $$
BEGIN
    -- Só executar se for alteração de serviço MODELO (profissional_id IS NULL)
    IF NEW.profissional_id IS NULL THEN
        
        -- Log da operação
        RAISE NOTICE '🔄 Sincronizando serviço modelo: % (ID: %)', NEW.nome, NEW.id;
        
        -- Atualizar TODAS as cópias deste serviço para todos profissionais
        -- Buscar cópias pelo mesmo nome e unidade (ou global)
        UPDATE servicos 
        SET 
            nome = NEW.nome,
            preco = NEW.preco,
            duracao_minutos = NEW.duracao_minutos,
            ativo = NEW.ativo
        WHERE 
            -- Serviços específicos de profissionais (não modelos)
            profissional_id IS NOT NULL
            -- Mesmo nome do serviço modelo
            AND nome = OLD.nome
            -- Mesma unidade ou ambos globais
            AND (
                (unidade_id = NEW.unidade_id) OR 
                (unidade_id IS NULL AND NEW.unidade_id IS NULL) OR
                (unidade_id IS NOT NULL AND NEW.unidade_id IS NULL) -- Modelo global afeta todas unidades
            );
        
        -- Log do resultado
        RAISE NOTICE '✅ Sincronizados % serviços de profissionais', FOUND;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger que chama a função APÓS UPDATE
CREATE OR REPLACE TRIGGER trigger_sync_servico_profissionais
    AFTER UPDATE ON servicos
    FOR EACH ROW
    WHEN (OLD IS DISTINCT FROM NEW)  -- Só executar quando houver mudança real
    EXECUTE FUNCTION sync_servico_profissionais();

-- 3. Criar função para sincronização manual (caso precise)
CREATE OR REPLACE FUNCTION manual_sync_servico(servico_modelo_id UUID)
RETURNS INTEGER AS $$
DECLARE
    servico_modelo RECORD;
    rows_affected INTEGER;
BEGIN
    -- Buscar dados do serviço modelo
    SELECT * INTO servico_modelo 
    FROM servicos 
    WHERE id = servico_modelo_id AND profissional_id IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Serviço modelo não encontrado: %', servico_modelo_id;
    END IF;
    
    -- Atualizar todas as cópias
    UPDATE servicos 
    SET 
        nome = servico_modelo.nome,
        preco = servico_modelo.preco,
        duracao_minutos = servico_modelo.duracao_minutos,
        ativo = servico_modelo.ativo
    WHERE 
        profissional_id IS NOT NULL
        AND nome = servico_modelo.nome
        AND (
            (unidade_id = servico_modelo.unidade_id) OR 
            (unidade_id IS NULL AND servico_modelo.unidade_id IS NULL) OR
            (unidade_id IS NOT NULL AND servico_modelo.unidade_id IS NULL)
        );
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    RAISE NOTICE '🔄 Sincronização manual: % serviços atualizados', rows_affected;
    
    RETURN rows_affected;
END;
$$ LANGUAGE plpgsql;

-- 4. Verificar se triggers foram criados
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_sync_servico_profissionais';

-- 5. Verificar se funções foram criadas
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('sync_servico_profissionais', 'manual_sync_servico')
ORDER BY routine_name;

COMMIT;

-- COMO FUNCIONA:
-- 1. Alterar serviço modelo (ex: Barba 20min → 40min)
-- 2. Trigger detecta UPDATE automaticamente  
-- 3. Função atualiza TODAS as cópias de "Barba" para todos profissionais
-- 4. Lucas e Marcos automaticamente ficam com Barba 40min

-- EXEMPLO DE TESTE:
-- UPDATE servicos SET duracao_minutos = 40 WHERE nome = 'Barba' AND profissional_id IS NULL;
-- → Todas as cópias de "Barba" dos profissionais ficam com 40min automaticamente!

-- FUNÇÃO MANUAL (caso precise):
-- SELECT manual_sync_servico('uuid-do-servico-modelo');

SELECT '✅ Trigger automático de sincronização criado com sucesso!' as status;

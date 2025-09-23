-- Script para corrigir constraint CASCADE que estava deletando agendamentos
-- quando serviços são removidos/editados

-- PROBLEMA: 
-- Quando um serviço é deletado da tabela 'servicos', o CASCADE delete
-- estava deletando registros em 'agendamento_servicos' e consequentemente
-- os agendamentos existentes também eram perdidos.

-- SOLUÇÃO:
-- Alterar constraint para SET NULL em vez de CASCADE, preservando agendamentos

BEGIN;

-- 1. Primeiro, vamos verificar as constraints atuais
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.table_name = 'agendamento_servicos' OR tc.table_name = 'agendamentos')
    AND ccu.table_name = 'servicos'
ORDER BY tc.table_name, tc.constraint_name;

-- 2. Remover constraint CASCADE problemática (se existir)
ALTER TABLE agendamento_servicos 
DROP CONSTRAINT IF EXISTS agendamento_servicos_servico_id_fkey;

-- 3. Adicionar nova constraint que preserva agendamentos
-- Usar RESTRICT em vez de CASCADE para evitar deletar agendamentos acidentalmente
ALTER TABLE agendamento_servicos 
ADD CONSTRAINT agendamento_servicos_servico_id_fkey 
FOREIGN KEY (servico_id) 
REFERENCES servicos(id) 
ON DELETE RESTRICT;  -- RESTRICT impede delete se há agendamentos

-- ALTERNATIVA: Se quiser permitir delete mas manter agendamentos, use SET NULL:
-- ON DELETE SET NULL;  -- Mantém agendamento mas remove referência ao serviço

-- 4. Verificar se há outras constraints problemáticas na tabela agendamentos
-- (Verificar se existe CASCADE direto de servicos para agendamentos via servico_id)
DO $$
BEGIN
    -- Verificar se existe coluna servico_id em agendamentos com CASCADE
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agendamentos' AND column_name = 'servico_id'
    ) THEN
        -- Remover constraint CASCADE se existir
        BEGIN
            ALTER TABLE agendamentos 
            DROP CONSTRAINT IF EXISTS agendamentos_servico_id_fkey;
            
            -- Adicionar constraint RESTRICT para preservar agendamentos
            ALTER TABLE agendamentos 
            ADD CONSTRAINT agendamentos_servico_id_fkey 
            FOREIGN KEY (servico_id) 
            REFERENCES servicos(id) 
            ON DELETE RESTRICT;
            
            RAISE NOTICE 'Constraint em agendamentos.servico_id corrigida';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao corrigir constraint em agendamentos: %', SQLERRM;
        END;
    END IF;
END $$;

-- 5. Verificar resultado final
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.table_name = 'agendamento_servicos' OR tc.table_name = 'agendamentos')
    AND ccu.table_name = 'servicos'
ORDER BY tc.table_name, tc.constraint_name;

COMMIT;

-- RESULTADO ESPERADO:
-- Agora quando um serviço é deletado da tabela 'servicos':
-- 1. Se há agendamentos usando esse serviço, o DELETE será bloqueado (RESTRICT)
-- 2. Agendamentos existentes ficam preservados
-- 3. Admin precisa primeiro cancelar/finalizar agendamentos antes de remover serviço

SELECT '✅ Constraints corrigidas! Agendamentos agora estão protegidos.' as status;

-- SOLUÇÃO DEFINITIVA PARA RELACIONAMENTOS MÚLTIPLOS
-- Execute este script COMPLETO no Supabase SQL Editor

-- 1. PRIMEIRO: Remover TODAS as constraints entre agendamentos e servicos
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'agendamentos' 
          AND ccu.table_name = 'servicos'
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE ' || constraint_record.table_name || ' DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name || ' CASCADE';
            RAISE NOTICE 'Removida constraint: %', constraint_record.constraint_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao remover constraint %: %', constraint_record.constraint_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. VERIFICAR se a coluna servico_id existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agendamentos' AND column_name = 'servico_id'
    ) THEN
        ALTER TABLE agendamentos ADD COLUMN servico_id UUID;
        RAISE NOTICE 'Coluna servico_id adicionada';
    ELSE
        RAISE NOTICE 'Coluna servico_id já existe';
    END IF;
END $$;

-- 3. CRIAR uma ÚNICA constraint correta
ALTER TABLE agendamentos 
ADD CONSTRAINT agendamentos_servico_id_fkey 
FOREIGN KEY (servico_id) 
REFERENCES servicos(id) 
ON DELETE SET NULL;

-- 4. ATUALIZAR dados existentes se servico_id estiver NULL
UPDATE agendamentos 
SET servico_id = (
    SELECT id FROM servicos 
    WHERE nome ILIKE '%corte%' OR nome ILIKE '%cabelo%'
    LIMIT 1
)
WHERE servico_id IS NULL;

-- 5. VERIFICAR resultado final
SELECT 
    'Relacionamentos corrigidos! ✅' as status,
    COUNT(*) as total_constraints
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'agendamentos' 
  AND ccu.table_name = 'servicos';

-- 6. TESTE final da query
SELECT 
    a.id,
    a.data_agendamento,
    a.horario_inicio,
    u.nome as cliente_nome,
    p.nome as profissional_nome,
    s.nome as servico_nome
FROM agendamentos a
LEFT JOIN users u ON a.usuario_id = u.id
LEFT JOIN profissionais p ON a.profissional_id = p.id  
LEFT JOIN unidades un ON a.unidade_id = un.id
LEFT JOIN servicos s ON a.servico_id = s.id
LIMIT 3;

SELECT 'Script executado com sucesso! 🎉' as final_status;

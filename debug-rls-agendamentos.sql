-- Debug: Verificar RLS na tabela agendamentos

-- Verificar se RLS está habilitado
SELECT 
    tablename,
    rowsecurity,
    relname
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename  
WHERE t.tablename = 'agendamentos';

-- Verificar políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'agendamentos';

-- Temporariamente desabilitar RLS para debug (CUIDADO EM PRODUÇÃO!)
-- ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;

-- Para reabilitar depois:
-- ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Verificar dados existentes na tabela
SELECT 
    id,
    usuario_id,
    profissional_id,
    unidade_id,
    data_agendamento,
    status,
    created_at
FROM agendamentos 
ORDER BY created_at DESC
LIMIT 10;

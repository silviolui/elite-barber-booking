-- Debug: Verificar dados na tabela agendamentos

-- 1. Consulta mais simples - verificar se há dados
SELECT COUNT(*) as total_agendamentos FROM public.agendamentos;

-- 2. Verificar últimos agendamentos (todas as colunas básicas)
SELECT 
    id,
    usuario_id,
    profissional_id,
    unidade_id,
    data_agendamento,
    horario_inicio,
    horario_fim,
    status
FROM public.agendamentos 
ORDER BY data_agendamento DESC, horario_inicio DESC
LIMIT 10;

-- 3. Verificar agendamentos por unidade
SELECT 
    unidade_id,
    COUNT(*) as total_por_unidade
FROM public.agendamentos 
GROUP BY unidade_id
ORDER BY unidade_id;

-- 2. Verificar se RLS está habilitado (execute separadamente)
-- SELECT 
--     tablename,
--     rowsecurity
-- FROM pg_tables 
-- WHERE tablename = 'agendamentos';

-- 3. Verificar políticas RLS existentes (execute separadamente)
-- SELECT 
--     schemaname,
--     tablename,
--     policyname,
--     permissive,
--     roles,
--     cmd,
--     qual,
--     with_check
-- FROM pg_policies 
-- WHERE tablename = 'agendamentos';

-- 4. Temporariamente desabilitar RLS para debug (CUIDADO EM PRODUÇÃO!)
-- Execute apenas se necessário:
-- ALTER TABLE public.agendamentos DISABLE ROW LEVEL SECURITY;

-- 5. Para reabilitar depois:
-- ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Debug: Verificar agendamentos para o cliente logado

-- 1. Ver todos os agendamentos e seus usuario_id
SELECT 
    id,
    usuario_id,
    unidade_id,
    data_agendamento,
    status
FROM public.agendamentos 
ORDER BY data_agendamento DESC
LIMIT 10;

-- 2. Verificar se existe o usuário específico que está logado
-- Substitua 'SEU_USUARIO_ID' pelo ID do console: 06bb5fa4-a7a1-47ba-b039-e9657176cebd
SELECT 
    id,
    email,
    raw_user_meta_data
FROM public.users 
WHERE id = '06bb5fa4-a7a1-47ba-b039-e9657176cebd';

-- 3. Verificar agendamentos específicos deste usuário
SELECT 
    id,
    usuario_id,
    unidade_id,
    data_agendamento,
    horario_inicio,
    horario_fim,
    status
FROM public.agendamentos 
WHERE usuario_id = '06bb5fa4-a7a1-47ba-b039-e9657176cebd'
ORDER BY data_agendamento DESC;

-- 4. Ver todos os usuarios que têm agendamentos
SELECT DISTINCT 
    a.usuario_id,
    u.email,
    u.raw_user_meta_data->'nome' as nome,
    COUNT(a.id) as total_agendamentos
FROM public.agendamentos a
LEFT JOIN public.users u ON u.id = a.usuario_id
GROUP BY a.usuario_id, u.email, u.raw_user_meta_data->'nome'
ORDER BY total_agendamentos DESC;

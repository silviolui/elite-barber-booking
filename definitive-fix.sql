-- SOLUÇÃO DEFINITIVA: Transformar usuário cliente existente em admin

-- 1. Primeiro, execute o SQL da tabela administradores se ainda não executou
-- (create-admin-roles.sql)

-- 2. Depois, transforme o usuário cliente atual em admin:
-- Substitua 'EMAIL_DO_CLIENTE' pelo email que está logado como cliente

DO $$
DECLARE
    cliente_user_id UUID;
    cliente_email TEXT := 'sirviluizgmj@gmail.com'; -- ALTERE AQUI para seu email
BEGIN
    -- Buscar o user_id do cliente
    SELECT id INTO cliente_user_id 
    FROM auth.users 
    WHERE email = cliente_email;
    
    IF cliente_user_id IS NOT NULL THEN
        -- Inserir na tabela administradores
        INSERT INTO administradores (user_id, nome, email, nivel_acesso, ativo)
        VALUES (
            cliente_user_id, 
            'Silvio Luiz - Admin', 
            cliente_email, 
            'super_admin', 
            true
        )
        ON CONFLICT (user_id) DO UPDATE SET
            nivel_acesso = 'super_admin',
            ativo = true;
        
        RAISE NOTICE 'Usuário % agora é administrador!', cliente_email;
    ELSE
        RAISE NOTICE 'Usuário % não encontrado', cliente_email;
    END IF;
END $$;

-- 3. Verificar se deu certo
SELECT 
    u.email as email_usuario,
    a.nome as nome_admin,
    a.nivel_acesso,
    a.ativo
FROM auth.users u
JOIN administradores a ON u.id = a.user_id
WHERE u.email = 'sirviluizgmj@gmail.com'; -- ALTERE AQUI também

SELECT 'Transformação concluída! Agora você pode acessar o painel admin com seu email atual.' as resultado;

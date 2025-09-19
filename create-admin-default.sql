-- Criar administrador padrão com credenciais fixas
-- Email: admin@sistema.com
-- Senha: admin123

-- 1. Primeiro execute o create-admin-roles.sql se ainda não executou

-- 2. Inserir usuário admin diretamente na tabela auth.users (método manual)
-- NOTA: Como não podemos inserir diretamente no auth.users via SQL,
-- você deve fazer este processo:

-- PROCESSO MANUAL:
-- 1. Vá no Supabase Dashboard > Authentication > Users
-- 2. Clique "Add user"
-- 3. Email: admin@sistema.com
-- 4. Password: admin123
-- 5. Confirme o email automaticamente
-- 6. Copie o User ID gerado
-- 7. Execute o comando abaixo substituindo USER_ID_COPIADO

-- 3. OU use este SQL após obter o user_id do usuário criado manualmente:
/*
INSERT INTO administradores (user_id, nome, email, nivel_acesso, ativo)
VALUES (
    'USER_ID_COPIADO_DO_SUPABASE', 
    'Administrador Sistema', 
    'admin@sistema.com', 
    'super_admin', 
    true
);
*/

-- 4. ALTERNATIVA MAIS SIMPLES: Use usuário existente
-- Transforme o usuário atual em admin (substitua o email):

DO $$
DECLARE
    user_id_encontrado UUID;
    email_usuario TEXT := 'sirviluizgmj@gmail.com'; -- ALTERE PARA SEU EMAIL
BEGIN
    -- Buscar user_id do email
    SELECT id INTO user_id_encontrado 
    FROM auth.users 
    WHERE email = email_usuario;
    
    IF user_id_encontrado IS NOT NULL THEN
        -- Inserir/atualizar como admin
        INSERT INTO administradores (user_id, nome, email, nivel_acesso, ativo)
        VALUES (
            user_id_encontrado, 
            'Administrador Principal', 
            email_usuario, 
            'super_admin', 
            true
        )
        ON CONFLICT (user_id) DO UPDATE SET
            nivel_acesso = 'super_admin',
            ativo = true,
            nome = 'Administrador Principal';
        
        RAISE NOTICE 'Email % agora tem acesso administrativo!', email_usuario;
    ELSE
        RAISE NOTICE 'Email % não encontrado no sistema', email_usuario;
    END IF;
END $$;

-- 5. Verificar resultado
SELECT 
    'CREDENCIAIS DE ACESSO:' as info,
    'Email: sirviluizgmj@gmail.com' as email,  -- ALTERE AQUI
    'Senha: (sua senha atual)' as senha,
    'URL: seusite.com/#admin' as url;

SELECT 'Administrador configurado com sucesso!' as status;

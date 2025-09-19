-- Sistema simples de administradores
-- Apenas email, senha e status ativo/inativo

-- 1. Criar tabela simples de administradores (sem dependência do auth.users)
DROP TABLE IF EXISTS public.admin_usuarios CASCADE;

CREATE TABLE public.admin_usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL, -- Senha em texto simples para facilidade
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir admin padrão
INSERT INTO admin_usuarios (email, senha, nome, ativo) 
VALUES (
    'admin@sistema.com',
    'admin123',
    'Administrador Sistema',
    true
);

-- 3. Inserir seu email como admin também
INSERT INTO admin_usuarios (email, senha, nome, ativo) 
VALUES (
    'sirviluizgmj@gmail.com',
    '123456', -- ALTERE PARA SUA SENHA PREFERIDA
    'Silvio Luiz - Admin',
    true
);

-- 4. Desabilitar RLS (sem políticas complexas)
ALTER TABLE admin_usuarios DISABLE ROW LEVEL SECURITY;

-- 5. Verificar resultado
SELECT 
    'CREDENCIAIS CONFIGURADAS:' as info,
    email,
    senha,
    nome,
    CASE WHEN ativo THEN 'PODE ACESSAR' ELSE 'BLOQUEADO' END as status
FROM admin_usuarios;

SELECT 'Sistema de admin simples configurado!' as resultado;

-- INSTRUÇÕES:
-- Para dar acesso: UPDATE admin_usuarios SET ativo = true WHERE email = 'email@exemplo.com';
-- Para remover acesso: UPDATE admin_usuarios SET ativo = false WHERE email = 'email@exemplo.com';
-- Para alterar senha: UPDATE admin_usuarios SET senha = 'nova_senha' WHERE email = 'email@exemplo.com';

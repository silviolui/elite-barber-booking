-- Sistema de roles para separar clientes e administradores

-- 1. Criar tabela de administradores
CREATE TABLE IF NOT EXISTS public.administradores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT,
    nivel_acesso TEXT DEFAULT 'admin' CHECK (nivel_acesso IN ('admin', 'super_admin', 'operador')),
    unidades_acesso UUID[] DEFAULT '{}', -- Array de IDs das unidades que pode acessar (vazio = todas)
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_por UUID REFERENCES auth.users(id),
    
    CONSTRAINT unique_admin_user UNIQUE (user_id)
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_administradores_user_id ON administradores(user_id);
CREATE INDEX IF NOT EXISTS idx_administradores_email ON administradores(email);
CREATE INDEX IF NOT EXISTS idx_administradores_ativo ON administradores(ativo);

-- 3. Enable RLS
ALTER TABLE administradores ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para administradores
-- Apenas administradores podem ver outros administradores
CREATE POLICY "Admins podem ver outros admins" ON administradores 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM administradores 
        WHERE user_id = auth.uid() AND ativo = true
    )
);

-- Permitir criação de admins se não existir nenhum, ou se for super_admin
CREATE POLICY "Permitir criacao de admins" ON administradores 
FOR INSERT WITH CHECK (
    -- Permitir se não existe nenhum admin (primeiro admin)
    NOT EXISTS (SELECT 1 FROM administradores WHERE ativo = true)
    OR
    -- Ou se o usuário atual é super_admin
    EXISTS (
        SELECT 1 FROM administradores 
        WHERE user_id = auth.uid() 
        AND nivel_acesso = 'super_admin' 
        AND ativo = true
    )
);

-- Admins podem atualizar próprio perfil, super_admins podem atualizar todos
CREATE POLICY "Admins podem atualizar perfis" ON administradores 
FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM administradores 
        WHERE user_id = auth.uid() 
        AND nivel_acesso = 'super_admin' 
        AND ativo = true
    )
);

-- 5. Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM administradores 
        WHERE user_id = user_uuid AND ativo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para verificar nível de acesso
CREATE OR REPLACE FUNCTION get_admin_level(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
    nivel TEXT;
BEGIN
    SELECT nivel_acesso INTO nivel
    FROM administradores 
    WHERE user_id = user_uuid AND ativo = true;
    
    RETURN COALESCE(nivel, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. INSTRUÇÃO PARA CRIAR PRIMEIRO ADMIN
-- Execute este processo MANUALMENTE:
-- 
-- 1. Acesse o app admin em seusite.com/#admin
-- 2. Clique em "Criar conta administrativa" 
-- 3. Cadastre-se com email e senha de sua escolha
-- 4. O sistema criará automaticamente o registro na tabela administradores
-- 
-- OU execute o comando abaixo após criar o usuário manualmente no Supabase:
-- 
-- INSERT INTO administradores (user_id, nome, email, nivel_acesso, ativo)
-- VALUES (
--     'SEU_USER_ID_AQUI', 
--     'Administrador Principal', 
--     'seu@email.com', 
--     'super_admin', 
--     true
-- );

-- Comentários
COMMENT ON TABLE administradores IS 'Tabela de administradores do sistema com controle de acesso';
COMMENT ON COLUMN administradores.nivel_acesso IS 'Nível de acesso: admin, super_admin, operador';
COMMENT ON COLUMN administradores.unidades_acesso IS 'Array de UUIDs das unidades que o admin pode acessar. Vazio = todas';

SELECT 'Sistema de administradores configurado com sucesso!' as status;

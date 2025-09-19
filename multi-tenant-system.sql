-- Sistema Multi-Tenant para Unidades Independentes
-- Cada unidade gerencia apenas seus próprios dados

-- 1. Modificar tabela admin_usuarios para incluir unidade_id
ALTER TABLE admin_usuarios ADD COLUMN IF NOT EXISTS unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE;

-- 2. Criar alguns admins de exemplo para diferentes unidades
DO $$
DECLARE
    unidade1_id UUID;
    unidade2_id UUID;
BEGIN
    -- Buscar IDs das unidades existentes
    SELECT id INTO unidade1_id FROM unidades WHERE nome ILIKE '%boulevard%' LIMIT 1;
    SELECT id INTO unidade2_id FROM unidades WHERE nome ILIKE '%centro%' LIMIT 1;
    
    -- Admin para Unidade 1 (Boulevard)
    IF unidade1_id IS NOT NULL THEN
        INSERT INTO admin_usuarios (email, senha, nome, unidade_id, ativo) 
        VALUES (
            'admin.boulevard@sistema.com',
            'boulevard123',
            'Admin Boulevard Shopping',
            unidade1_id,
            true
        ) ON CONFLICT (email) DO UPDATE SET unidade_id = unidade1_id;
        
        RAISE NOTICE 'Admin criado para Boulevard: admin.boulevard@sistema.com / boulevard123';
    END IF;
    
    -- Admin para Unidade 2 (Centro)
    IF unidade2_id IS NOT NULL THEN
        INSERT INTO admin_usuarios (email, senha, nome, unidade_id, ativo) 
        VALUES (
            'admin.centro@sistema.com',
            'centro123',
            'Admin Centro Camaçari',
            unidade2_id,
            true
        ) ON CONFLICT (email) DO UPDATE SET unidade_id = unidade2_id;
        
        RAISE NOTICE 'Admin criado para Centro: admin.centro@sistema.com / centro123';
    END IF;
    
    -- Super Admin (acesso a todas as unidades) - sem unidade_id
    INSERT INTO admin_usuarios (email, senha, nome, unidade_id, ativo) 
    VALUES (
        'superadmin@sistema.com',
        'super123',
        'Super Administrador',
        NULL, -- NULL = acesso a todas as unidades
        true
    ) ON CONFLICT (email) DO UPDATE SET unidade_id = NULL;
    
    RAISE NOTICE 'Super Admin criado: superadmin@sistema.com / super123';
    
END $$;

-- 3. Criar função para verificar se admin tem acesso à unidade
CREATE OR REPLACE FUNCTION admin_pode_acessar_unidade(
    admin_unidade_id UUID,
    target_unidade_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Se admin_unidade_id é NULL, é super admin (acesso total)
    IF admin_unidade_id IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Se não, só pode acessar sua própria unidade
    RETURN admin_unidade_id = target_unidade_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Comentários
COMMENT ON COLUMN admin_usuarios.unidade_id IS 'ID da unidade que este admin gerencia. NULL = super admin (acesso total)';

-- 5. Verificar configuração
SELECT 
    'CREDENCIAIS POR UNIDADE:' as tipo,
    email as login,
    senha,
    nome,
    COALESCE(u.nome, 'TODAS AS UNIDADES') as unidade_acesso,
    CASE WHEN au.ativo THEN 'ATIVO' ELSE 'INATIVO' END as status
FROM admin_usuarios au
LEFT JOIN unidades u ON au.unidade_id = u.id
ORDER BY au.unidade_id NULLS FIRST, au.nome;

SELECT 'Sistema Multi-Tenant configurado com sucesso!' as resultado;

-- INSTRUÇÕES DE USO:
-- 
-- 1. CRIAR ADMIN PARA NOVA UNIDADE:
-- INSERT INTO admin_usuarios (email, senha, nome, unidade_id) 
-- VALUES ('admin.novaunit@sistema.com', 'senha123', 'Admin Nova Unidade', 'UUID_DA_UNIDADE');
--
-- 2. TORNAR ADMIN SUPER ADMIN (acesso total):
-- UPDATE admin_usuarios SET unidade_id = NULL WHERE email = 'email@admin.com';
--
-- 3. RESTRINGIR ADMIN A UMA UNIDADE:
-- UPDATE admin_usuarios SET unidade_id = 'UUID_DA_UNIDADE' WHERE email = 'email@admin.com';

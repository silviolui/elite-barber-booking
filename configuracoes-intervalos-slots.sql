-- CONFIGURAÇÃO DE INTERVALOS DE SLOTS POR UNIDADE
-- Permite configurar intervalos de 10, 20 ou 40 minutos para cada unidade

BEGIN;

-- 1. Criar tabela de configurações por unidade
CREATE TABLE IF NOT EXISTS configuracoes_unidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
    
    -- Configuração de intervalos de slots (10, 20 ou 40 minutos)
    intervalo_slots INTEGER NOT NULL DEFAULT 20 CHECK (intervalo_slots IN (10, 20, 40)),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que cada unidade tenha apenas uma configuração
    UNIQUE(unidade_id)
);

-- 2. Habilitar RLS
ALTER TABLE configuracoes_unidade ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de segurança

-- Super admins podem ver todas as configurações
CREATE POLICY "Super admins podem ver todas configurações" ON configuracoes_unidade
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM admin_usuarios 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Admins de unidade só podem ver a própria configuração
CREATE POLICY "Admins podem ver configuração da própria unidade" ON configuracoes_unidade
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM admin_usuarios a
            WHERE a.id = auth.uid() 
            AND a.role = 'admin'
            AND a.unidade_id = configuracoes_unidade.unidade_id
        )
    );

-- Super admins podem inserir configurações
CREATE POLICY "Super admins podem inserir configurações" ON configuracoes_unidade
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_usuarios 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Admins de unidade podem inserir configuração da própria unidade
CREATE POLICY "Admins podem inserir configuração da própria unidade" ON configuracoes_unidade
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_usuarios a
            WHERE a.id = auth.uid() 
            AND a.role = 'admin'
            AND a.unidade_id = configuracoes_unidade.unidade_id
        )
    );

-- Super admins podem atualizar todas as configurações
CREATE POLICY "Super admins podem atualizar todas configurações" ON configuracoes_unidade
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM admin_usuarios 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Admins de unidade podem atualizar configuração da própria unidade
CREATE POLICY "Admins podem atualizar configuração da própria unidade" ON configuracoes_unidade
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM admin_usuarios a
            WHERE a.id = auth.uid() 
            AND a.role = 'admin'
            AND a.unidade_id = configuracoes_unidade.unidade_id
        )
    );

-- Super admins podem deletar configurações
CREATE POLICY "Super admins podem deletar configurações" ON configuracoes_unidade
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM admin_usuarios 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- 4. Função para buscar configuração de intervalos de uma unidade
CREATE OR REPLACE FUNCTION get_intervalo_slots(unidade_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    intervalo INTEGER;
BEGIN
    -- Buscar configuração específica da unidade
    SELECT intervalo_slots INTO intervalo
    FROM configuracoes_unidade
    WHERE unidade_id = unidade_uuid;
    
    -- Se não encontrar, retornar padrão de 20 minutos
    RETURN COALESCE(intervalo, 20);
END;
$$;

-- 5. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_configuracoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER configuracoes_unidade_updated_at
    BEFORE UPDATE ON configuracoes_unidade
    FOR EACH ROW
    EXECUTE FUNCTION update_configuracoes_updated_at();

-- 6. Inserir configurações padrão para unidades existentes
INSERT INTO configuracoes_unidade (unidade_id, intervalo_slots)
SELECT 
    id as unidade_id,
    20 as intervalo_slots  -- Padrão atual de 20 minutos
FROM unidades
WHERE id NOT IN (
    SELECT unidade_id FROM configuracoes_unidade WHERE unidade_id IS NOT NULL
)
ON CONFLICT (unidade_id) DO NOTHING;

-- 7. Verificar estrutura da tabela criada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'configuracoes_unidade'
ORDER BY ordinal_position;

-- 8. Verificar configurações inseridas
SELECT 
    cu.id,
    u.nome as unidade_nome,
    cu.intervalo_slots,
    cu.created_at
FROM configuracoes_unidade cu
JOIN unidades u ON u.id = cu.unidade_id
ORDER BY u.nome;

COMMIT;

-- EXEMPLO DE USO:
-- 
-- 1. Buscar configuração de intervalos de uma unidade:
-- SELECT get_intervalo_slots('uuid-da-unidade');
-- 
-- 2. Atualizar configuração:
-- UPDATE configuracoes_unidade 
-- SET intervalo_slots = 10 
-- WHERE unidade_id = 'uuid-da-unidade';
-- 
-- 3. Criar nova configuração:
-- INSERT INTO configuracoes_unidade (unidade_id, intervalo_slots) 
-- VALUES ('uuid-da-unidade', 40);

SELECT '✅ Tabela de configurações de intervalos criada com sucesso!' as status;

-- Tabela de relacionamento entre profissionais e serviços
-- Um profissional pode oferecer múltiplos serviços
-- Um serviço pode ser oferecido por múltiplos profissionais

-- 1. Criar tabela de relacionamento
CREATE TABLE IF NOT EXISTS public.profissional_servicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
    servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar duplicatas
    CONSTRAINT unique_profissional_servico UNIQUE (profissional_id, servico_id)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profissional_servicos_profissional ON profissional_servicos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_profissional_servicos_servico ON profissional_servicos(servico_id);
CREATE INDEX IF NOT EXISTS idx_profissional_servicos_ativo ON profissional_servicos(ativo);

-- 3. Desabilitar RLS (para simplicidade)
ALTER TABLE profissional_servicos DISABLE ROW LEVEL SECURITY;

-- 3.1. Remover políticas RLS se existirem
DROP POLICY IF EXISTS "Enable read access for all users" ON profissional_servicos;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON profissional_servicos;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON profissional_servicos;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON profissional_servicos;

-- 4. Comentários
COMMENT ON TABLE profissional_servicos IS 'Relacionamento many-to-many entre profissionais e serviços que eles oferecem';
COMMENT ON COLUMN profissional_servicos.ativo IS 'Se o profissional ainda oferece este serviço';

-- 5. Inserir alguns relacionamentos de exemplo
-- (conectar profissionais existentes com serviços existentes)

-- Buscar IDs de profissionais e serviços para criar relacionamentos de exemplo
DO $$
DECLARE
    prof_record RECORD;
    serv_record RECORD;
BEGIN
    -- Para cada profissional, associar ao primeiro serviço disponível
    FOR prof_record IN 
        SELECT id FROM profissionais WHERE ativo = true LIMIT 3
    LOOP
        FOR serv_record IN 
            SELECT id FROM servicos WHERE ativo = true LIMIT 2
        LOOP
            INSERT INTO profissional_servicos (profissional_id, servico_id, ativo)
            VALUES (prof_record.id, serv_record.id, true)
            ON CONFLICT (profissional_id, servico_id) DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Relacionamentos de exemplo criados';
END $$;

-- 6. Verificar relacionamentos criados
SELECT 
    p.nome as profissional,
    s.nome as servico,
    ps.ativo
FROM profissional_servicos ps
JOIN profissionais p ON ps.profissional_id = p.id
JOIN servicos s ON ps.servico_id = s.id
ORDER BY p.nome, s.nome;

SELECT 'Tabela profissional_servicos criada com sucesso!' as status;

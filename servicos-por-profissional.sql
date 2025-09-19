-- Sistema de serviços individuais por profissional
-- Cada profissional tem suas próprias linhas na tabela servicos

-- 1. Adicionar coluna profissional_id na tabela servicos
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_servicos_profissional_id ON servicos(profissional_id);

-- 3. Comentário para documentação
COMMENT ON COLUMN servicos.profissional_id IS 'ID do profissional que oferece este serviço. NULL = serviço template/base';

-- 4. Verificar estrutura atual
SELECT 
    'ESTRUTURA DA TABELA SERVICOS:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'servicos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verificar serviços atuais
SELECT 
    'SERVIÇOS ATUAIS:' as info,
    s.nome,
    COALESCE(p.nome, 'SERVIÇO BASE/TEMPLATE') as profissional,
    COALESCE(u.nome, 'SEM UNIDADE') as unidade,
    s.preco,
    s.ativo
FROM servicos s
LEFT JOIN profissionais p ON s.profissional_id = p.id
LEFT JOIN unidades u ON s.unidade_id = u.id
ORDER BY p.nome NULLS FIRST, s.nome;

SELECT 'Tabela servicos configurada para profissionais individuais!' as resultado;

-- LÓGICA DO SISTEMA:
-- 
-- 1. SERVIÇOS BASE (profissional_id = NULL):
--    - Servem como templates para criar serviços individuais
--    - Exemplo: "Corte de Cabelo - R$ 30,00 - 30min"
--
-- 2. SERVIÇOS INDIVIDUAIS (profissional_id = ID_DO_PROFISSIONAL):
--    - Criados automaticamente quando profissional seleciona um serviço
--    - Lucas seleciona "Corte" → Cria linha: nome="Corte de Cabelo", profissional_id=Lucas_ID
--    - Marcos seleciona "Corte" → Cria linha: nome="Corte de Cabelo", profissional_id=Marcos_ID
--
-- 3. PREÇOS INDEPENDENTES:
--    - Lucas pode cobrar R$ 35,00 pelo corte
--    - Marcos pode cobrar R$ 40,00 pelo mesmo corte

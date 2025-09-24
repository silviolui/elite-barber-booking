-- Adicionar campos opcionais para permitir agendamentos sem cadastro obrigatório
-- Execute este script no SQL Editor do Supabase Dashboard

BEGIN;

-- 1. Tornar usuario_id opcional (pode ser NULL)
ALTER TABLE agendamentos ALTER COLUMN usuario_id DROP NOT NULL;

-- 2. Adicionar campos para dados diretos do cliente
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS cliente_telefone TEXT;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS cliente_email TEXT;

-- 3. Adicionar constraint para garantir que pelo menos um identificador do cliente exista
ALTER TABLE agendamentos ADD CONSTRAINT check_cliente_info 
  CHECK (
    usuario_id IS NOT NULL OR 
    (cliente_nome IS NOT NULL AND cliente_telefone IS NOT NULL)
  );

-- 4. Criar índices para performance nas consultas por dados diretos
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_telefone ON agendamentos(cliente_telefone);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_nome ON agendamentos(cliente_nome);

-- 5. Função auxiliar para obter nome do cliente (tanto de user cadastrado quanto direto)
CREATE OR REPLACE FUNCTION get_cliente_nome(agend agendamentos)
RETURNS TEXT AS $$
BEGIN
  -- Se tem usuario_id, pegar da tabela users
  IF agend.usuario_id IS NOT NULL THEN
    RETURN (SELECT name FROM users WHERE id = agend.usuario_id);
  ELSE
    -- Senão, usar o nome direto
    RETURN agend.cliente_nome;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Função auxiliar para obter telefone do cliente
CREATE OR REPLACE FUNCTION get_cliente_telefone(agend agendamentos)
RETURNS TEXT AS $$
BEGIN
  IF agend.usuario_id IS NOT NULL THEN
    RETURN (SELECT phone FROM users WHERE id = agend.usuario_id);
  ELSE
    RETURN agend.cliente_telefone;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. View para facilitar consultas com dados completos do cliente
CREATE OR REPLACE VIEW agendamentos_completos AS
SELECT 
  a.*,
  CASE 
    WHEN a.usuario_id IS NOT NULL THEN u.name
    ELSE a.cliente_nome
  END as nome_cliente,
  CASE 
    WHEN a.usuario_id IS NOT NULL THEN u.phone
    ELSE a.cliente_telefone
  END as telefone_cliente,
  CASE 
    WHEN a.usuario_id IS NOT NULL THEN u.email
    ELSE a.cliente_email
  END as email_cliente,
  CASE 
    WHEN a.usuario_id IS NOT NULL THEN 'cadastrado'
    ELSE 'direto'
  END as tipo_cliente,
  p.nome as nome_profissional,
  un.nome as nome_unidade,
  s.nome as nome_servico,
  s.preco as preco_servico
FROM agendamentos a
LEFT JOIN users u ON a.usuario_id = u.id
LEFT JOIN profissionais p ON a.profissional_id = p.id
LEFT JOIN unidades un ON a.unidade_id = un.id
LEFT JOIN servicos s ON a.servico_id = s.id;

-- 8. Atualizar políticas RLS para incluir os novos campos
DROP POLICY IF EXISTS "Admins can view all agendamentos" ON agendamentos;
CREATE POLICY "Admins can view all agendamentos" ON agendamentos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

DROP POLICY IF EXISTS "Users can view own agendamentos" ON agendamentos;
CREATE POLICY "Users can view own agendamentos" ON agendamentos
  FOR SELECT USING (
    usuario_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  );

COMMIT;

-- Verificar as mudanças
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
  AND column_name IN ('usuario_id', 'cliente_nome', 'cliente_telefone', 'cliente_email')
ORDER BY column_name;

SELECT '✅ Tabela agendamentos modificada com sucesso para permitir agendamentos sem cadastro!' as status;

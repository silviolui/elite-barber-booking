-- SISTEMA DE FOLGAS PARA PROFISSIONAIS
-- Tabela para definir folgas específicas e recorrentes para cada profissional

-- 1. CRIAR TABELA DE FOLGAS
CREATE TABLE public.folgas_profissionais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE,
  
  -- Tipo de folga
  tipo_folga TEXT NOT NULL CHECK (tipo_folga IN ('data_especifica', 'dia_semana_recorrente')),
  
  -- Para folgas em datas específicas (ex: 25/09/2025)
  data_folga DATE,
  
  -- Para folgas recorrentes por dia da semana (ex: todas as quartas)
  dia_semana INTEGER CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 1=Segunda, ..., 6=Sábado
  
  -- Informações adicionais
  motivo TEXT, -- Ex: "Férias", "Médico", "Folga pessoal"
  observacoes TEXT,
  
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_folgas_profissionais_profissional ON folgas_profissionais(profissional_id);
CREATE INDEX idx_folgas_profissionais_data ON folgas_profissionais(data_folga);
CREATE INDEX idx_folgas_profissionais_dia_semana ON folgas_profissionais(dia_semana);
CREATE INDEX idx_folgas_profissionais_tipo ON folgas_profissionais(tipo_folga);

-- 3. ENABLE RLS
ALTER TABLE folgas_profissionais ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS - Acesso público para operações CRUD
CREATE POLICY "Acesso publico leitura folgas" ON folgas_profissionais FOR SELECT USING (true);
CREATE POLICY "Acesso publico insercao folgas" ON folgas_profissionais FOR INSERT WITH CHECK (true);
CREATE POLICY "Acesso publico atualizacao folgas" ON folgas_profissionais FOR UPDATE USING (true);
CREATE POLICY "Acesso publico exclusao folgas" ON folgas_profissionais FOR DELETE USING (true);

-- 5. FUNÇÕES AUXILIARES

-- Verificar se profissional está de folga em uma data específica
CREATE OR REPLACE FUNCTION profissional_esta_de_folga(
  profissional_uuid UUID,
  data_verificar DATE
) RETURNS BOOLEAN AS $$
DECLARE
  dia_semana_numero INTEGER;
  tem_folga BOOLEAN := false;
BEGIN
  dia_semana_numero := EXTRACT(DOW FROM data_verificar);
  
  -- Verificar folgas por data específica
  SELECT EXISTS(
    SELECT 1 FROM folgas_profissionais 
    WHERE profissional_id = profissional_uuid 
    AND tipo_folga = 'data_especifica'
    AND data_folga = data_verificar 
    AND ativo = true
  ) INTO tem_folga;
  
  -- Se não tem folga específica, verificar folga recorrente
  IF NOT tem_folga THEN
    SELECT EXISTS(
      SELECT 1 FROM folgas_profissionais 
      WHERE profissional_id = profissional_uuid 
      AND tipo_folga = 'dia_semana_recorrente'
      AND dia_semana = dia_semana_numero 
      AND ativo = true
    ) INTO tem_folga;
  END IF;
  
  RETURN tem_folga;
END;
$$ LANGUAGE plpgsql;

-- Obter todas as folgas de um profissional
CREATE OR REPLACE FUNCTION obter_folgas_profissional(
  profissional_uuid UUID
) RETURNS TABLE(
  id UUID,
  tipo_folga TEXT,
  data_folga DATE,
  dia_semana INTEGER,
  motivo TEXT,
  observacoes TEXT,
  ativo BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fp.id,
    fp.tipo_folga,
    fp.data_folga,
    fp.dia_semana,
    fp.motivo,
    fp.observacoes,
    fp.ativo
  FROM folgas_profissionais fp
  WHERE fp.profissional_id = profissional_uuid
  AND fp.ativo = true
  ORDER BY 
    fp.tipo_folga,
    fp.data_folga,
    fp.dia_semana;
END;
$$ LANGUAGE plpgsql;

-- 6. DADOS DE EXEMPLO (comentado - só para teste)
/*
-- Exemplo: Lucas folga todas as quartas-feiras
INSERT INTO folgas_profissionais (
  profissional_id,
  tipo_folga,
  dia_semana,
  motivo
) VALUES (
  (SELECT id FROM profissionais WHERE nome ILIKE '%lucas%' LIMIT 1),
  'dia_semana_recorrente',
  3, -- Quarta-feira
  'Folga semanal'
);

-- Exemplo: Marcos folga dia 25/09/2025
INSERT INTO folgas_profissionais (
  profissional_id,
  tipo_folga,
  data_folga,
  motivo
) VALUES (
  (SELECT id FROM profissionais WHERE nome ILIKE '%marcos%' LIMIT 1),
  'data_especifica',
  '2025-09-25',
  'Consulta médica'
);
*/

-- 7. VERIFICAR ESTRUTURA
SELECT 
  'TABELA CRIADA:' as info,
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'folgas_profissionais'
ORDER BY ordinal_position;

-- Exemplos de uso das funções:
-- SELECT profissional_esta_de_folga('uuid-do-profissional', '2025-09-25'::DATE);
-- SELECT * FROM obter_folgas_profissional('uuid-do-profissional');

SELECT 'Sistema de folgas para profissionais configurado!' as resultado;

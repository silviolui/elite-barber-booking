-- HORÁRIO DE FUNCIONAMENTO POR UNIDADE
-- Tabela para definir dias e horários de cada unidade

-- 1. CRIAR TABELA DE HORÁRIO DE FUNCIONAMENTO
CREATE TABLE public.horario_funcionamento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 1=Segunda, ..., 6=Sábado
  horario_abertura TIME NOT NULL,
  horario_fechamento TIME NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_horario_funcionamento_unidade ON horario_funcionamento(unidade_id);
CREATE INDEX idx_horario_funcionamento_dia ON horario_funcionamento(dia_semana);

-- 3. ENABLE RLS
ALTER TABLE horario_funcionamento ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICA RLS - Acesso público para leitura
CREATE POLICY "Acesso publico leitura horarios" ON horario_funcionamento FOR SELECT USING (true);

-- 5. INSERIR HORÁRIOS PARA TODAS AS UNIDADES

-- Boulevard Shopping Camaçari - Segunda a Sábado (08:00-20:00)
INSERT INTO horario_funcionamento (unidade_id, dia_semana, horario_abertura, horario_fechamento, ativo)
SELECT 
  u.id,
  generate_series(1, 6) as dia_semana, -- Segunda a Sábado
  '08:00'::TIME,
  '20:00'::TIME,
  true
FROM unidades u 
WHERE u.nome = 'BookIA - Boulevard Shopping Camaçari';

-- Centro Camaçari - Segunda a Sexta (09:00-18:00)  
INSERT INTO horario_funcionamento (unidade_id, dia_semana, horario_abertura, horario_fechamento, ativo)
SELECT 
  u.id,
  generate_series(1, 5) as dia_semana, -- Segunda a Sexta
  '09:00'::TIME,
  '18:00'::TIME,
  true
FROM unidades u 
WHERE u.nome = 'BookIA - Centro Camaçari';

-- Salvador Norte Shopping - Domingo a Domingo (10:00-22:00)
INSERT INTO horario_funcionamento (unidade_id, dia_semana, horario_abertura, horario_fechamento, ativo)
SELECT 
  u.id,
  generate_series(0, 6) as dia_semana, -- Domingo a Sábado
  '10:00'::TIME,
  '22:00'::TIME,
  true
FROM unidades u 
WHERE u.nome = 'BookIA - Salvador Norte Shopping';

-- 6. VERIFICAR DADOS INSERIDOS
SELECT 
  u.nome as unidade,
  CASE hf.dia_semana
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Segunda'
    WHEN 2 THEN 'Terça'
    WHEN 3 THEN 'Quarta'
    WHEN 4 THEN 'Quinta'
    WHEN 5 THEN 'Sexta'
    WHEN 6 THEN 'Sábado'
  END as dia,
  hf.horario_abertura,
  hf.horario_fechamento,
  hf.ativo
FROM unidades u
JOIN horario_funcionamento hf ON u.id = hf.unidade_id
WHERE u.ativo = true AND hf.ativo = true
ORDER BY u.nome, hf.dia_semana;

-- 7. FUNÇÃO AUXILIAR - Verificar se unidade está aberta em um dia
CREATE OR REPLACE FUNCTION unidade_aberta_no_dia(
  unidade_uuid UUID,
  data_verificar DATE
) RETURNS BOOLEAN AS $$
DECLARE
  dia_semana_numero INTEGER;
  esta_aberta BOOLEAN;
BEGIN
  -- Calcular dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
  dia_semana_numero := EXTRACT(DOW FROM data_verificar);
  
  -- Verificar se existe horário para este dia
  SELECT EXISTS(
    SELECT 1 FROM horario_funcionamento 
    WHERE unidade_id = unidade_uuid 
    AND dia_semana = dia_semana_numero 
    AND ativo = true
  ) INTO esta_aberta;
  
  RETURN esta_aberta;
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso da função:
-- SELECT unidade_aberta_no_dia('uuid-da-unidade', '2025-09-17'::DATE);

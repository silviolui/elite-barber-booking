-- HORÁRIO DE FUNCIONAMENTO POR UNIDADE
-- Tabela para definir dias e horários de cada unidade com período manhã, tarde e noite

-- 1. CRIAR TABELA DE HORÁRIO DE FUNCIONAMENTO
CREATE TABLE public.horario_funcionamento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 1=Segunda, ..., 6=Sábado
  
  -- Período Manhã
  abre_manha BOOLEAN DEFAULT false,
  horario_abertura_manha TIME,
  horario_fechamento_manha TIME,
  
  -- Período Tarde
  abre_tarde BOOLEAN DEFAULT false,
  horario_abertura_tarde TIME,
  horario_fechamento_tarde TIME,
  
  -- Período Noite
  abre_noite BOOLEAN DEFAULT false,
  horario_abertura_noite TIME,
  horario_fechamento_noite TIME,
  
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

-- 5. INSERIR HORÁRIOS PARA TODAS AS UNIDADES (TODOS OS DIAS DA SEMANA)

-- Função auxiliar para inserir horários completos da semana
DO $$
DECLARE
  unidade_record RECORD;
BEGIN
  -- Para cada unidade ativa
  FOR unidade_record IN SELECT id, nome FROM unidades WHERE ativo = true
  LOOP
    -- Inserir todos os dias da semana (0=Domingo a 6=Sábado)
    FOR dia IN 0..6 LOOP
      INSERT INTO horario_funcionamento (
        unidade_id, 
        dia_semana, 
        abre_manha, 
        horario_abertura_manha, 
        horario_fechamento_manha,
        abre_tarde, 
        horario_abertura_tarde, 
        horario_fechamento_tarde,
        abre_noite,
        horario_abertura_noite,
        horario_fechamento_noite,
        ativo
      ) VALUES (
        unidade_record.id,
        dia,
        -- PERÍODO MANHÃ: Segunda a sexta manhã e sábado manhã
        CASE 
          WHEN dia BETWEEN 1 AND 5 THEN true  -- Segunda a sexta: manhã aberta
          WHEN dia = 6 THEN true               -- Sábado: manhã aberta  
          ELSE false                           -- Domingo: manhã fechada
        END,
        CASE 
          WHEN dia BETWEEN 1 AND 6 THEN '08:00'::TIME  -- Segunda a sábado: 8h
          ELSE NULL
        END,
        CASE 
          WHEN dia BETWEEN 1 AND 6 THEN '12:00'::TIME  -- Segunda a sábado: 12h
          ELSE NULL
        END,
        -- PERÍODO TARDE: Apenas segunda a sexta
        CASE 
          WHEN dia BETWEEN 1 AND 5 THEN true  -- Segunda a sexta: tarde aberta
          ELSE false                          -- Sábado e domingo: tarde fechada
        END,
        CASE 
          WHEN dia BETWEEN 1 AND 5 THEN '14:00'::TIME  -- Segunda a sexta: 14h
          ELSE NULL
        END,
        CASE 
          WHEN dia BETWEEN 1 AND 5 THEN '18:00'::TIME  -- Segunda a sexta: 18h
          ELSE NULL
        END,
        -- PERÍODO NOITE: Apenas segunda a quinta
        CASE 
          WHEN dia BETWEEN 1 AND 4 THEN true  -- Segunda a quinta: noite aberta
          ELSE false                          -- Sexta, sábado e domingo: noite fechada
        END,
        CASE 
          WHEN dia BETWEEN 1 AND 4 THEN '19:00'::TIME  -- Segunda a quinta: 19h
          ELSE NULL
        END,
        CASE 
          WHEN dia BETWEEN 1 AND 4 THEN '22:00'::TIME  -- Segunda a quinta: 22h
          ELSE NULL
        END,
        true
      );
    END LOOP;
  END LOOP;
END $$;

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
  hf.abre_manha,
  hf.horario_abertura_manha,
  hf.horario_fechamento_manha,
  hf.abre_tarde,
  hf.horario_abertura_tarde,
  hf.horario_fechamento_tarde,
  hf.abre_noite,
  hf.horario_abertura_noite,
  hf.horario_fechamento_noite,
  hf.ativo
FROM unidades u
JOIN horario_funcionamento hf ON u.id = hf.unidade_id
WHERE u.ativo = true AND hf.ativo = true
ORDER BY u.nome, hf.dia_semana;

-- 7. FUNÇÕES AUXILIARES

-- Verificar se unidade está aberta na MANHÃ
CREATE OR REPLACE FUNCTION unidade_aberta_manha(
  unidade_uuid UUID,
  data_verificar DATE
) RETURNS BOOLEAN AS $$
DECLARE
  dia_semana_numero INTEGER;
  esta_aberta BOOLEAN;
BEGIN
  dia_semana_numero := EXTRACT(DOW FROM data_verificar);
  
  SELECT COALESCE(abre_manha, false) 
  FROM horario_funcionamento 
  WHERE unidade_id = unidade_uuid 
  AND dia_semana = dia_semana_numero 
  AND ativo = true
  INTO esta_aberta;
  
  RETURN COALESCE(esta_aberta, false);
END;
$$ LANGUAGE plpgsql;

-- Verificar se unidade está aberta na TARDE
CREATE OR REPLACE FUNCTION unidade_aberta_tarde(
  unidade_uuid UUID,
  data_verificar DATE
) RETURNS BOOLEAN AS $$
DECLARE
  dia_semana_numero INTEGER;
  esta_aberta BOOLEAN;
BEGIN
  dia_semana_numero := EXTRACT(DOW FROM data_verificar);
  
  SELECT COALESCE(abre_tarde, false) 
  FROM horario_funcionamento 
  WHERE unidade_id = unidade_uuid 
  AND dia_semana = dia_semana_numero 
  AND ativo = true
  INTO esta_aberta;
  
  RETURN COALESCE(esta_aberta, false);
END;
$$ LANGUAGE plpgsql;

-- Verificar se unidade está aberta na NOITE
CREATE OR REPLACE FUNCTION unidade_aberta_noite(
  unidade_uuid UUID,
  data_verificar DATE
) RETURNS BOOLEAN AS $$
DECLARE
  dia_semana_numero INTEGER;
  esta_aberta BOOLEAN;
BEGIN
  dia_semana_numero := EXTRACT(DOW FROM data_verificar);
  
  SELECT COALESCE(abre_noite, false) 
  FROM horario_funcionamento 
  WHERE unidade_id = unidade_uuid 
  AND dia_semana = dia_semana_numero 
  AND ativo = true
  INTO esta_aberta;
  
  RETURN COALESCE(esta_aberta, false);
END;
$$ LANGUAGE plpgsql;

-- Verificar se unidade está aberta no dia (manhã OU tarde OU noite)
CREATE OR REPLACE FUNCTION unidade_aberta_no_dia(
  unidade_uuid UUID,
  data_verificar DATE
) RETURNS BOOLEAN AS $$
DECLARE
  dia_semana_numero INTEGER;
  esta_aberta BOOLEAN;
BEGIN
  dia_semana_numero := EXTRACT(DOW FROM data_verificar);
  
  SELECT (COALESCE(abre_manha, false) OR COALESCE(abre_tarde, false) OR COALESCE(abre_noite, false))
  FROM horario_funcionamento 
  WHERE unidade_id = unidade_uuid 
  AND dia_semana = dia_semana_numero 
  AND ativo = true
  INTO esta_aberta;
  
  RETURN COALESCE(esta_aberta, false);
END;
$$ LANGUAGE plpgsql;

-- Função para obter horários de um período específico (IMPORTANTE PARA O APP)
CREATE OR REPLACE FUNCTION obter_horarios_periodo(
  unidade_uuid UUID,
  data_verificar DATE,
  periodo TEXT -- 'manha', 'tarde', 'noite'
) RETURNS TABLE(
  horario_inicio TIME,
  horario_fim TIME,
  disponivel BOOLEAN
) AS $$
DECLARE
  dia_semana_numero INTEGER;
BEGIN
  dia_semana_numero := EXTRACT(DOW FROM data_verificar);
  
  -- Retorna horários apenas se o período está ativo (TRUE)
  RETURN QUERY
  SELECT 
    CASE 
      WHEN periodo = 'manha' AND COALESCE(hf.abre_manha, false) = true THEN hf.horario_abertura_manha
      WHEN periodo = 'tarde' AND COALESCE(hf.abre_tarde, false) = true THEN hf.horario_abertura_tarde
      WHEN periodo = 'noite' AND COALESCE(hf.abre_noite, false) = true THEN hf.horario_abertura_noite
      ELSE NULL
    END as horario_inicio,
    CASE 
      WHEN periodo = 'manha' AND COALESCE(hf.abre_manha, false) = true THEN hf.horario_fechamento_manha
      WHEN periodo = 'tarde' AND COALESCE(hf.abre_tarde, false) = true THEN hf.horario_fechamento_tarde
      WHEN periodo = 'noite' AND COALESCE(hf.abre_noite, false) = true THEN hf.horario_fechamento_noite
      ELSE NULL
    END as horario_fim,
    CASE 
      WHEN periodo = 'manha' THEN COALESCE(hf.abre_manha, false)
      WHEN periodo = 'tarde' THEN COALESCE(hf.abre_tarde, false)
      WHEN periodo = 'noite' THEN COALESCE(hf.abre_noite, false)
      ELSE false
    END as disponivel
  FROM horario_funcionamento hf
  WHERE hf.unidade_id = unidade_uuid 
  AND hf.dia_semana = dia_semana_numero 
  AND hf.ativo = true;
END;
$$ LANGUAGE plpgsql;

-- Exemplos de uso das funções:
-- SELECT unidade_aberta_manha('uuid-da-unidade', '2025-09-17'::DATE);
-- SELECT unidade_aberta_tarde('uuid-da-unidade', '2025-09-17'::DATE);
-- SELECT unidade_aberta_noite('uuid-da-unidade', '2025-09-17'::DATE);
-- SELECT unidade_aberta_no_dia('uuid-da-unidade', '2025-09-17'::DATE);
-- 
-- IMPORTANTE: Para exibir horários no app, use:
-- SELECT * FROM obter_horarios_periodo('uuid-da-unidade', '2025-09-17'::DATE, 'manha');
-- SELECT * FROM obter_horarios_periodo('uuid-da-unidade', '2025-09-17'::DATE, 'tarde');
-- SELECT * FROM obter_horarios_periodo('uuid-da-unidade', '2025-09-17'::DATE, 'noite');

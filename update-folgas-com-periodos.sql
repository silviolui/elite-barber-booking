-- ATUALIZAR SISTEMA DE FOLGAS PARA SUPORTAR PERÍODOS (MANHÃ, TARDE, NOITE)
-- Execute este arquivo para evoluir o sistema de folgas

-- 1. ADICIONAR COLUNAS DE PERÍODOS À TABELA EXISTENTE
ALTER TABLE folgas_profissionais 
ADD COLUMN IF NOT EXISTS folga_manha BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS folga_tarde BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS folga_noite BOOLEAN DEFAULT false;

-- 2. MIGRAR DADOS EXISTENTES (folgas de dia inteiro → todos os períodos)
UPDATE folgas_profissionais 
SET 
  folga_manha = true,
  folga_tarde = true,
  folga_noite = true
WHERE folga_manha IS NULL OR folga_tarde IS NULL OR folga_noite IS NULL;

-- 3. CRIAR FUNÇÃO AUXILIAR PARA VERIFICAR FOLGA POR PERÍODO
CREATE OR REPLACE FUNCTION profissional_esta_de_folga_periodo(
  profissional_uuid UUID,
  data_verificar DATE,
  periodo TEXT -- 'manha', 'tarde', 'noite'
) RETURNS BOOLEAN AS $$
DECLARE
  dia_semana_numero INTEGER;
  tem_folga BOOLEAN := false;
  campo_periodo TEXT;
BEGIN
  dia_semana_numero := EXTRACT(DOW FROM data_verificar);
  
  -- Definir qual campo verificar baseado no período
  CASE periodo
    WHEN 'manha' THEN campo_periodo := 'folga_manha';
    WHEN 'tarde' THEN campo_periodo := 'folga_tarde';
    WHEN 'noite' THEN campo_periodo := 'folga_noite';
    ELSE RETURN false;
  END CASE;
  
  -- Verificar folgas por data específica
  EXECUTE format('
    SELECT EXISTS(
      SELECT 1 FROM folgas_profissionais 
      WHERE profissional_id = $1 
      AND tipo_folga = ''data_especifica''
      AND data_folga = $2 
      AND %I = true
      AND ativo = true
    )', campo_periodo) 
  INTO tem_folga 
  USING profissional_uuid, data_verificar;
  
  -- Se não tem folga específica, verificar folga recorrente
  IF NOT tem_folga THEN
    EXECUTE format('
      SELECT EXISTS(
        SELECT 1 FROM folgas_profissionais 
        WHERE profissional_id = $1 
        AND tipo_folga = ''dia_semana_recorrente''
        AND dia_semana = $2 
        AND %I = true
        AND ativo = true
      )', campo_periodo)
    INTO tem_folga 
    USING profissional_uuid, dia_semana_numero;
  END IF;
  
  RETURN tem_folga;
END;
$$ LANGUAGE plpgsql;

-- 4. ATUALIZAR FUNÇÃO ORIGINAL PARA VERIFICAR TODOS OS PERÍODOS
CREATE OR REPLACE FUNCTION profissional_esta_de_folga(
  profissional_uuid UUID,
  data_verificar DATE
) RETURNS BOOLEAN AS $$
BEGIN
  -- Retorna true se o profissional está de folga em TODOS os períodos
  RETURN (
    profissional_esta_de_folga_periodo(profissional_uuid, data_verificar, 'manha') AND
    profissional_esta_de_folga_periodo(profissional_uuid, data_verificar, 'tarde') AND
    profissional_esta_de_folga_periodo(profissional_uuid, data_verificar, 'noite')
  );
END;
$$ LANGUAGE plpgsql;

-- 5. VERIFICAR ESTRUTURA ATUALIZADA
SELECT 
  'TABELA ATUALIZADA:' as info,
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'folgas_profissionais'
AND column_name IN ('folga_manha', 'folga_tarde', 'folga_noite')
ORDER BY ordinal_position;

-- Exemplos de uso das novas funções:
-- SELECT profissional_esta_de_folga_periodo('uuid', '2025-09-25'::DATE, 'manha');
-- SELECT profissional_esta_de_folga_periodo('uuid', '2025-09-25'::DATE, 'tarde');
-- SELECT profissional_esta_de_folga_periodo('uuid', '2025-09-25'::DATE, 'noite');

SELECT 'Sistema de folgas por período configurado!' as resultado;

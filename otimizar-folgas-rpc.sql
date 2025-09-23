-- FUNÇÃO RPC OTIMIZADA PARA VERIFICAR FOLGAS EM TODOS OS PERÍODOS
-- Esta função substitui 3 chamadas individuais por 1 única chamada

CREATE OR REPLACE FUNCTION verificar_folgas_todos_periodos(
  profissional_uuid UUID,
  data_verificar DATE
) RETURNS JSON AS $$
DECLARE
  dia_semana_numero INTEGER;
  folgas RECORD;
  resultado JSON;
BEGIN
  dia_semana_numero := EXTRACT(DOW FROM data_verificar);
  
  -- Verificar folgas específicas da data
  SELECT 
    COALESCE(MAX(CASE WHEN folga_manha = true THEN true ELSE false END), false) as manha_folga,
    COALESCE(MAX(CASE WHEN folga_tarde = true THEN true ELSE false END), false) as tarde_folga,
    COALESCE(MAX(CASE WHEN folga_noite = true THEN true ELSE false END), false) as noite_folga
  INTO folgas
  FROM folgas_profissionais 
  WHERE profissional_id = profissional_uuid
  AND ativo = true
  AND (
    (tipo_folga = 'data_especifica' AND data_folga = data_verificar) OR
    (tipo_folga = 'dia_semana_recorrente' AND dia_semana = dia_semana_numero)
  );
  
  -- Retornar resultado em formato JSON
  resultado := json_build_object(
    'manha', COALESCE(folgas.manha_folga, false),
    'tarde', COALESCE(folgas.tarde_folga, false),  
    'noite', COALESCE(folgas.noite_folga, false)
  );
  
  RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- Testar a função
-- SELECT verificar_folgas_todos_periodos('uuid-do-profissional', '2025-09-23'::DATE);

-- Configuração mínima e segura do fuso horário de Brasília
-- Execute este script no SQL Editor do Supabase Dashboard

-- Configurar timezone da sessão para América/São_Paulo
SET timezone = 'America/Sao_Paulo';

-- Função para obter data/hora atual no fuso horário de Brasília
CREATE OR REPLACE FUNCTION get_brazil_now()
RETURNS timestamptz AS $$
BEGIN
  RETURN NOW() AT TIME ZONE 'America/Sao_Paulo';
END;
$$ LANGUAGE plpgsql;

-- Função para converter timestamp para fuso horário de Brasília
CREATE OR REPLACE FUNCTION to_brazil_timezone(input_time timestamptz)
RETURNS timestamptz AS $$
BEGIN
  RETURN input_time AT TIME ZONE 'America/Sao_Paulo';
END;
$$ LANGUAGE plpgsql;

-- Função para formatar data no padrão brasileiro (dd/MM/yyyy)
CREATE OR REPLACE FUNCTION format_date_br(input_date date)
RETURNS text AS $$
BEGIN
  RETURN to_char(input_date, 'DD/MM/YYYY');
END;
$$ LANGUAGE plpgsql;

-- Função para formatar data e hora no padrão brasileiro
CREATE OR REPLACE FUNCTION format_datetime_br(input_datetime timestamptz)
RETURNS text AS $$
BEGIN
  RETURN to_char(input_datetime AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI');
END;
$$ LANGUAGE plpgsql;

-- Configurar apenas o que sabemos que existe: agendamentos.criado_em
DO $$ 
BEGIN
    -- Configurar criado_em da tabela agendamentos (que sabemos que existe)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'agendamentos' AND column_name = 'criado_em') THEN
        ALTER TABLE agendamentos ALTER COLUMN criado_em SET DEFAULT get_brazil_now();
        
        -- Trigger para novos agendamentos usarem horário de Brasília
        DROP TRIGGER IF EXISTS set_brazil_timestamp ON agendamentos;
        CREATE OR REPLACE FUNCTION set_brazil_timestamp()
        RETURNS TRIGGER AS $t$
        BEGIN
            NEW.criado_em = get_brazil_now();
            RETURN NEW;
        END;
        $t$ LANGUAGE plpgsql;
        
        CREATE TRIGGER set_brazil_timestamp
            BEFORE INSERT ON agendamentos
            FOR EACH ROW
            EXECUTE FUNCTION set_brazil_timestamp();
    END IF;
    
    RAISE NOTICE 'Configuração de timezone aplicada com sucesso!';
END $$;

-- Verificar configuração
SELECT 'Timezone configurado para:' as info, setting as timezone 
FROM pg_settings WHERE name = 'timezone';

-- Testar as funções
SELECT 
    get_brazil_now() as "Horário Brasília",
    NOW() as "Horário UTC",
    format_date_br(CURRENT_DATE) as "Data formatada BR";

-- Verificar estrutura atual das tabelas
SELECT 
    table_name as "Tabela", 
    column_name as "Coluna", 
    data_type as "Tipo"
FROM information_schema.columns 
WHERE table_name IN ('agendamentos', 'historico_agendamentos', 'users', 'profissionais', 'unidades')
  AND (column_name LIKE '%creat%' OR column_name LIKE '%updat%' OR column_name = 'criado_em')
ORDER BY table_name, column_name;

-- Confirmar configuração aplicada
SELECT '✅ Fuso horário de Brasília configurado com sucesso!' as status;

-- Configurar fuso horário de Brasília no Supabase (Versão Corrigida)
-- Execute este script no SQL Editor do Supabase Dashboard

-- Configurar timezone padrão da sessão para América/São_Paulo
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

-- Função para formatar data no padrão brasileiro
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

-- Trigger para atualizar automaticamente criado_em com horário de Brasília
CREATE OR REPLACE FUNCTION update_criado_em_brazil()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.criado_em = get_brazil_now();
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar se as colunas existem antes de alterar
DO $$ 
BEGIN
    -- Alterar coluna criado_em da tabela agendamentos se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'agendamentos' AND column_name = 'criado_em') THEN
        ALTER TABLE agendamentos ALTER COLUMN criado_em SET DEFAULT get_brazil_now();
        
        -- Aplicar trigger para agendamentos
        DROP TRIGGER IF EXISTS update_agendamentos_criado_em ON agendamentos;
        CREATE TRIGGER update_agendamentos_criado_em
            BEFORE INSERT ON agendamentos
            FOR EACH ROW
            EXECUTE FUNCTION update_criado_em_brazil();
    END IF;

    -- Alterar tabela historico_agendamentos se existir
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'historico_agendamentos') THEN
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'historico_agendamentos' AND column_name = 'created_at') THEN
            ALTER TABLE historico_agendamentos ALTER COLUMN created_at SET DEFAULT get_brazil_now();
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'historico_agendamentos' AND column_name = 'data_conclusao') THEN
            ALTER TABLE historico_agendamentos ALTER COLUMN data_conclusao TYPE timestamptz;
        END IF;
    END IF;

    -- Alterar tabela users se existir
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'users') THEN
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'created_at') THEN
            ALTER TABLE users ALTER COLUMN created_at SET DEFAULT get_brazil_now();
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'updated_at') THEN
            ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT get_brazil_now();
        END IF;
    END IF;

    -- Alterar tabela profissionais se existir
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'profissionais') THEN
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profissionais' AND column_name = 'created_at') THEN
            ALTER TABLE profissionais ALTER COLUMN created_at SET DEFAULT get_brazil_now();
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profissionais' AND column_name = 'updated_at') THEN
            ALTER TABLE profissionais ALTER COLUMN updated_at SET DEFAULT get_brazil_now();
        END IF;
    END IF;

    -- Alterar tabela unidades se existir
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'unidades') THEN
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'unidades' AND column_name = 'created_at') THEN
            ALTER TABLE unidades ALTER COLUMN created_at SET DEFAULT get_brazil_now();
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'unidades' AND column_name = 'updated_at') THEN
            ALTER TABLE unidades ALTER COLUMN updated_at SET DEFAULT get_brazil_now();
        END IF;
    END IF;

    -- Alterar tabela servicos se existir
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'servicos') THEN
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'servicos' AND column_name = 'created_at') THEN
            ALTER TABLE servicos ALTER COLUMN created_at SET DEFAULT get_brazil_now();
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'servicos' AND column_name = 'updated_at') THEN
            ALTER TABLE servicos ALTER COLUMN updated_at SET DEFAULT get_brazil_now();
        END IF;
    END IF;

    -- Alterar tabela horario_funcionamento se existir
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'horario_funcionamento') THEN
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'horario_funcionamento' AND column_name = 'created_at') THEN
            ALTER TABLE horario_funcionamento ALTER COLUMN created_at SET DEFAULT get_brazil_now();
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'horario_funcionamento' AND column_name = 'updated_at') THEN
            ALTER TABLE horario_funcionamento ALTER COLUMN updated_at SET DEFAULT get_brazil_now();
        END IF;
    END IF;

    -- Alterar tabela folgas_profissionais se existir
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'folgas_profissionais') THEN
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'folgas_profissionais' AND column_name = 'created_at') THEN
            ALTER TABLE folgas_profissionais ALTER COLUMN created_at SET DEFAULT get_brazil_now();
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'folgas_profissionais' AND column_name = 'updated_at') THEN
            ALTER TABLE folgas_profissionais ALTER COLUMN updated_at SET DEFAULT get_brazil_now();
        END IF;
    END IF;

    -- Alterar tabela configuracoes se existir
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'configuracoes') THEN
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuracoes' AND column_name = 'created_at') THEN
            ALTER TABLE configuracoes ALTER COLUMN created_at SET DEFAULT get_brazil_now();
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'configuracoes' AND column_name = 'updated_at') THEN
            ALTER TABLE configuracoes ALTER COLUMN updated_at SET DEFAULT get_brazil_now();
        END IF;
    END IF;

END $$;

-- Verificar configuração do timezone
SELECT name, setting FROM pg_settings WHERE name = 'timezone';

-- Exibir hora atual no timezone configurado
SELECT get_brazil_now() as brazil_now, NOW() as utc_now;

-- Verificar estrutura das tabelas principais
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('agendamentos', 'historico_agendamentos', 'users', 'profissionais', 'unidades')
  AND column_name LIKE '%creat%' OR column_name LIKE '%updat%'
ORDER BY table_name, column_name;

-- Mensagem de sucesso
SELECT 'Configuração de fuso horário de Brasília aplicada com sucesso (versão corrigida)!' as status;

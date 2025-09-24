-- Configurar fuso horário de Brasília no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Configurar timezone padrão da sessão para América/São_Paulo
SET timezone = 'America/Sao_Paulo';

-- Configurar timezone padrão do banco para América/São_Paulo
ALTER DATABASE postgres SET timezone = 'America/Sao_Paulo';

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

-- Atualizar tabela agendamentos para usar timezone de Brasília
-- Alterar colunas de timestamp para incluir timezone
ALTER TABLE agendamentos ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE agendamentos ALTER COLUMN updated_at TYPE timestamptz;
ALTER TABLE agendamentos ALTER COLUMN data_conclusao TYPE timestamptz;

-- Atualizar tabela historico_agendamentos para usar timezone de Brasília
ALTER TABLE historico_agendamentos ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE historico_agendamentos ALTER COLUMN data_conclusao TYPE timestamptz;

-- Atualizar tabela users para usar timezone de Brasília
ALTER TABLE users ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE users ALTER COLUMN updated_at TYPE timestamptz;
ALTER TABLE users ALTER COLUMN last_sign_in_at TYPE timestamptz;

-- Atualizar tabela profissionais para usar timezone de Brasília
ALTER TABLE profissionais ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE profissionais ALTER COLUMN updated_at TYPE timestamptz;

-- Atualizar tabela unidades para usar timezone de Brasília
ALTER TABLE unidades ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE unidades ALTER COLUMN updated_at TYPE timestamptz;

-- Atualizar tabela servicos para usar timezone de Brasília
ALTER TABLE servicos ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE servicos ALTER COLUMN updated_at TYPE timestamptz;

-- Atualizar tabela horario_funcionamento para usar timezone de Brasília
ALTER TABLE horario_funcionamento ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE horario_funcionamento ALTER COLUMN updated_at TYPE timestamptz;

-- Atualizar tabela folgas_profissionais para usar timezone de Brasília
ALTER TABLE folgas_profissionais ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE folgas_profissionais ALTER COLUMN updated_at TYPE timestamptz;

-- Atualizar tabela configuracoes para usar timezone de Brasília
ALTER TABLE configuracoes ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE configuracoes ALTER COLUMN updated_at TYPE timestamptz;

-- Trigger para atualizar automaticamente updated_at com horário de Brasília
CREATE OR REPLACE FUNCTION update_updated_at_brazil()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = get_brazil_now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para todas as tabelas relevantes
DROP TRIGGER IF EXISTS update_agendamentos_updated_at ON agendamentos;
CREATE TRIGGER update_agendamentos_updated_at
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_brazil();

DROP TRIGGER IF EXISTS update_historico_updated_at ON historico_agendamentos;
CREATE TRIGGER update_historico_updated_at
    BEFORE UPDATE ON historico_agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_brazil();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_brazil();

DROP TRIGGER IF EXISTS update_profissionais_updated_at ON profissionais;
CREATE TRIGGER update_profissionais_updated_at
    BEFORE UPDATE ON profissionais
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_brazil();

DROP TRIGGER IF EXISTS update_unidades_updated_at ON unidades;
CREATE TRIGGER update_unidades_updated_at
    BEFORE UPDATE ON unidades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_brazil();

DROP TRIGGER IF EXISTS update_servicos_updated_at ON servicos;
CREATE TRIGGER update_servicos_updated_at
    BEFORE UPDATE ON servicos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_brazil();

DROP TRIGGER IF EXISTS update_horario_updated_at ON horario_funcionamento;
CREATE TRIGGER update_horario_updated_at
    BEFORE UPDATE ON horario_funcionamento
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_brazil();

DROP TRIGGER IF EXISTS update_folgas_updated_at ON folgas_profissionais;
CREATE TRIGGER update_folgas_updated_at
    BEFORE UPDATE ON folgas_profissionais
    FOR EACH ROW
    EXECUTE FUNCTION update_folgas_updated_at_brazil();

DROP TRIGGER IF EXISTS update_configuracoes_updated_at ON configuracoes;
CREATE TRIGGER update_configuracoes_updated_at
    BEFORE UPDATE ON configuracoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_brazil();

-- Atualizar valores padrão para usar horário de Brasília
ALTER TABLE agendamentos ALTER COLUMN created_at SET DEFAULT get_brazil_now();
ALTER TABLE agendamentos ALTER COLUMN updated_at SET DEFAULT get_brazil_now();

ALTER TABLE historico_agendamentos ALTER COLUMN created_at SET DEFAULT get_brazil_now();

ALTER TABLE users ALTER COLUMN created_at SET DEFAULT get_brazil_now();
ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT get_brazil_now();

ALTER TABLE profissionais ALTER COLUMN created_at SET DEFAULT get_brazil_now();
ALTER TABLE profissionais ALTER COLUMN updated_at SET DEFAULT get_brazil_now();

ALTER TABLE unidades ALTER COLUMN created_at SET DEFAULT get_brazil_now();
ALTER TABLE unidades ALTER COLUMN updated_at SET DEFAULT get_brazil_now();

ALTER TABLE servicos ALTER COLUMN created_at SET DEFAULT get_brazil_now();
ALTER TABLE servicos ALTER COLUMN updated_at SET DEFAULT get_brazil_now();

ALTER TABLE horario_funcionamento ALTER COLUMN created_at SET DEFAULT get_brazil_now();
ALTER TABLE horario_funcionamento ALTER COLUMN updated_at SET DEFAULT get_brazil_now();

ALTER TABLE folgas_profissionais ALTER COLUMN created_at SET DEFAULT get_brazil_now();
ALTER TABLE folgas_profissionais ALTER COLUMN updated_at SET DEFAULT get_brazil_now();

ALTER TABLE configuracoes ALTER COLUMN created_at SET DEFAULT get_brazil_now();
ALTER TABLE configuracoes ALTER COLUMN updated_at SET DEFAULT get_brazil_now();

-- Verificar configuração do timezone
SELECT name, setting FROM pg_settings WHERE name = 'timezone';

-- Exibir hora atual no timezone configurado
SELECT get_brazil_now() as brazil_now, NOW() as utc_now;

-- Mensagem de sucesso
SELECT 'Configuração de fuso horário de Brasília aplicada com sucesso!' as status;

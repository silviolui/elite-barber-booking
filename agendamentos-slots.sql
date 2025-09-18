-- SISTEMA DE SLOTS OCUPADOS POR PROFISSIONAL
-- Ajustes na tabela de agendamentos para suportar controle de horários

-- 1. VERIFICAR/CRIAR ENUM TYPES (se ainda não existirem)
DO $$ 
BEGIN
    -- Criar tipo appointment_status se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
    END IF;
    
    -- Criar tipo payment_status se não existir  
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
    END IF;
END $$;

-- 2. VERIFICAR SE TABELA AGENDAMENTOS EXISTE COM ESTRUTURA CORRETA
DO $$
BEGIN
    -- Se a tabela ainda não foi traduzida, fazer a tradução
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments' AND table_schema = 'public') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agendamentos' AND table_schema = 'public') THEN
        
        -- Renomear tabela
        ALTER TABLE public.appointments RENAME TO agendamentos;
        
        -- Renomear colunas
        ALTER TABLE agendamentos RENAME COLUMN user_id TO usuario_id;
        ALTER TABLE agendamentos RENAME COLUMN professional_id TO profissional_id;
        ALTER TABLE agendamentos RENAME COLUMN unit_id TO unidade_id;
        ALTER TABLE agendamentos RENAME COLUMN appointment_date TO data_agendamento;
        ALTER TABLE agendamentos RENAME COLUMN start_time TO horario_inicio;
        ALTER TABLE agendamentos RENAME COLUMN end_time TO horario_fim;
        ALTER TABLE agendamentos RENAME COLUMN total_price TO preco_total;
        ALTER TABLE agendamentos RENAME COLUMN payment_status TO status_pagamento;
        ALTER TABLE agendamentos RENAME COLUMN notes TO observacoes;
        ALTER TABLE agendamentos RENAME COLUMN created_at TO criado_em;
        ALTER TABLE agendamentos RENAME COLUMN updated_at TO atualizado_em;
        
        RAISE NOTICE 'Tabela appointments foi renomeada para agendamentos com colunas em português';
    END IF;
END $$;

-- 3. CRIAR TABELA AGENDAMENTOS SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID, -- REFERENCES auth.users(id) - usar auth.users ou criar tabela users conforme necessário
  profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE,
  unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
  data_agendamento DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  preco_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status appointment_status DEFAULT 'pending',
  status_pagamento payment_status DEFAULT 'pending',
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional_data 
ON agendamentos(profissional_id, data_agendamento);

CREATE INDEX IF NOT EXISTS idx_agendamentos_unidade 
ON agendamentos(unidade_id);

CREATE INDEX IF NOT EXISTS idx_agendamentos_usuario 
ON agendamentos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_agendamentos_status 
ON agendamentos(status);

-- 5. ENABLE RLS
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS - TEMPORARIAMENTE DESABILITADAS PARA TESTES
-- Para habilitar autenticação depois, descomente as políticas abaixo:

/*
-- Remover políticas existentes se existirem e criar novas
DROP POLICY IF EXISTS "Usuarios podem ver seus agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Usuarios podem criar agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Usuarios podem atualizar seus agendamentos" ON agendamentos;

-- Criar políticas
CREATE POLICY "Usuarios podem ver seus agendamentos" ON agendamentos 
FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem criar agendamentos" ON agendamentos 
FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar seus agendamentos" ON agendamentos 
FOR UPDATE USING (auth.uid() = usuario_id);
*/

-- POLÍTICA TEMPORÁRIA PARA TESTES (PERMITE ACESSO TOTAL)
DROP POLICY IF EXISTS "Acesso total para testes" ON agendamentos;
CREATE POLICY "Acesso total para testes" ON agendamentos FOR ALL USING (true);

-- 7. FUNÇÃO PARA VERIFICAR CONFLITOS DE HORÁRIO
CREATE OR REPLACE FUNCTION verificar_conflito_horario(
    p_profissional_id UUID,
    p_data_agendamento DATE,
    p_horario_inicio TIME,
    p_horario_fim TIME,
    p_agendamento_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    conflito_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO conflito_count
    FROM agendamentos 
    WHERE profissional_id = p_profissional_id
    AND data_agendamento = p_data_agendamento
    AND status IN ('pending', 'confirmed')
    AND (p_agendamento_id IS NULL OR id != p_agendamento_id)
    AND (
        (horario_inicio <= p_horario_inicio AND horario_fim > p_horario_inicio) OR
        (horario_inicio < p_horario_fim AND horario_fim >= p_horario_fim) OR
        (horario_inicio >= p_horario_inicio AND horario_fim <= p_horario_fim)
    );
    
    RETURN conflito_count > 0;
END;
$$ LANGUAGE plpgsql;

-- 8. TRIGGER PARA PREVENIR CONFLITOS
CREATE OR REPLACE FUNCTION trigger_verificar_conflito() 
RETURNS TRIGGER AS $$
BEGIN
    IF verificar_conflito_horario(
        NEW.profissional_id,
        NEW.data_agendamento,
        NEW.horario_inicio,
        NEW.horario_fim,
        CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
    ) THEN
        RAISE EXCEPTION 'Conflito de horário: Já existe um agendamento para este profissional no horário selecionado.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_agendamento_conflito ON agendamentos;
CREATE TRIGGER trigger_agendamento_conflito 
    BEFORE INSERT OR UPDATE ON agendamentos
    FOR EACH ROW EXECUTE FUNCTION trigger_verificar_conflito();

-- 9. FUNÇÃO PARA BUSCAR HORÁRIOS OCUPADOS (usado pelo app)
CREATE OR REPLACE FUNCTION get_horarios_ocupados(
    p_profissional_id UUID,
    p_data DATE
) RETURNS TABLE (
    horario_inicio TIME,
    horario_fim TIME
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.horario_inicio, a.horario_fim
    FROM agendamentos a
    WHERE a.profissional_id = p_profissional_id
    AND a.data_agendamento = p_data
    AND a.status IN ('pending', 'confirmed');
END;
$$ LANGUAGE plpgsql;

-- 10. EXEMPLO DE USO
/*
-- Verificar horários ocupados para um profissional em uma data
SELECT * FROM get_horarios_ocupados('uuid-do-profissional', '2025-09-18'::DATE);

-- Verificar se há conflito antes de inserir
SELECT verificar_conflito_horario(
    'uuid-do-profissional',
    '2025-09-18'::DATE,
    '08:00'::TIME,
    '08:30'::TIME
);
*/

-- LOGS
SELECT 'Sistema de slots ocupados configurado com sucesso!' as status;

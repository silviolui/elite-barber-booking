-- Tabela de histórico de agendamentos
CREATE TABLE IF NOT EXISTS historico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agendamento_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    profissional_id UUID NOT NULL,
    unidade_id UUID NOT NULL,
    servico_id UUID NOT NULL,
    data_agendamento DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'concluido' CHECK (status IN ('concluido', 'cancelado', 'nao_compareceu')),
    avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
    comentario_avaliacao TEXT,
    valor_total DECIMAL(10,2),
    forma_pagamento VARCHAR(50),
    data_conclusao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_historico_agendamento FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE,
    CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_historico_profissional FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE,
    CONSTRAINT fk_historico_unidade FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE,
    CONSTRAINT fk_historico_servico FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_historico_usuario_id ON historico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historico_data_agendamento ON historico(data_agendamento DESC);
CREATE INDEX IF NOT EXISTS idx_historico_status ON historico(status);
CREATE INDEX IF NOT EXISTS idx_historico_profissional_id ON historico(profissional_id);
CREATE INDEX IF NOT EXISTS idx_historico_unidade_id ON historico(unidade_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_historico_updated_at 
    BEFORE UPDATE ON historico 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE historico IS 'Tabela de histórico de agendamentos concluídos, cancelados ou perdidos';
COMMENT ON COLUMN historico.agendamento_id IS 'ID do agendamento original da tabela agendamentos';
COMMENT ON COLUMN historico.status IS 'Status final do agendamento: concluido, cancelado, nao_compareceu';
COMMENT ON COLUMN historico.avaliacao IS 'Avaliação do cliente de 1 a 5 estrelas';
COMMENT ON COLUMN historico.data_conclusao IS 'Data e hora quando o agendamento foi finalizado';

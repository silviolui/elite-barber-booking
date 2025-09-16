-- SQL para traduzir tabelas e colunas para Português
-- Execute APÓS executar o database-schema.sql

-- 1. RENOMEAR TABELAS
ALTER TABLE companies RENAME TO empresas;
ALTER TABLE units RENAME TO unidades;
ALTER TABLE professionals RENAME TO profissionais;
ALTER TABLE services RENAME TO servicos;
ALTER TABLE availability RENAME TO disponibilidade;
ALTER TABLE time_slots RENAME TO horarios_disponiveis;
ALTER TABLE appointments RENAME TO agendamentos;
ALTER TABLE appointment_services RENAME TO agendamento_servicos;
ALTER TABLE reviews RENAME TO avaliacoes;

-- 2. RENOMEAR COLUNAS - TABELA USUARIOS (já existe)
-- A tabela users já existe, vamos apenas renomear colunas se necessário
ALTER TABLE users RENAME COLUMN name TO nome;
ALTER TABLE users RENAME COLUMN phone TO telefone;
ALTER TABLE users RENAME COLUMN avatar_url TO foto_url;
ALTER TABLE users RENAME COLUMN created_at TO criado_em;
ALTER TABLE users RENAME COLUMN updated_at TO atualizado_em;

-- 3. RENOMEAR COLUNAS - EMPRESAS
ALTER TABLE empresas RENAME COLUMN name TO nome;
ALTER TABLE empresas RENAME COLUMN description TO descricao;
-- logo_url mantém o mesmo nome (não precisa renomear)
ALTER TABLE empresas RENAME COLUMN created_at TO criado_em;
ALTER TABLE empresas RENAME COLUMN updated_at TO atualizado_em;

-- 4. RENOMEAR COLUNAS - UNIDADES
ALTER TABLE unidades RENAME COLUMN company_id TO empresa_id;
ALTER TABLE unidades RENAME COLUMN name TO nome;
ALTER TABLE unidades RENAME COLUMN address TO endereco;
ALTER TABLE unidades RENAME COLUMN phone TO telefone;
ALTER TABLE unidades RENAME COLUMN image_url TO imagem_url;
-- latitude e longitude mantêm os mesmos nomes
ALTER TABLE unidades RENAME COLUMN opening_hours TO horario_funcionamento;
ALTER TABLE unidades RENAME COLUMN is_active TO ativo;
ALTER TABLE unidades RENAME COLUMN created_at TO criado_em;
ALTER TABLE unidades RENAME COLUMN updated_at TO atualizado_em;

-- 5. RENOMEAR COLUNAS - PROFISSIONAIS
ALTER TABLE profissionais RENAME COLUMN unit_id TO unidade_id;
ALTER TABLE profissionais RENAME COLUMN name TO nome;
ALTER TABLE profissionais RENAME COLUMN specialty TO especialidade;
ALTER TABLE profissionais RENAME COLUMN description TO descricao;
ALTER TABLE profissionais RENAME COLUMN image_url TO foto_url;
ALTER TABLE profissionais RENAME COLUMN rating TO avaliacao;
ALTER TABLE profissionais RENAME COLUMN experience_years TO anos_experiencia;
ALTER TABLE profissionais RENAME COLUMN is_active TO ativo;
ALTER TABLE profissionais RENAME COLUMN created_at TO criado_em;
ALTER TABLE profissionais RENAME COLUMN updated_at TO atualizado_em;

-- 6. RENOMEAR COLUNAS - SERVICOS
ALTER TABLE servicos RENAME COLUMN professional_id TO profissional_id;
ALTER TABLE servicos RENAME COLUMN name TO nome;
ALTER TABLE servicos RENAME COLUMN description TO descricao;
ALTER TABLE servicos RENAME COLUMN duration_minutes TO duracao_minutos;
ALTER TABLE servicos RENAME COLUMN price TO preco;
ALTER TABLE servicos RENAME COLUMN is_active TO ativo;
ALTER TABLE servicos RENAME COLUMN created_at TO criado_em;
ALTER TABLE servicos RENAME COLUMN updated_at TO atualizado_em;

-- 7. RENOMEAR COLUNAS - DISPONIBILIDADE
ALTER TABLE disponibilidade RENAME COLUMN professional_id TO profissional_id;
ALTER TABLE disponibilidade RENAME COLUMN day_of_week TO dia_semana;
ALTER TABLE disponibilidade RENAME COLUMN start_time TO horario_inicio;
ALTER TABLE disponibilidade RENAME COLUMN end_time TO horario_fim;
ALTER TABLE disponibilidade RENAME COLUMN is_active TO ativo;
ALTER TABLE disponibilidade RENAME COLUMN created_at TO criado_em;

-- 8. RENOMEAR COLUNAS - HORARIOS_DISPONIVEIS
ALTER TABLE horarios_disponiveis RENAME COLUMN professional_id TO profissional_id;
ALTER TABLE horarios_disponiveis RENAME COLUMN date TO data;
ALTER TABLE horarios_disponiveis RENAME COLUMN start_time TO horario_inicio;
ALTER TABLE horarios_disponiveis RENAME COLUMN end_time TO horario_fim;
ALTER TABLE horarios_disponiveis RENAME COLUMN is_available TO disponivel;
ALTER TABLE horarios_disponiveis RENAME COLUMN created_at TO criado_em;

-- 9. RENOMEAR COLUNAS - AGENDAMENTOS  
ALTER TABLE agendamentos RENAME COLUMN user_id TO usuario_id;
ALTER TABLE agendamentos RENAME COLUMN professional_id TO profissional_id;
ALTER TABLE agendamentos RENAME COLUMN unit_id TO unidade_id;
ALTER TABLE agendamentos RENAME COLUMN appointment_date TO data_agendamento;
ALTER TABLE agendamentos RENAME COLUMN start_time TO horario_inicio;
ALTER TABLE agendamentos RENAME COLUMN end_time TO horario_fim;
ALTER TABLE agendamentos RENAME COLUMN total_price TO preco_total;
-- status mantém o mesmo nome
ALTER TABLE agendamentos RENAME COLUMN payment_status TO status_pagamento;
ALTER TABLE agendamentos RENAME COLUMN notes TO observacoes;
ALTER TABLE agendamentos RENAME COLUMN created_at TO criado_em;
ALTER TABLE agendamentos RENAME COLUMN updated_at TO atualizado_em;

-- 10. RENOMEAR COLUNAS - AGENDAMENTO_SERVICOS
ALTER TABLE agendamento_servicos RENAME COLUMN appointment_id TO agendamento_id;
ALTER TABLE agendamento_servicos RENAME COLUMN service_id TO servico_id;
ALTER TABLE agendamento_servicos RENAME COLUMN price TO preco;
ALTER TABLE agendamento_servicos RENAME COLUMN created_at TO criado_em;

-- 11. RENOMEAR COLUNAS - AVALIACOES
ALTER TABLE avaliacoes RENAME COLUMN appointment_id TO agendamento_id;
ALTER TABLE avaliacoes RENAME COLUMN user_id TO usuario_id;
ALTER TABLE avaliacoes RENAME COLUMN professional_id TO profissional_id;
ALTER TABLE avaliacoes RENAME COLUMN rating TO nota;
ALTER TABLE avaliacoes RENAME COLUMN comment TO comentario;
ALTER TABLE avaliacoes RENAME COLUMN created_at TO criado_em;

-- 12. ATUALIZAR FOREIGN KEYS (devido às mudanças de nomes)
-- Remover constraints antigas
ALTER TABLE unidades DROP CONSTRAINT units_company_id_fkey;
ALTER TABLE profissionais DROP CONSTRAINT professionals_unit_id_fkey;
ALTER TABLE servicos DROP CONSTRAINT services_professional_id_fkey;
ALTER TABLE disponibilidade DROP CONSTRAINT availability_professional_id_fkey;
ALTER TABLE horarios_disponiveis DROP CONSTRAINT time_slots_professional_id_fkey;
ALTER TABLE agendamentos DROP CONSTRAINT appointments_user_id_fkey;
ALTER TABLE agendamentos DROP CONSTRAINT appointments_professional_id_fkey;
ALTER TABLE agendamentos DROP CONSTRAINT appointments_unit_id_fkey;
ALTER TABLE agendamento_servicos DROP CONSTRAINT appointment_services_appointment_id_fkey;
ALTER TABLE agendamento_servicos DROP CONSTRAINT appointment_services_service_id_fkey;
ALTER TABLE avaliacoes DROP CONSTRAINT reviews_appointment_id_fkey;
ALTER TABLE avaliacoes DROP CONSTRAINT reviews_user_id_fkey;
ALTER TABLE avaliacoes DROP CONSTRAINT reviews_professional_id_fkey;

-- Recriar constraints com novos nomes
ALTER TABLE unidades ADD CONSTRAINT unidades_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE profissionais ADD CONSTRAINT profissionais_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;
ALTER TABLE servicos ADD CONSTRAINT servicos_profissional_id_fkey FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE;
ALTER TABLE disponibilidade ADD CONSTRAINT disponibilidade_profissional_id_fkey FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE;
ALTER TABLE horarios_disponiveis ADD CONSTRAINT horarios_disponiveis_profissional_id_fkey FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE;
ALTER TABLE agendamentos ADD CONSTRAINT agendamentos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE agendamentos ADD CONSTRAINT agendamentos_profissional_id_fkey FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE;
ALTER TABLE agendamentos ADD CONSTRAINT agendamentos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE;
ALTER TABLE agendamento_servicos ADD CONSTRAINT agendamento_servicos_agendamento_id_fkey FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE;
ALTER TABLE agendamento_servicos ADD CONSTRAINT agendamento_servicos_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE CASCADE;
ALTER TABLE avaliacoes ADD CONSTRAINT avaliacoes_agendamento_id_fkey FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE;
ALTER TABLE avaliacoes ADD CONSTRAINT avaliacoes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE avaliacoes ADD CONSTRAINT avaliacoes_profissional_id_fkey FOREIGN KEY (profissional_id) REFERENCES profissionais(id) ON DELETE CASCADE;

-- 13. RECRIAR POLÍTICAS RLS COM NOVOS NOMES DE TABELA
DROP POLICY IF EXISTS "Public read access" ON empresas;
DROP POLICY IF EXISTS "Public read access" ON unidades;
DROP POLICY IF EXISTS "Public read access" ON profissionais;
DROP POLICY IF EXISTS "Public read access" ON servicos;
DROP POLICY IF EXISTS "Users manage own appointments" ON agendamentos;
DROP POLICY IF EXISTS "Users view own appointment services" ON agendamento_servicos;
DROP POLICY IF EXISTS "Users manage own reviews" ON avaliacoes;

-- Recriar políticas
CREATE POLICY "Acesso publico leitura" ON empresas FOR SELECT USING (true);
CREATE POLICY "Acesso publico leitura" ON unidades FOR SELECT USING (true);
CREATE POLICY "Acesso publico leitura" ON profissionais FOR SELECT USING (true);
CREATE POLICY "Acesso publico leitura" ON servicos FOR SELECT USING (true);
CREATE POLICY "Usuario gerencia seus agendamentos" ON agendamentos FOR ALL USING (auth.uid() = usuario_id);
CREATE POLICY "Usuario visualiza servicos do agendamento" ON agendamento_servicos 
FOR SELECT USING (EXISTS (
  SELECT 1 FROM agendamentos a WHERE a.id = agendamento_id AND a.usuario_id = auth.uid()
));
CREATE POLICY "Usuario gerencia suas avaliacoes" ON avaliacoes FOR ALL USING (auth.uid() = usuario_id);

-- 14. COMENTÁRIOS INFORMATIVOS
COMMENT ON TABLE empresas IS 'Empresas/redes de barbearias';
COMMENT ON TABLE unidades IS 'Unidades/filiais das barbearias';
COMMENT ON TABLE profissionais IS 'Barbeiros e profissionais';
COMMENT ON TABLE servicos IS 'Serviços oferecidos pelos profissionais';
COMMENT ON TABLE disponibilidade IS 'Disponibilidade semanal dos profissionais';
COMMENT ON TABLE horarios_disponiveis IS 'Horários específicos disponíveis';
COMMENT ON TABLE agendamentos IS 'Agendamentos dos clientes';
COMMENT ON TABLE agendamento_servicos IS 'Serviços de cada agendamento';
COMMENT ON TABLE avaliacoes IS 'Avaliações dos clientes';

-- Finalizado! Agora todas as tabelas e colunas estão em português.

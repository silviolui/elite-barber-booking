import { supabase } from './supabase';

// Helper functions para carregar dados reais do Supabase

export const supabaseData = {
  // Carregar todas as empresas
  async getEmpresas() {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('ativo', true);
    
    if (error) {
      console.error('Erro ao carregar empresas:', error);
      return [];
    }
    return data || [];
  },

  // Carregar unidades de uma empresa
  async getUnidades(empresaId = null) {
    let query = supabase
      .from('unidades')
      .select(`
        *,
        empresas (
          id,
          nome,
          descricao
        )
      `)
      .eq('ativo', true);
    
    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao carregar unidades:', error);
      return [];
    }
    return data || [];
  },

  // Carregar profissionais de uma unidade
  async getProfissionais(unidadeId) {
    const { data, error } = await supabase
      .from('profissionais')
      .select(`
        *,
        unidades (
          id,
          nome,
          endereco
        )
      `)
      .eq('unidade_id', unidadeId)
      .eq('ativo', true);
    
    if (error) {
      console.error('Erro ao carregar profissionais:', error);
      return [];
    }
    return data || [];
  },

  // Carregar serviços de um profissional
  async getServicos(profissionalId) {
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('profissional_id', profissionalId)
      .eq('ativo', true);
    
    if (error) {
      console.error('Erro ao carregar serviços:', error);
      return [];
    }
    return data || [];
  },

  // Criar agendamento para o usuário
  async criarAgendamento(usuarioId, agendamentoData) {
    const { data, error } = await supabase
      .from('agendamentos')
      .insert([
        {
          usuario_id: usuarioId,
          profissional_id: agendamentoData.profissionalId,
          unidade_id: agendamentoData.unidadeId,
          data_agendamento: agendamentoData.data,
          horario_inicio: agendamentoData.horarioInicio,
          horario_fim: agendamentoData.horarioFim,
          preco_total: agendamentoData.precoTotal,
          observacoes: agendamentoData.observacoes || null
        }
      ])
      .select();
    
    if (error) {
      console.error('Erro ao criar agendamento:', error);
      return { success: false, error: error.message };
    }

    // Adicionar serviços do agendamento
    if (data && data[0] && agendamentoData.servicos?.length > 0) {
      const agendamentoId = data[0].id;
      
      const servicosAgendamento = agendamentoData.servicos.map(servico => ({
        agendamento_id: agendamentoId,
        servico_id: servico.id,
        preco: servico.preco
      }));

      const { error: servicosError } = await supabase
        .from('agendamento_servicos')
        .insert(servicosAgendamento);

      if (servicosError) {
        console.error('Erro ao adicionar serviços:', servicosError);
      }
    }

    return { success: true, data: data[0] };
  },

  // Carregar agendamentos do usuário
  async getAgendamentosUsuario(usuarioId) {
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        *,
        unidades (nome, endereco),
        profissionais (nome, especialidade),
        agendamento_servicos (
          preco,
          servicos (nome, duracao_minutos)
        )
      `)
      .eq('usuario_id', usuarioId)
      .order('data_agendamento', { ascending: false });
    
    if (error) {
      console.error('Erro ao carregar agendamentos:', error);
      return [];
    }
    return data || [];
  },

  // Carregar horários disponíveis de um profissional
  async getHorariosDisponiveis(profissionalId, data) {
    const { data: horarios, error } = await supabase
      .from('horarios_disponiveis')
      .select('*')
      .eq('profissional_id', profissionalId)
      .eq('data', data)
      .eq('disponivel', true);
    
    if (error) {
      console.error('Erro ao carregar horários:', error);
      return [];
    }
    return horarios || [];
  }
};

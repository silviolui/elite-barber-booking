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

  // Carregar TODAS as unidades ativas para o cliente escolher
  async getUnidades() {
    const { data, error } = await supabase
      .from('unidades')
      .select(`
        *,
        empresas (
          id,
          nome,
          descricao
        )
      `)
      .eq('ativo', true)
      .order('nome');
    
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

  // Criar agendamento para o CLIENTE
  async criarAgendamento(clienteId, agendamentoData) {
    const { data, error } = await supabase
      .from('agendamentos')
      .insert([
        {
          usuario_id: clienteId,
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
  },

  // Carregar horário de funcionamento de uma unidade
  async getHorarioFuncionamento(unidadeId) {
    const { data, error } = await supabase
      .from('horario_funcionamento')
      .select('*')
      .eq('unidade_id', unidadeId)
      .eq('ativo', true);
    
    if (error) {
      console.error('Erro ao carregar horário de funcionamento:', error);
      return [];
    }
    return data || [];
  },

  // Verificar se unidade está aberta em um dia específico
  async isUnidadeAberta(unidadeId, data) {
    const dayOfWeek = data.getDay(); // 0=Domingo, 1=Segunda, ..., 6=Sábado
    
    const { data: horarios, error } = await supabase
      .from('horario_funcionamento')
      .select('*')
      .eq('unidade_id', unidadeId)
      .eq('dia_semana', dayOfWeek)
      .eq('ativo', true);
    
    if (error) {
      console.error('Erro ao verificar funcionamento:', error);
      return false;
    }
    
    // Verificar se pelo menos um período está aberto
    if (horarios && horarios.length > 0) {
      const horario = horarios[0];
      return horario.abre_manha || horario.abre_tarde || horario.abre_noite;
    }
    
    return false;
  },

  // NOVA FUNÇÃO: Verificar períodos disponíveis para um dia
  async getPeriodosDisponiveis(unidadeId, data) {
    const dayOfWeek = data.getDay(); // 0=Domingo, 1=Segunda, ..., 6=Sábado
    
    console.log('🔍 getPeriodosDisponiveis:', {
      unidadeId,
      data: data.toISOString(),
      dayOfWeek
    });
    
    const { data: horarios, error } = await supabase
      .from('horario_funcionamento')
      .select('*')
      .eq('unidade_id', unidadeId)
      .eq('dia_semana', dayOfWeek)
      .eq('ativo', true);
    
    console.log('📊 Resultado da consulta:', { horarios, error });
    
    if (error) {
      console.error('Erro ao carregar períodos:', error);
      return { manha: false, tarde: false, noite: false };
    }
    
    if (horarios && horarios.length > 0) {
      const horario = horarios[0];
      const resultado = {
        manha: horario.abre_manha || false,
        tarde: horario.abre_tarde || false,
        noite: horario.abre_noite || false,
        horarios: {
          manha: {
            inicio: horario.horario_abertura_manha,
            fim: horario.horario_fechamento_manha
          },
          tarde: {
            inicio: horario.horario_abertura_tarde,
            fim: horario.horario_fechamento_tarde
          },
          noite: {
            inicio: horario.horario_abertura_noite,
            fim: horario.horario_fechamento_noite
          }
        }
      };
      
      console.log('✅ Períodos encontrados:', resultado);
      return resultado;
    }
    
    console.log('❌ Nenhum horário encontrado para esta data');
    return { manha: false, tarde: false, noite: false };
  },

  // NOVA FUNÇÃO: Gerar horários disponíveis baseado no período e horário de funcionamento
  async gerarHorariosDisponiveis(unidadeId, data, periodo) {
    const periodos = await this.getPeriodosDisponiveis(unidadeId, data);
    
    if (!periodos[periodo]) {
      return []; // Período fechado, retorna array vazio
    }
    
    const horarioInfo = periodos.horarios[periodo];
    if (!horarioInfo.inicio || !horarioInfo.fim) {
      return []; // Sem horários definidos
    }
    
    // Gerar slots de 30 em 30 minutos
    const horarios = [];
    const [horaInicio, minutoInicio] = horarioInfo.inicio.split(':').map(Number);
    const [horaFim, minutoFim] = horarioInfo.fim.split(':').map(Number);
    
    let horaAtual = horaInicio;
    let minutoAtual = minutoInicio;
    
    while (horaAtual < horaFim || (horaAtual === horaFim && minutoAtual < minutoFim)) {
      const horarioFormatado = `${horaAtual.toString().padStart(2, '0')}:${minutoAtual.toString().padStart(2, '0')}`;
      horarios.push(horarioFormatado);
      
      minutoAtual += 30;
      if (minutoAtual >= 60) {
        minutoAtual = 0;
        horaAtual++;
      }
    }
    
    return horarios;
  }
};

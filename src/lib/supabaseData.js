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
    // Pegar o ID do primeiro serviço selecionado
    const servicoId = agendamentoData.servicos && agendamentoData.servicos.length > 0 
      ? agendamentoData.servicos[0].id 
      : null;

    const { data, error } = await supabase
      .from('agendamentos')
      .insert([
        {
          usuario_id: clienteId,
          profissional_id: agendamentoData.profissionalId,
          unidade_id: agendamentoData.unidadeId,
          servico_id: servicoId,
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
  async gerarHorariosDisponiveis(unidadeId, data, periodo, profissionalId = null, servicosSelecionados = [], periodosPrecarregados = null) {
    // Usar períodos pré-carregados para evitar consulta duplicada
    const periodos = periodosPrecarregados || await this.getPeriodosDisponiveis(unidadeId, data);
    
    if (!periodos[periodo]) {
      return []; // Período fechado, retorna array vazio
    }
    
    const horarioInfo = periodos.horarios[periodo];
    if (!horarioInfo.inicio || !horarioInfo.fim) {
      return []; // Sem horários definidos
    }
    
    // Calcular duração total dos serviços selecionados
    const duracaoTotal = servicosSelecionados.reduce((total, servico) => {
      return total + (parseInt(servico.duracao_minutos || servico.duracao || servico.duration) || 30);
    }, 0) || 30; // Default 30 minutos se não houver serviços
    
    console.log('⏱️ Duração total dos serviços:', duracaoTotal, 'minutos');
    
    // Verificar se é o dia de hoje e aplicar regra de 20 minutos de antecedência
    const hoje = new Date();
    const dataVerificacao = typeof data === 'string' ? new Date(data) : data;
    const isHoje = dataVerificacao.toDateString() === hoje.toDateString();
    
    let horarioMinimoInicio = null;
    if (isHoje) {
      // Adicionar 20 minutos à hora atual e arredondar para horário arredondado
      const agora = new Date();
      agora.setMinutes(agora.getMinutes() + 20);
      
      // Arredondar para o próximo horário "redondo" (00 ou 30)
      let minutosArredondados = agora.getMinutes();
      if (minutosArredondados > 0 && minutosArredondados <= 30) {
        minutosArredondados = 30;
      } else if (minutosArredondados > 30) {
        minutosArredondados = 0;
        agora.setHours(agora.getHours() + 1);
      }
      
      horarioMinimoInicio = `${agora.getHours().toString().padStart(2, '0')}:${minutosArredondados.toString().padStart(2, '0')}`;
      console.log('🕐 Horário mínimo para hoje (20min + arredondamento):', horarioMinimoInicio);
    }
    
    // Gerar slots baseado na duração dos serviços
    const horarios = [];
    const [horaInicio, minutoInicio] = horarioInfo.inicio.split(':').map(Number);
    const [horaFim, minutoFim] = horarioInfo.fim.split(':').map(Number);
    
    let horaAtual = horaInicio;
    let minutoAtual = minutoInicio;
    
    while (horaAtual < horaFim || (horaAtual === horaFim && minutoAtual < minutoFim)) {
      const horarioFormatado = `${horaAtual.toString().padStart(2, '0')}:${minutoAtual.toString().padStart(2, '0')}`;
      
      // Se é hoje, verificar se o horário atende à regra de antecedência
      let podeAgendar = true;
      if (isHoje && horarioMinimoInicio) {
        const [horaMinimaInicio, minutoMinimoInicio] = horarioMinimoInicio.split(':').map(Number);
        if (horaAtual < horaMinimaInicio || (horaAtual === horaMinimaInicio && minutoAtual < minutoMinimoInicio)) {
          podeAgendar = false;
        }
      }
      
      if (podeAgendar) {
        horarios.push(horarioFormatado);
      }
      
      // Incrementar baseado na duração dos serviços
      minutoAtual += duracaoTotal;
      if (minutoAtual >= 60) {
        horaAtual += Math.floor(minutoAtual / 60);
        minutoAtual = minutoAtual % 60;
      }
    }
    
    // Se profissionalId foi fornecido, filtrar horários ocupados
    if (profissionalId) {
      const horariosOcupados = await this.getHorariosOcupados(profissionalId, data);
      const horariosDisponiveis = horarios.filter(horario => {
        return !horariosOcupados.some(ocupado => {
          const horarioOcupado = ocupado.horario_inicio.substring(0, 5);
          return horarioOcupado === horario;
        });
      });
      
      return horariosDisponiveis;
    }
    
    return horarios;
  },

  // NOVA FUNÇÃO OTIMIZADA: Busca todos os dados de uma vez para uma data específica
  async getDadosCompletosData(unidadeId, data, profissionalId, servicosSelecionados = []) {
    try {
      const promises = [];
      
      // 1. Buscar períodos disponíveis
      promises.push(this.getPeriodosDisponiveis(unidadeId, data));
      
      // 2. Buscar folgas do profissional para a data (uma query RPC que verifica todos os períodos)
      const dataStr = typeof data === 'string' ? data : data.toISOString().split('T')[0];
      promises.push(
        supabase.rpc('verificar_folgas_todos_periodos', {
          profissional_uuid: profissionalId,
          data_verificar: dataStr
        }).then(response => {
          if (response.error) {
            console.warn('Erro na verificação de folgas otimizada, usando método individual:', response.error);
            return null; // Fallback para método individual
          }
          return response.data;
        })
      );
      
      // 3. Buscar horários ocupados
      if (profissionalId) {
        promises.push(this.getHorariosOcupados(profissionalId, dataStr));
      }
      
      const [periodos, folgasPeriodos, horariosOcupados] = await Promise.all(promises);
      
      // Processar folgas por período (fallback se RPC falhar)
      let folgas = folgasPeriodos;
      if (!folgas) {
        const folgasPromises = ['manha', 'tarde', 'noite'].map(periodo =>
          this.profissionalEstaDefolguePeriodo(profissionalId, dataStr, periodo)
        );
        const resultadosFolgas = await Promise.all(folgasPromises);
        folgas = {
          manha: resultadosFolgas[0],
          tarde: resultadosFolgas[1],
          noite: resultadosFolgas[2]
        };
      }
      
      // Gerar horários para todos os períodos disponíveis
      const horariosMap = { manha: [], tarde: [], noite: [] };
      const periodosComFolga = { manha: false, tarde: false, noite: false };
      
      for (const periodo of ['manha', 'tarde', 'noite']) {
        const estaDefolga = folgas[periodo] || false;
        periodosComFolga[periodo] = estaDefolga;
        
        if (periodos[periodo] && !estaDefolga) {
          // Usar função otimizada passando períodos pré-carregados
          const horarios = await this.gerarHorariosDisponiveis(
            unidadeId, 
            data, 
            periodo, 
            null, // não filtrar ocupados aqui
            servicosSelecionados,
            periodos // passar períodos pré-carregados
          );
          
          // Filtrar horários ocupados se necessário
          if (profissionalId && horariosOcupados) {
            const horariosDisponiveis = horarios.filter(horario => {
              return !horariosOcupados.some(ocupado => {
                const horarioOcupado = ocupado.horario_inicio.substring(0, 5);
                return horarioOcupado === horario;
              });
            });
            horariosMap[periodo] = horariosDisponiveis;
          } else {
            horariosMap[periodo] = horarios;
          }
        } else if (estaDefolga) {
          periodos[periodo] = false; // Desabilitar período de folga
        }
      }
      
      return {
        periodos,
        horariosMap,
        folgas: periodosComFolga
      };
      
    } catch (error) {
      console.error('Erro ao buscar dados completos da data:', error);
      throw error;
    }
  },

  // Buscar horários ocupados de um profissional em uma data
  async getHorariosOcupados(profissionalId, data) {
    const dataFormatada = data.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select('horario_inicio, horario_fim')
      .eq('profissional_id', profissionalId)
      .eq('data_agendamento', dataFormatada)
      .in('status', ['pending', 'confirmed']); // Apenas agendamentos ativos
    
    if (error) {
      console.error('Erro ao buscar horários ocupados:', error);
      return [];
    }
    
    return agendamentos || [];
  },

  // Buscar agendamentos de um profissional em um mês (OTIMIZADO)
  async getAgendamentosMes(profissionalId, dataInicio, dataFim) {
    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select('data_agendamento, horario_inicio, horario_fim, status')
      .eq('profissional_id', profissionalId)
      .gte('data_agendamento', dataInicio)
      .lte('data_agendamento', dataFim)
      .in('status', ['pending', 'confirmed']);
    
    if (error) {
      console.error('Erro ao buscar agendamentos do mês:', error);
      return [];
    }
    
    return agendamentos || [];
  },

  // Buscar usuário atual da sessão
  async getCurrentUser() {
    return await supabase.auth.getUser();
  },

  // Buscar todos os usuários da tabela (fallback)
  async getUsuarios() {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, nome')
      .order('criado_em', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
    
    return data || [];
  },

  // ===== FUNÇÕES DE FOLGAS PARA PROFISSIONAIS =====

  // Verificar se profissional está de folga numa data específica
  async profissionalEstaDefolga(profissionalId, data) {
    try {
      const { data: result, error } = await supabase
        .rpc('profissional_esta_de_folga', {
          profissional_uuid: profissionalId,
          data_verificar: data
        });

      if (error) {
        console.error('Erro ao verificar folga do profissional:', error);
        return false;
      }

      return result || false;
    } catch (error) {
      console.error('Erro ao verificar folga:', error);
      return false;
    }
  },

  // Obter todas as folgas de um profissional
  async getFolgasProfissional(profissionalId) {
    const { data, error } = await supabase
      .from('folgas_profissionais')
      .select('*')
      .eq('profissional_id', profissionalId)
      .eq('ativo', true)
      .order('tipo_folga', { ascending: true });

    if (error) {
      console.error('Erro ao carregar folgas do profissional:', error);
      return [];
    }

    return data || [];
  },

  // Verificar se profissional está de folga em um período específico
  async profissionalEstaDefolguePeriodo(profissionalId, data, periodo) {
    try {
      const { data: result, error } = await supabase
        .rpc('profissional_esta_de_folga_periodo', {
          profissional_uuid: profissionalId,
          data_verificar: data,
          periodo: periodo
        });

      if (error) {
        console.error('Erro ao verificar folga do profissional por período:', error);
        return false;
      }

      return result || false;
    } catch (error) {
      console.error('Erro ao verificar folga por período:', error);
      return false;
    }
  },

  // Adicionar nova folga
  async adicionarFolga(folgaData) {
    const { data, error } = await supabase
      .from('folgas_profissionais')
      .insert(folgaData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar folga:', error);
      throw error;
    }

    return data;
  },

  // Remover folga
  async removerFolga(folgaId) {
    const { error } = await supabase
      .from('folgas_profissionais')
      .delete()
      .eq('id', folgaId);

    if (error) {
      console.error('Erro ao remover folga:', error);
      throw error;
    }

    return true;
  },

  // Obter datas de folga específicas do profissional (para marcar no calendário)
  async getDatasfolga(profissionalId, mesAno = null) {
    const { data, error } = await supabase
      .from('folgas_profissionais')
      .select('tipo_folga, data_folga, dia_semana, folga_manha, folga_tarde, folga_noite')
      .eq('profissional_id', profissionalId)
      .eq('ativo', true);

    if (error) {
      console.error('Erro ao carregar datas de folga:', error);
      return [];
    }

    // Filtrar folgas específicas por mês apenas se necessário
    if (mesAno) {
      const [ano, mes] = mesAno.split('-');
      const inicioMes = `${ano}-${mes.padStart(2, '0')}-01`;
      const fimMes = `${ano}-${mes.padStart(2, '0')}-31`;
      
      return (data || []).filter(folga => {
        // TODAS as folgas recorrentes são sempre válidas (independente do mês)
        if (folga.tipo_folga === 'dia_semana_recorrente') {
          return true;
        }
        
        // Folgas específicas: filtrar pelo mês
        if (folga.tipo_folga === 'data_especifica' && folga.data_folga) {
          return folga.data_folga >= inicioMes && folga.data_folga <= fimMes;
        }
        
        return false;
      });
    }

    return data || [];
  }
};

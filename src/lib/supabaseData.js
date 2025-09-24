import { supabase } from './supabase';
import { 
  getBrazilDate, 
  toBrazilDate, 
  formatDateBR, 
  formatTimeBR, 
  formatDateTimeBR,
  getBrazilISOString,
  dateToStringBrazil,
  parseDateStringToBrazil,
  isToday
} from '../utils/timezone';

// Helper functions para carregar dados reais do Supabase

// Funções auxiliares específicas para agendamentos
const agendamentoHelpers = {
  // Verifica disponibilidade de um horário específico
  async verificarDisponibilidade(profissionalId, data, horarioInicio, duracaoMinutos) {
    try {
      // Garantir formato correto da data
      const dataFormatada = typeof data === 'string' ? data : dateToStringBrazil(toBrazilDate(data));
      
      // Calcular horário de fim
      const [hora, minuto] = horarioInicio.split(':').map(Number);
      const inicioMinutos = hora * 60 + minuto;
      const fimMinutos = inicioMinutos + duracaoMinutos;

      // Buscar agendamentos conflitantes
      const { data: conflitos, error } = await supabase
        .from('agendamentos')
        .select('horario_inicio, horario_fim')
        .eq('profissional_id', profissionalId)
        .eq('data_agendamento', dataFormatada)
        .in('status', ['pending', 'confirmed']);

      if (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        return false;
      }

      // Verificar conflitos de horário
      const temConflito = conflitos.some(agendamento => {
        const [agendHoraInicio, agendMinutoInicio] = agendamento.horario_inicio.substring(0, 5).split(':').map(Number);
        const [agendHoraFim, agendMinutoFim] = agendamento.horario_fim.substring(0, 5).split(':').map(Number);
        const agendInicioMinutos = agendHoraInicio * 60 + agendMinutoInicio;
        const agendFimMinutos = agendHoraFim * 60 + agendMinutoFim;

        // Verifica sobreposição
        return !(fimMinutos <= agendInicioMinutos || inicioMinutos >= agendFimMinutos);
      });

      return !temConflito;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return false;
    }
  },

  // Busca slots disponíveis para uma data específica
  async buscarSlotsDisponiveis(unidadeId, profissionalId, data, servicosSelecionados = []) {
    try {
      // Usar função otimizada que já existe
      const dadosCompletos = await supabaseData.getDadosCompletosData(
        unidadeId, 
        data, 
        profissionalId, 
        servicosSelecionados
      );

      return {
        periodos: dadosCompletos.periodos,
        horarios: dadosCompletos.horariosMap,
        folgas: dadosCompletos.folgas
      };
    } catch (error) {
      console.error('Erro ao buscar slots disponíveis:', error);
      return {
        periodos: { manha: false, tarde: false, noite: false },
        horarios: { manha: [], tarde: [], noite: [] },
        folgas: { manha: false, tarde: false, noite: false }
      };
    }
  }
};

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

  // Carregar profissionais de uma unidade com informações sobre disponibilidade para uma data
  async getProfissionaisPorUnidade(unidadeId, dataConsulta = null) {
    try {
      // Buscar profissionais básicos
      const profissionais = await this.getProfissionais(unidadeId);

      // Se não há data especificada, retornar apenas profissionais
      if (!dataConsulta) {
        return profissionais;
      }

      // Usar horário de Brasília para a data de consulta
      const dataBrasil = typeof dataConsulta === 'string' 
        ? parseDateStringToBrazil(dataConsulta) 
        : toBrazilDate(dataConsulta);

      // Adicionar informações de disponibilidade para cada profissional
      const profissionaisComDisponibilidade = await Promise.all(
        profissionais.map(async (profissional) => {
          // Verificar se está de folga
          const estaDefolga = await this.profissionalEstaDefolga(
            profissional.id, 
            dateToStringBrazil(dataBrasil)
          );

          return {
            ...profissional,
            disponivel: !estaDefolga,
            dataConsulta: formatDateBR(dataBrasil)
          };
        })
      );

      return profissionaisComDisponibilidade;
    } catch (error) {
      console.error('Erro ao carregar profissionais por unidade:', error);
      return [];
    }
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

    // Garantir que a data está no formato correto para o banco (YYYY-MM-DD)
    const dataAgendamento = typeof agendamentoData.data === 'string' 
      ? agendamentoData.data 
      : dateToStringBrazil(toBrazilDate(agendamentoData.data));

    // Garantir que os horários estão no formato correto (HH:MM:SS)
    const horarioInicio = agendamentoData.horarioInicio.includes(':') 
      ? (agendamentoData.horarioInicio.length === 5 ? `${agendamentoData.horarioInicio}:00` : agendamentoData.horarioInicio)
      : agendamentoData.horarioInicio;
    
    const horarioFim = agendamentoData.horarioFim.includes(':') 
      ? (agendamentoData.horarioFim.length === 5 ? `${agendamentoData.horarioFim}:00` : agendamentoData.horarioFim)
      : agendamentoData.horarioFim;

    const { data, error } = await supabase
      .from('agendamentos')
      .insert([
        {
          usuario_id: clienteId,
          profissional_id: agendamentoData.profissionalId,
          unidade_id: agendamentoData.unidadeId,
          servico_id: servicoId,
          data_agendamento: dataAgendamento,
          horario_inicio: horarioInicio,
          horario_fim: horarioFim,
          preco_total: agendamentoData.precoTotal,
          observacoes: agendamentoData.observacoes || null,
          created_at: getBrazilISOString()
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

    // Formatear datas e horários usando timezone do Brasil
    const agendamentosFormatados = (data || []).map(agendamento => ({
      ...agendamento,
      data_agendamento_formatada: formatDateBR(agendamento.data_agendamento),
      horario_inicio_formatado: formatTimeBR(agendamento.horario_inicio),
      horario_fim_formatado: formatTimeBR(agendamento.horario_fim),
      data_criacao_formatada: agendamento.created_at ? formatDateTimeBR(agendamento.created_at) : null
    }));

    return agendamentosFormatados;
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
    // Converter para horário de Brasília antes de calcular o dia da semana
    const dataBrasil = toBrazilDate(data);
    const dayOfWeek = dataBrasil.getDay(); // 0=Domingo, 1=Segunda, ..., 6=Sábado
    
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
    // Converter para horário de Brasília antes de calcular o dia da semana
    const dataBrasil = toBrazilDate(data);
    const dayOfWeek = dataBrasil.getDay(); // 0=Domingo, 1=Segunda, ..., 6=Sábado
    
    console.log('🔍 getPeriodosDisponiveis:', {
      unidadeId,
      data: dataBrasil.toISOString(),
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

  // Função para buscar configuração de intervalos de uma unidade
  async getIntervaloSlots(unidadeId) {
    try {
      if (!unidadeId) {
        console.log('⚠️ Unidade não especificada, usando padrão de 20 minutos');
        return 20; // Padrão global
      }

      const { data, error } = await supabase
        .from('configuracoes_unidade')
        .select('intervalo_slots')
        .eq('unidade_id', unidadeId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro ao buscar configuração de intervalos:', error);
        return 20; // Padrão em caso de erro
      }

      const intervalo = data?.intervalo_slots || 20;
      console.log(`📊 Intervalo de slots para unidade ${unidadeId}: ${intervalo} minutos`);
      return intervalo;
    } catch (error) {
      console.error('Erro ao buscar configuração de intervalos:', error);
      return 20; // Padrão em caso de erro
    }
  },

  // Função auxiliar para calcular quantos slots um serviço consome (baseado no intervalo configurado)
  calcularSlotsNecessarios(servicosSelecionados, intervaloSlots = 20) {
    const duracaoTotal = servicosSelecionados.reduce((total, servico) => {
      return total + (parseInt(servico.duracao_minutos || servico.duracao || servico.duration) || 30);
    }, 0) || 30; // Default 30 minutos se não houver serviços
    
    // Calcular quantos slots são necessários baseado no intervalo configurado (sempre arredonda para cima)
    const slotsNecessarios = Math.ceil(duracaoTotal / intervaloSlots);
    
    console.log('⏱️ Duração total dos serviços:', duracaoTotal, 'minutos');
    console.log(`🎯 Slots necessários (${intervaloSlots}min cada):`, slotsNecessarios);
    
    return { duracaoTotal, slotsNecessarios };
  },

  // Função auxiliar para verificar se dois slots são consecutivos (baseado no intervalo configurado)
  saoSlotsConsecutivos(slot1, slot2, intervaloSlots = 20) {
    const [hora1, min1] = slot1.split(':').map(Number);
    const [hora2, min2] = slot2.split(':').map(Number);
    
    const minutos1 = hora1 * 60 + min1;
    const minutos2 = hora2 * 60 + min2;
    
    return minutos2 - minutos1 === intervaloSlots;
  },

  // NOVA FUNÇÃO: Gerar horários disponíveis baseado no período e horário de funcionamento
  async gerarHorariosDisponiveis(unidadeId, data, periodo, profissionalId = null, servicosSelecionados = [], periodosPrecarregados = null) {
    // Buscar configuração de intervalos da unidade
    const intervaloSlots = await this.getIntervaloSlots(unidadeId);
    
    // Usar períodos pré-carregados para evitar consulta duplicada
    const periodos = periodosPrecarregados || await this.getPeriodosDisponiveis(unidadeId, data);
    
    if (!periodos[periodo]) {
      return []; // Período fechado, retorna array vazio
    }
    
    const horarioInfo = periodos.horarios[periodo];
    if (!horarioInfo.inicio || !horarioInfo.fim) {
      return []; // Sem horários definidos
    }
    
    // Calcular quantos slots o serviço precisa baseado no intervalo configurado
    const { duracaoTotal, slotsNecessarios } = this.calcularSlotsNecessarios(servicosSelecionados, intervaloSlots);
    
    // Verificar se é o dia de hoje e aplicar regra de 20 minutos de antecedência
    // Usar horário de Brasília para comparações
    const dataVerificacao = typeof data === 'string' ? parseDateStringToBrazil(data) : toBrazilDate(data);
    const ehHoje = isToday(dataVerificacao);
    
    let horarioMinimoInicio = null;
    if (ehHoje) {
      // Adicionar 20 minutos à hora atual (horário de Brasília) e arredondar para próximo slot configurado
      const agoraBrasil = getBrazilDate();
      agoraBrasil.setMinutes(agoraBrasil.getMinutes() + 20);
      
      // Arredondar para o próximo slot baseado no intervalo configurado
      const minutosAtuais = agoraBrasil.getMinutes();
      const minutosArredondados = Math.ceil(minutosAtuais / intervaloSlots) * intervaloSlots;
      
      if (minutosArredondados >= 60) {
        agoraBrasil.setHours(agoraBrasil.getHours() + Math.floor(minutosArredondados / 60));
        agoraBrasil.setMinutes(minutosArredondados % 60);
      } else {
        agoraBrasil.setMinutes(minutosArredondados);
      }
      
      horarioMinimoInicio = `${agoraBrasil.getHours().toString().padStart(2, '0')}:${agoraBrasil.getMinutes().toString().padStart(2, '0')}`;
      console.log(`🕐 Horário mínimo para hoje (20min + arredondamento para ${intervaloSlots}min):`, horarioMinimoInicio);
    }
    
    // Gerar slots FIXOS baseado no intervalo configurado
    const todosSlots = [];
    const [horaInicio, minutoInicio] = horarioInfo.inicio.split(':').map(Number);
    const [horaFim, minutoFim] = horarioInfo.fim.split(':').map(Number);
    
    let horaAtual = horaInicio;
    let minutoAtual = minutoInicio;
    
    // Ajustar o minuto inicial para o próximo slot baseado no intervalo configurado
    if (minutoAtual % intervaloSlots !== 0) {
      minutoAtual = Math.ceil(minutoAtual / intervaloSlots) * intervaloSlots;
      if (minutoAtual >= 60) {
        horaAtual += Math.floor(minutoAtual / 60);
        minutoAtual = minutoAtual % 60;
      }
    }
    
    // Gerar todos os slots baseado no intervalo configurado
    while (horaAtual < horaFim || (horaAtual === horaFim && minutoAtual < minutoFim)) {
      const horarioFormatado = `${horaAtual.toString().padStart(2, '0')}:${minutoAtual.toString().padStart(2, '0')}`;
      
      // Se é hoje, verificar se o horário atende à regra de antecedência
      let podeAgendar = true;
      if (ehHoje && horarioMinimoInicio) {
        const [horaMinimaInicio, minutoMinimoInicio] = horarioMinimoInicio.split(':').map(Number);
        if (horaAtual < horaMinimaInicio || (horaAtual === horaMinimaInicio && minutoAtual < minutoMinimoInicio)) {
          podeAgendar = false;
        }
      }
      
      if (podeAgendar) {
        todosSlots.push(horarioFormatado);
      }
      
      // Incrementar baseado no intervalo configurado
      minutoAtual += intervaloSlots;
      if (minutoAtual >= 60) {
        horaAtual += Math.floor(minutoAtual / 60);
        minutoAtual = minutoAtual % 60;
      }
    }
    
    // Filtrar slots que têm espaço suficiente para os slots consecutivos necessários
    const horariosDisponiveis = [];
    for (let i = 0; i <= todosSlots.length - slotsNecessarios; i++) {
      // Verificar se os próximos slots são consecutivos
      let slotsConsecutivos = true;
      const slotInicial = todosSlots[i];
      
      for (let j = 1; j < slotsNecessarios; j++) {
        const slotAtual = todosSlots[i + j];
        const slotAnterior = todosSlots[i + j - 1];
        
        if (!slotAtual || !this.saoSlotsConsecutivos(slotAnterior, slotAtual, intervaloSlots)) {
          slotsConsecutivos = false;
          break;
        }
      }
      
      if (slotsConsecutivos) {
        horariosDisponiveis.push(slotInicial);
      }
    }
    
    // Se profissionalId foi fornecido, filtrar horários ocupados (VERIFICAÇÃO DE SOBREPOSIÇÃO)
    if (profissionalId) {
      const horariosOcupados = await this.getHorariosOcupados(profissionalId, data);
      const horariosLivres = horariosDisponiveis.filter(horario => {
        return !horariosOcupados.some(ocupado => {
          // Converter horário inicial para minutos
          const [novoHoraInicio, novoMinutoInicio] = horario.split(':').map(Number);
          const novoInicioMinutos = novoHoraInicio * 60 + novoMinutoInicio;
          // Novo fim = início + duração total (que pode ser múltiplos de 20min)
          const novoFimMinutos = novoInicioMinutos + duracaoTotal;
          
          // Horário ocupado existente
          const [ocupadoHoraInicio, ocupadoMinutoInicio] = ocupado.horario_inicio.substring(0, 5).split(':').map(Number);
          const [ocupadoHoraFim, ocupadoMinutoFim] = ocupado.horario_fim.substring(0, 5).split(':').map(Number);
          const ocupadoInicioMinutos = ocupadoHoraInicio * 60 + ocupadoMinutoInicio;
          const ocupadoFimMinutos = ocupadoHoraFim * 60 + ocupadoMinutoFim;
          
          // VERIFICAR SOBREPOSIÇÃO: há conflito se os intervalos se sobrepõem
          const haConflito = !(novoFimMinutos <= ocupadoInicioMinutos || novoInicioMinutos >= ocupadoFimMinutos);
          
          if (haConflito) {
            console.log(`❌ Conflito encontrado: ${horario} (${duracaoTotal}min) vs ocupado ${ocupado.horario_inicio}-${ocupado.horario_fim}`);
          }
          
          return haConflito;
        });
      });
      
      return horariosLivres;
    }
    
    return horariosDisponiveis;
  },

  // NOVA FUNÇÃO OTIMIZADA: Busca todos os dados de uma vez para uma data específica
  async getDadosCompletosData(unidadeId, data, profissionalId, servicosSelecionados = []) {
    try {
      console.log('🚀 Iniciando busca otimizada de dados...');
      // Garantir que a data está no formato correto usando horário de Brasília
      const dataStr = typeof data === 'string' ? data : dateToStringBrazil(toBrazilDate(data));
      
      // Primeira fase: buscar dados básicos em paralelo
      const [periodos, horariosOcupados] = await Promise.all([
        this.getPeriodosDisponiveis(unidadeId, data),
        profissionalId ? this.getHorariosOcupados(profissionalId, dataStr) : Promise.resolve([])
      ]);
      
      console.log('✅ Períodos e horários ocupados carregados');
      
      // Segunda fase: tentar RPC otimizada para folgas ou usar fallback
      let folgas = null;
      
      try {
        console.log('🔄 Tentando RPC otimizada para folgas...');
        const response = await supabase.rpc('verificar_folgas_todos_periodos', {
          profissional_uuid: profissionalId,
          data_verificar: dataStr
        });
        
        if (!response.error && response.data) {
          folgas = response.data;
          console.log('✅ RPC de folgas funcionou:', folgas);
        } else {
          console.log('⚠️ RPC retornou erro:', response.error?.message);
        }
      } catch (error) {
        console.log('⚠️ RPC não disponível, usando fallback:', error.message);
      }
      
      // Se RPC falhou, usar método individual (otimizado com Promise.all)
      if (!folgas) {
        console.log('🔄 Usando verificação individual de folgas...');
        const folgasPromises = ['manha', 'tarde', 'noite'].map(periodo =>
          this.profissionalEstaDefolguePeriodo(profissionalId, dataStr, periodo)
        );
        const resultadosFolgas = await Promise.all(folgasPromises);
        folgas = {
          manha: resultadosFolgas[0],
          tarde: resultadosFolgas[1],
          noite: resultadosFolgas[2]
        };
        console.log('✅ Folgas individuais carregadas:', folgas);
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
          
          // Filtrar horários ocupados se necessário (VERIFICAÇÃO DE SOBREPOSIÇÃO COMPLETA)
          if (profissionalId && horariosOcupados) {
            // Calcular duração total dos serviços selecionados para o novo agendamento
            const duracaoTotal = servicosSelecionados.reduce((total, servico) => {
              return total + (parseInt(servico.duracao_minutos || servico.duracao || servico.duration) || 30);
            }, 0) || 30;
            
            const horariosDisponiveis = horarios.filter(horario => {
              // Para cada horário candidato, verificar se há conflito com agendamentos existentes
              return !horariosOcupados.some(ocupado => {
                // Converter horários para minutos para facilitar cálculo
                const [novoHoraInicio, novoMinutoInicio] = horario.split(':').map(Number);
                const novoInicioMinutos = novoHoraInicio * 60 + novoMinutoInicio;
                const novoFimMinutos = novoInicioMinutos + duracaoTotal;
                
                // Horário ocupado existente
                const [ocupadoHoraInicio, ocupadoMinutoInicio] = ocupado.horario_inicio.substring(0, 5).split(':').map(Number);
                const [ocupadoHoraFim, ocupadoMinutoFim] = ocupado.horario_fim.substring(0, 5).split(':').map(Number);
                const ocupadoInicioMinutos = ocupadoHoraInicio * 60 + ocupadoMinutoInicio;
                const ocupadoFimMinutos = ocupadoHoraFim * 60 + ocupadoMinutoFim;
                
                // VERIFICAR SOBREPOSIÇÃO: há conflito se os intervalos se sobrepõem
                const haConflito = !(novoFimMinutos <= ocupadoInicioMinutos || novoInicioMinutos >= ocupadoFimMinutos);
                
                if (haConflito) {
                  console.log(`❌ Conflito detectado: ${horario} (${novoInicioMinutos}-${novoFimMinutos}min) sobrepõe com ${ocupado.horario_inicio.substring(0,5)}-${ocupado.horario_fim.substring(0,5)} (${ocupadoInicioMinutos}-${ocupadoFimMinutos}min)`);
                }
                
                return haConflito;
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
    // Garantir formato correto da data usando horário de Brasília
    const dataFormatada = typeof data === 'string' ? data : dateToStringBrazil(toBrazilDate(data)); // YYYY-MM-DD
    
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
  },

  // Expor funções auxiliares de agendamento
  verificarDisponibilidade: agendamentoHelpers.verificarDisponibilidade,
  buscarSlotsDisponiveis: agendamentoHelpers.buscarSlotsDisponiveis
};

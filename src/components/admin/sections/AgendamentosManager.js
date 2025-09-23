import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  User,
  MapPin,
  Search,
  Plus,
  Edit,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import ConfirmationModal from '../../ConfirmationModal';

const AgendamentosManager = ({ currentUser }) => {
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const unidadeId = adminData.unidade_id || currentUser?.unidade_id; // Usar currentUser como fallback
  
  console.log('AgendamentosManager - adminData:', adminData);
  console.log('AgendamentosManager - currentUser:', currentUser);
  console.log('AgendamentosManager - unidadeId:', unidadeId);
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('');
  
  // Estados para modal de pagamento
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const [tipoPagamento, setTipoPagamento] = useState('');
  
  // Estados para modal de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState({});

  useEffect(() => {
    loadAgendamentos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAgendamentos = async () => {
    setLoading(true);
    try {
      console.log('🔍 DEBUG - loadAgendamentos iniciando');
      console.log('🔍 DEBUG - adminData:', adminData);
      console.log('🔍 DEBUG - currentUser:', currentUser);
      console.log('🔍 DEBUG - unidadeId:', unidadeId);
      
      // PRIMEIRO: Testar consulta simples SEM FILTRO para ver se há dados
      console.log('🔍 DEBUG - Testando consulta simples SEM filtro...');
      const { data: allData, error: allError } = await supabase
        .from('agendamentos')
        .select('*')
        .limit(5);
      
      console.log('🔍 DEBUG - Consulta sem filtro:', { 
        count: allData?.length || 0, 
        error: allError,
        primeiros5: allData 
      });

      // SEGUNDO: Consulta básica SEM joins primeiro
      console.log('🔍 DEBUG - Testando consulta básica sem joins...');
      const { data: dataBasic, error: errorBasic } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data_agendamento', { ascending: true })
        .order('horario_inicio', { ascending: true });
      
      console.log('🔍 DEBUG - Consulta básica (sem joins):', { 
        count: dataBasic?.length || 0, 
        error: errorBasic,
        dados: dataBasic?.slice(0, 2) // Mostrar só os 2 primeiros
      });

      // TERCEIRO: Tentar consulta com joins individuais para identificar o problema
      let dataWithJoins = null;
      
      try {
        console.log('🔍 DEBUG - Testando joins individuais...');
        
        const { data, error } = await supabase
          .from('agendamentos')
          .select(`
            *,
            users!inner (email, raw_user_meta_data),
            profissionais!inner (nome, telefone),
            unidades!inner (nome, endereco)
          `)
          .limit(10)
          .order('data_agendamento', { ascending: true });
        
        console.log('🔍 DEBUG - Joins com users, profissionais, unidades:', { 
          count: data?.length || 0, 
          error,
          dados: data?.slice(0, 1) 
        });
        
        if (!error && data && data.length > 0) {
          dataWithJoins = data;
        } else {
          // Fallback para consulta básica
          dataWithJoins = dataBasic;
        }
      } catch (joinError) {
        console.log('🔍 DEBUG - Erro nos joins, usando dados básicos:', joinError);
        dataWithJoins = dataBasic;
      }

      // TERCEIRO: Se unidadeId existe, testar filtro
      let finalData = dataWithJoins;
      if (unidadeId && dataWithJoins && dataWithJoins.length > 0) {
        console.log('🔍 DEBUG - Aplicando filtro manual por unidade:', unidadeId);
        const filteredData = dataWithJoins.filter(item => item.unidade_id === unidadeId);
        console.log('🔍 DEBUG - Dados após filtro manual:', {
          original: dataWithJoins.length,
          filtrado: filteredData.length,
          filteredData
        });
        
        // Testar também consulta direta com filtro (SEM joins problemáticos)
        const { data: directFiltered, error: directError } = await supabase
          .from('agendamentos')
          .select('*')
          .eq('unidade_id', unidadeId)
          .order('data_agendamento', { ascending: true });
          
        console.log('🔍 DEBUG - Consulta direta com filtro unidade:', {
          count: directFiltered?.length || 0,
          error: directError,
          dados: directFiltered
        });
        
        finalData = directFiltered || [];
      } else {
        console.log('🔍 DEBUG - Sem filtro de unidade ou sem dados');
      }

      console.log('🔍 DEBUG - Definindo agendamentos finais:', finalData?.length || 0);
      
      // Se temos dados básicos, tentar enriquecer com dados relacionados separadamente
      if (finalData && finalData.length > 0) {
        try {
          console.log('🔍 DEBUG - Enriquecendo dados com informações relacionadas...');
          const enrichedData = await Promise.all(finalData.map(async (agendamento) => {
            const enriched = { ...agendamento };
            
            // Tentar buscar dados do usuário
            try {
              console.log('🔍 DEBUG - Buscando usuário:', agendamento.usuario_id);
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, email, nome, telefone, foto_url')
                .eq('id', agendamento.usuario_id)
                .single();
              
              console.log('🔍 DEBUG - Dados do usuário:', { userData, userError });
              if (userData) enriched.users = userData;
            } catch (err) {
              console.log('🔍 DEBUG - Erro ao buscar usuário:', err);
            }
            
            // Tentar buscar dados do profissional
            try {
              console.log('🔍 DEBUG - Buscando profissional:', agendamento.profissional_id);
              const { data: profData, error: profError } = await supabase
                .from('profissionais')
                .select('*')
                .eq('id', agendamento.profissional_id)
                .single();
              
              console.log('🔍 DEBUG - Dados do profissional:', { profData, profError });
              if (profData) enriched.profissionais = profData;
            } catch (err) {
              console.log('🔍 DEBUG - Erro ao buscar profissional:', err);
            }
            
            // Tentar buscar dados da unidade
            try {
              const { data: unidadeData } = await supabase
                .from('unidades')
                .select('nome, endereco')
                .eq('id', agendamento.unidade_id)
                .single();
              if (unidadeData) enriched.unidades = unidadeData;
            } catch (err) {
              console.log('Erro ao buscar unidade:', err);
            }
            
            // Tentar buscar dados do serviço se existir
            if (agendamento.servico_id) {
              try {
                const { data: servicoData } = await supabase
                  .from('servicos')
                  .select('nome, preco, duracao_minutos')
                  .eq('id', agendamento.servico_id)
                  .single();
                if (servicoData) enriched.servicos = servicoData;
              } catch (err) {
                console.log('Erro ao buscar serviço:', err);
              }
            }
            
            return enriched;
          }));
          
          console.log('🔍 DEBUG - Dados enriquecidos:', enrichedData.length);
          console.log('🔍 DEBUG - Primeiro agendamento enriquecido:', enrichedData[0]);
          setAgendamentos(enrichedData);
        } catch (enrichError) {
          console.log('🔍 DEBUG - Erro ao enriquecer dados, usando dados básicos:', enrichError);
          setAgendamentos(finalData);
        }
      } else {
        setAgendamentos([]);
      }
      
    } catch (error) {
      console.error('🔍 DEBUG - Erro geral:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalPagamento = (agendamento) => {
    setSelectedAgendamento(agendamento);
    setTipoPagamento('');
    setShowPaymentModal(true);
  };

  const confirmarPagamento = async () => {
    if (!tipoPagamento) {
      alert('Por favor, selecione o tipo de pagamento');
      return;
    }

    try {
      console.log('🔍 CONFIRMANDO PAGAMENTO - Iniciando...');
      console.log('🔍 Agendamento selecionado:', selectedAgendamento);
      console.log('🔍 Tipo de pagamento:', tipoPagamento);

      // Buscar o agendamento completo
      const { data: agendamento, error: fetchError } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('id', selectedAgendamento.id)
        .single();

      console.log('🔍 Agendamento buscado:', { agendamento, fetchError });

      if (fetchError) {
        console.error('❌ Erro ao buscar agendamento:', fetchError);
        throw fetchError;
      }

      // Preparar data de conclusão com fuso horário do Brasil (GMT-3)
      const agora = new Date();
      const horarioBrasil = new Date(agora.getTime() - (3 * 60 * 60 * 1000)); // GMT-3

      // Preparar dados para histórico
      const dadosHistorico = {
        agendamento_id: agendamento.id,
        usuario_id: agendamento.usuario_id,
        profissional_id: agendamento.profissional_id,
        unidade_id: agendamento.unidade_id,
        servico_id: agendamento.servico_id,
        data_agendamento: agendamento.data_agendamento,
        horario_inicio: agendamento.horario_inicio,
        horario_fim: agendamento.horario_fim,
        status: 'concluido',
        valor_total: agendamento.preco_total,
        tipo_pagamento: tipoPagamento,
        forma_pagamento: tipoPagamento,
        data_conclusao: horarioBrasil.toISOString()
      };

      console.log('🔍 Dados para inserir no histórico:', dadosHistorico);

      // Inserir diretamente no histórico com tipo de pagamento
      const { data: historicoData, error: insertError } = await supabase
        .from('historico')
        .insert(dadosHistorico)
        .select();

      console.log('🔍 Resultado inserção histórico:', { historicoData, insertError });

      if (insertError) {
        console.error('❌ Erro ao inserir no histórico:', insertError);
        throw insertError;
      }

      console.log('✅ Agendamento inserido no histórico com sucesso!');

      // Deletar da tabela agendamentos
      const { error: deleteError } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', selectedAgendamento.id);

      console.log('🔍 Resultado deletar agendamento:', { deleteError });

      if (deleteError) {
        console.error('❌ Erro ao deletar agendamento:', deleteError);
        throw deleteError;
      }

      console.log('✅ Agendamento deletado da tabela agendamentos!');

      setShowPaymentModal(false);
      setSelectedAgendamento(null);
      setTipoPagamento('');
      await loadAgendamentos();

      alert('Pagamento confirmado e movido para histórico com sucesso!');
    } catch (error) {
      console.error('❌ ERRO GERAL ao confirmar pagamento:', error);
      alert('Erro ao confirmar pagamento: ' + error.message);
    }
  };

  const handleCancelAgendamento = (agendamento) => {
    setConfirmAction('cancel');
    setConfirmData({
      id: agendamento.id,
      clienteNome: agendamento.users?.nome || agendamento.users?.email?.split('@')[0] || 'Cliente',
      dataAgendamento: formatDate(agendamento.data_agendamento),
      horario: `${formatTime(agendamento.horario_inicio)} - ${formatTime(agendamento.horario_fim)}`
    });
    setShowConfirmModal(true);
  };

  // Função handleDeleteAgendamento removida - botão excluir foi removido

  const executeConfirmAction = async () => {
    try {
      if (confirmAction === 'cancel') {
        await moverParaHistorico(confirmData.id, 'cancelado');
        await loadAgendamentos();
        alert('Agendamento cancelado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      alert(`Erro ao cancelar agendamento: ${error.message}`);
    }
  };

  const updateAgendamentoStatus = async (id, novoStatus) => {
    try {
      // Se o status for "completed", mover para histórico como concluído
      if (novoStatus === 'completed') {
        await moverParaHistorico(id, 'concluido');
      } 
      // Se o status for "cancelled", será tratado pelo handleCancelAgendamento
      else {
        const { error } = await supabase
          .from('agendamentos')
          .update({ status: novoStatus })
          .eq('id', id);

        if (error) throw error;
      }

      await loadAgendamentos();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const moverParaHistorico = async (agendamentoId, status) => {
    try {
      // Primeiro, buscar o agendamento completo
      const { data: agendamento, error: fetchError } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('id', agendamentoId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar agendamento:', fetchError);
        return;
      }

      // Preparar data de conclusão com fuso horário do Brasil (GMT-3)
      const agora = new Date();
      const horarioBrasil = new Date(agora.getTime() - (3 * 60 * 60 * 1000)); // GMT-3

      // Inserir no histórico
      const { error: insertError } = await supabase
        .from('historico')
        .insert({
          agendamento_id: agendamento.id,
          usuario_id: agendamento.usuario_id,
          profissional_id: agendamento.profissional_id,
          unidade_id: agendamento.unidade_id,
          servico_id: agendamento.servico_id,
          data_agendamento: agendamento.data_agendamento,
          horario_inicio: agendamento.horario_inicio,
          horario_fim: agendamento.horario_fim,
          status: status,
          valor_total: agendamento.preco_total,
          tipo_pagamento: agendamento.tipo_pagamento,
          forma_pagamento: agendamento.tipo_pagamento, // Manter compatibilidade
          data_conclusao: horarioBrasil.toISOString()
        });

      if (insertError) {
        console.error('Erro ao inserir no histórico:', insertError);
        return;
      }

      // Deletar da tabela agendamentos
      const { error: deleteError } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', agendamentoId);

      if (deleteError) {
        console.error('Erro ao deletar agendamento:', deleteError);
        return;
      }

      console.log('Agendamento movido para histórico com sucesso');
    } catch (error) {
      console.error('Erro ao mover agendamento para histórico:', error);
    }
  };

  // Função deleteAgendamento removida - agora usa handleDeleteAgendamento

  const filteredAgendamentos = agendamentos.filter(agendamento => {
    const matchesSearch = 
      agendamento.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agendamento.profissionais?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agendamento.unidades?.nome?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || agendamento.status === statusFilter;

    const matchesDate = !dateFilter || agendamento.data_agendamento === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };

    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString) => {
    return timeString?.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Agendamentos</h2>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center">
          <Plus size={20} className="mr-2" />
          Novo Agendamento
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, profissional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="todos">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="confirmed">Confirmado</option>
            <option value="completed">Concluído</option>
            <option value="cancelled">Cancelado</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('todos');
              setDateFilter('');
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Agendamentos List */}
      <div className="space-y-4">
        {filteredAgendamentos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhum agendamento encontrado</p>
          </div>
        ) : (
          filteredAgendamentos.map((agendamento) => (
            <div key={agendamento.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              {/* Header com Status - Data/Horário em Destaque */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-5 border-b border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                      <Calendar size={24} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-2xl font-bold text-orange-900">{formatDate(agendamento.data_agendamento)}</h3>
                        <span className="text-xl text-orange-700">•</span>
                        <h4 className="text-xl font-bold text-orange-800">{formatTime(agendamento.horario_inicio)} - {formatTime(agendamento.horario_fim)}</h4>
                      </div>
                      <p className="text-sm text-orange-700 font-medium">Agendamento</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(agendamento.status)}
                  </div>
                </div>
              </div>

              {/* Conteúdo Principal */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Informações do Cliente */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-800">Cliente</h4>
                    </div>
                    <div className="ml-10 space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Nome:</p>
                        <p className="font-medium text-gray-900">{agendamento.users?.nome || agendamento.users?.email?.split('@')[0] || 'Cliente'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Telefone:</p>
                        <p className="font-medium text-gray-900">{agendamento.users?.telefone || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Profissional e Local */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-800">Profissional</h4>
                    </div>
                    <div className="ml-10 space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Nome:</p>
                        <p className="font-medium text-gray-900">{agendamento.profissionais?.nome || 'Profissional'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Local:</p>
                        <div className="flex items-center space-x-1">
                          <MapPin size={14} className="text-gray-400" />
                          <p className="font-medium text-gray-900">{agendamento.unidades?.nome || 'Unidade'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Serviço */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 bg-green-600 rounded"></div>
                      </div>
                      <h4 className="font-semibold text-gray-800">Serviço</h4>
                    </div>
                    <div className="ml-10 space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Serviço:</p>
                        <p className="font-medium text-gray-900">{agendamento.servicos?.nome || 'Corte de Cabelo'}</p>
                      </div>
                      <div className="flex space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">Valor:</p>
                          <p className="font-bold text-green-600">R$ {(agendamento.servicos?.preco || agendamento.preco_total || 30.00).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Duração:</p>
                          <div className="flex items-center space-x-1">
                            <Clock size={14} className="text-gray-400" />
                            <p className="font-medium text-gray-900">{agendamento.servicos?.duracao_minutos || 20} min</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                  {agendamento.status === 'pending' && (
                    <>
                      <button
                        onClick={() => abrirModalPagamento(agendamento)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                      >
                        <CheckCircle size={16} />
                        <span>Confirmar Pagamento</span>
                      </button>
                      <button
                        onClick={() => handleCancelAgendamento(agendamento)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                      >
                        <XCircle size={16} />
                        <span>Cancelar</span>
                      </button>
                    </>
                  )}
                  
                  {agendamento.status === 'confirmed' && (
                    <button
                      onClick={() => updateAgendamentoStatus(agendamento.id, 'completed')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                    >
                      <CheckCircle size={16} />
                      <span>Concluir</span>
                    </button>
                  )}
                  
                  <button
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                  >
                    <Edit size={16} />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Seleção de Tipo de Pagamento */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white flex items-center">
                <CheckCircle size={24} className="mr-3" />
                Confirmar Pagamento
              </h3>
              <p className="text-green-100 text-sm mt-1">
                Selecione como o cliente realizou o pagamento
              </p>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6">
              {/* Informações do Agendamento */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium text-gray-900">
                    {selectedAgendamento?.users?.nome || 'Cliente'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-bold text-green-600">
                    R$ {(selectedAgendamento?.servicos?.preco || selectedAgendamento?.preco_total || 30.00).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Opções de Pagamento */}
              <div className="space-y-3 mb-6">
                <p className="font-semibold text-gray-800 mb-4">Tipo de Pagamento:</p>
                
                {[
                  { id: 'pix', label: 'PIX', emoji: '📱', color: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50' },
                  { id: 'debito', label: 'Cartão de Débito', emoji: '💳', color: 'border-green-200 hover:border-green-400 hover:bg-green-50' },
                  { id: 'credito', label: 'Cartão de Crédito', emoji: '💎', color: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50' },
                  { id: 'dinheiro', label: 'Dinheiro', emoji: '💵', color: 'border-yellow-200 hover:border-yellow-400 hover:bg-yellow-50' }
                ].map((opcao) => (
                  <label key={opcao.id} className="block">
                    <input
                      type="radio"
                      name="tipoPagamento"
                      value={opcao.id}
                      checked={tipoPagamento === opcao.id}
                      onChange={(e) => setTipoPagamento(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`
                      border-2 rounded-lg p-4 cursor-pointer transition-all
                      ${tipoPagamento === opcao.id 
                        ? 'border-green-500 bg-green-50 shadow-md' 
                        : `border-gray-200 ${opcao.color}`
                      }
                    `}>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{opcao.emoji}</span>
                        <span className={`font-medium ${
                          tipoPagamento === opcao.id ? 'text-green-700' : 'text-gray-700'
                        }`}>
                          {opcao.label}
                        </span>
                        {tipoPagamento === opcao.id && (
                          <CheckCircle size={20} className="text-green-500 ml-auto" />
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Botões de Ação */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedAgendamento(null);
                    setTipoPagamento('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarPagamento}
                  disabled={!tipoPagamento}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle size={20} />
                  <span>Confirmar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
          setConfirmData({});
        }}
        onConfirm={executeConfirmAction}
        type="warning"
        title="Cancelar Agendamento"
        message={`Você tem certeza que deseja cancelar o agendamento de ${confirmData.clienteNome} para o dia ${confirmData.dataAgendamento} às ${confirmData.horario}?\n\nO agendamento será movido para o histórico como cancelado.`}
        confirmText="Sim, Cancelar"
        cancelText="Não, Manter"
        confirmButtonColor="bg-yellow-600 hover:bg-yellow-700"
      />
    </div>
  );
};

export default AgendamentosManager;

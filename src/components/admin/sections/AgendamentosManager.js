import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  User,
  MapPin,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

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
                .select('*')
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

  const updateAgendamentoStatus = async (id, novoStatus) => {
    try {
      // Se o status for "completed", mover para histórico
      if (novoStatus === 'completed') {
        await moverParaHistorico(id, 'concluido');
      } else {
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
          data_conclusao: new Date().toISOString()
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

  const deleteAgendamento = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      try {
        const { error } = await supabase
          .from('agendamentos')
          .delete()
          .eq('id', id);

        if (!error) {
          await loadAgendamentos();
        }
      } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
      }
    }
  };

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
            <div key={agendamento.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Cliente Info */}
                  <div>
                    <p className="font-medium text-gray-900 flex items-center">
                      <User size={16} className="mr-2 text-gray-400" />
                      {agendamento.users?.raw_user_meta_data?.nome || 
                       agendamento.users?.raw_user_meta_data?.name ||
                       agendamento.users?.user_metadata?.nome ||
                       agendamento.users?.user_metadata?.name ||
                       agendamento.users?.email?.split('@')[0] ||
                       'Cliente'}
                    </p>
                    <p className="text-sm text-gray-600">{agendamento.users?.email}</p>
                    {(agendamento.users?.raw_user_meta_data?.telefone || 
                      agendamento.users?.user_metadata?.telefone ||
                      agendamento.users?.raw_user_meta_data?.phone ||
                      agendamento.users?.user_metadata?.phone) && (
                      <p className="text-sm text-gray-500">
                        📞 {agendamento.users?.raw_user_meta_data?.telefone || 
                             agendamento.users?.user_metadata?.telefone ||
                             agendamento.users?.raw_user_meta_data?.phone ||
                             agendamento.users?.user_metadata?.phone}
                      </p>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div>
                    <p className="font-medium text-gray-900 flex items-center">
                      <Calendar size={16} className="mr-2 text-gray-400" />
                      {formatDate(agendamento.data_agendamento)}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Clock size={14} className="mr-1" />
                      {formatTime(agendamento.horario_inicio)} - {formatTime(agendamento.horario_fim)}
                    </p>
                  </div>

                  {/* Profissional & Unidade */}
                  <div>
                    <p className="font-medium text-gray-900">
                      👨‍💼 {agendamento.profissionais?.nome || 'Profissional'}
                    </p>
                    {agendamento.profissionais?.telefone && (
                      <p className="text-xs text-gray-500">
                        📞 {agendamento.profissionais.telefone}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin size={14} className="mr-1" />
                      {agendamento.unidades?.nome || 'Unidade'}
                    </p>
                  </div>

                  {/* Serviço & Preço */}
                  <div>
                    <p className="font-medium text-gray-900">
                      {agendamento.servicos?.nome || 'Corte de Cabelo'}
                    </p>
                    <p className="text-sm text-gray-600">
                      R$ {(agendamento.servicos?.preco || agendamento.preco_total || 30.00).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {agendamento.servicos?.duracao_minutos && (
                      <p className="text-xs text-gray-400">
                        ⏱️ {agendamento.servicos.duracao_minutos} min
                      </p>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex flex-col items-end space-y-2">
                  {getStatusBadge(agendamento.status)}
                  
                  <div className="flex space-x-2">
                    {agendamento.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateAgendamentoStatus(agendamento.id, 'confirmed')}
                          className="text-green-600 hover:bg-green-50 p-2 rounded"
                          title="Confirmar"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => updateAgendamentoStatus(agendamento.id, 'cancelled')}
                          className="text-red-600 hover:bg-red-50 p-2 rounded"
                          title="Cancelar"
                        >
                          <XCircle size={18} />
                        </button>
                      </>
                    )}
                    
                    <button
                      className="text-gray-600 hover:bg-gray-50 p-2 rounded"
                      title="Visualizar"
                    >
                      <Eye size={18} />
                    </button>
                    
                    <button
                      className="text-gray-600 hover:bg-gray-50 p-2 rounded"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    
                    <button
                      onClick={() => deleteAgendamento(agendamento.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgendamentosManager;

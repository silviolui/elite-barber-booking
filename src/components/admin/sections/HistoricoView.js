import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import CustomCalendar from '../../CustomCalendar';
import { formatDateBR, formatTimeBR, formatDateTimeBR } from '../../../utils/timezone';

const HistoricoView = ({ currentUser }) => {
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const unidadeId = adminData.unidade_id; // NULL se for super admin
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    loadHistorico();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadHistorico = async () => {
    setLoading(true);
    try {
      console.log('🔍 CARREGANDO HISTÓRICO...');
      console.log('🔍 unidadeId:', unidadeId);
      
      // PRIMEIRA tentativa: buscar histórico SEM joins
      let query = supabase
        .from('historico')
        .select('*')
        .order('data_conclusao', { ascending: false });

      // Se não for super admin, filtrar por unidade
      if (unidadeId) {
        query = query.eq('unidade_id', unidadeId);
      }

      const { data: historicoBasico, error: erroBasico } = await query;

      console.log('🔍 Histórico básico:', { historicoBasico, erroBasico });

      if (erroBasico) {
        console.error('❌ Erro ao carregar histórico básico:', erroBasico);
        setHistorico([]);
        return;
      }

      if (!historicoBasico || historicoBasico.length === 0) {
        console.log('📊 Nenhum registro encontrado no histórico');
        setHistorico([]);
        return;
      }

      // SEGUNDA tentativa: enriquecer com dados relacionados
      try {
        console.log('🔍 Enriquecendo histórico com dados relacionados...');
        
        const historicoEnriquecido = await Promise.all(
          historicoBasico.map(async (item) => {
            const enriched = { ...item };
            
            // Buscar dados do usuário
            try {
              const { data: userData } = await supabase
                .from('users')
                .select('email, nome, telefone')
                .eq('id', item.usuario_id)
                .single();
              if (userData) {
                enriched.users = userData;
                console.log('👤 Dados do usuário carregados:', userData);
              }
            } catch (err) {
              console.log('⚠️ Erro ao buscar usuário:', item.usuario_id, err);
              enriched.users = { email: 'Usuario', nome: 'Cliente', telefone: '' };
            }
            
            // Buscar dados do profissional
            try {
              const { data: profData } = await supabase
                .from('profissionais')
                .select('nome')
                .eq('id', item.profissional_id)
                .single();
              if (profData) enriched.profissionais = profData;
            } catch (err) {
              console.log('⚠️ Erro ao buscar profissional:', item.profissional_id);
              enriched.profissionais = { nome: 'Profissional' };
            }
            
            // Buscar dados da unidade
            try {
              const { data: unidadeData } = await supabase
                .from('unidades')
                .select('nome')
                .eq('id', item.unidade_id)
                .single();
              if (unidadeData) enriched.unidades = unidadeData;
            } catch (err) {
              console.log('⚠️ Erro ao buscar unidade:', item.unidade_id);
              enriched.unidades = { nome: 'Unidade' };
            }
            
            // Buscar dados do serviço
            try {
              const { data: servicoData } = await supabase
                .from('servicos')
                .select('nome')
                .eq('id', item.servico_id)
                .single();
              if (servicoData) enriched.servicos = servicoData;
            } catch (err) {
              console.log('⚠️ Erro ao buscar serviço:', item.servico_id);
              enriched.servicos = { nome: 'Serviço' };
            }
            
            return enriched;
          })
        );
        
        console.log('✅ Histórico enriquecido:', historicoEnriquecido);
        setHistorico(historicoEnriquecido);
        
      } catch (enrichError) {
        console.log('⚠️ Erro ao enriquecer dados, usando histórico básico:', enrichError);
        setHistorico(historicoBasico);
      }

    } catch (error) {
      console.error('❌ ERRO GERAL ao carregar histórico:', error);
      setHistorico([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistorico = historico.filter(item => {
    // Filtrar por status
    const statusMatch = statusFilter === 'todos' || item.status === statusFilter;
    
    // Filtrar por data
    let dateMatch = true;
    if (dateFilter) {
      const itemDate = new Date(item.data_agendamento);
      const filterDate = new Date(dateFilter);
      dateMatch = itemDate.toDateString() === filterDate.toDateString();
    }
    
    return statusMatch && dateMatch;
  });

  const getStatusBadge = (status) => {
    const styles = {
      concluido: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      cancelado: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      excluido: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle }
    };

    const labels = {
      concluido: 'Concluído',
      cancelado: 'Cancelado',
      excluido: 'Excluído'
    };

    const config = styles[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock };
    const Icon = config.icon;

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.text} flex items-center`}>
        <Icon size={14} className="mr-1" />
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Calcular contadores por status
  const getStatusCounts = () => {
    const counts = {
      todos: historico.length,
      concluido: historico.filter(item => item.status === 'concluido').length,
      cancelado: historico.filter(item => item.status === 'cancelado').length,
      excluido: historico.filter(item => item.status === 'excluido').length
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Histórico de Agendamentos</h2>
        <div className="flex items-center space-x-4">
          {/* Filtro por Data */}
          <button
            onClick={() => setShowCalendar(true)}
            className={`
              px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent
              flex items-center space-x-2 transition-colors duration-200
              ${dateFilter 
                ? 'border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <Calendar size={16} />
            <span className="text-sm font-medium">
              {dateFilter 
                ? formatDateBR(dateFilter)
                : 'Filtrar por Data'
              }
            </span>
            {dateFilter && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDateFilter(null);
                }}
                className="ml-1 hover:bg-orange-200 rounded-full p-1"
              >
                <XCircle size={14} />
              </button>
            )}
          </button>

          {/* Filtro por Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="todos">Todos os status ({statusCounts.todos})</option>
            <option value="concluido">Concluídos ({statusCounts.concluido})</option>
            <option value="cancelado">Cancelados ({statusCounts.cancelado})</option>
            <option value="excluido">Excluídos ({statusCounts.excluido})</option>
          </select>
          
          <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
            Mostrando: {filteredHistorico.length} registro{filteredHistorico.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Histórico List - Formato Lista Compacta */}
      <div className="space-y-2">
        {filteredHistorico.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhum registro encontrado no histórico</p>
          </div>
        ) : (
          filteredHistorico.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  {/* Data e Horário */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          {formatDateBR(item.data_agendamento)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-lg font-semibold text-gray-700">
                          {item.horario_inicio?.substring(0, 5)} - {item.horario_fim?.substring(0, 5)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Finalizado: {formatDateTimeBR(item.data_conclusao)}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {/* Informações Detalhadas em uma linha */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  {/* Cliente */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <User size={12} className="text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Cliente</p>
                      <p className="font-medium text-gray-900 truncate">
                        {item.users?.nome || item.users?.email?.split('@')[0] || 'Cliente'}
                      </p>
                      {item.users?.telefone && (
                        <p className="text-xs text-gray-500">{item.users.telefone}</p>
                      )}
                    </div>
                  </div>

                  {/* Profissional */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <User size={12} className="text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Profissional</p>
                      <p className="font-medium text-gray-900 truncate">
                        {item.profissionais?.nome || 'Profissional'}
                      </p>
                      <div className="flex items-center space-x-1">
                        <MapPin size={10} className="text-gray-400" />
                        <p className="text-xs text-gray-500 truncate">{item.unidades?.nome || 'Unidade'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Serviço */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clock size={12} className="text-orange-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Serviço</p>
                      <p className="font-medium text-gray-900 truncate">
                        {item.servicos?.nome || 'Serviço'}
                      </p>
                    </div>
                  </div>

                  {/* Valor e Pagamento */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign size={12} className="text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Valor</p>
                      <p className="font-bold text-green-600">
                        R$ {(item.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {item.tipo_pagamento && (
                        <p className="text-xs text-gray-500">
                          {item.tipo_pagamento === 'pix' ? 'PIX' :
                           item.tipo_pagamento === 'debito' ? 'Débito' :
                           item.tipo_pagamento === 'credito' ? 'Crédito' :
                           item.tipo_pagamento === 'dinheiro' ? 'Dinheiro' :
                           item.tipo_pagamento}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Calendário Personalizado */}
      {showCalendar && (
        <CustomCalendar
          selectedDate={dateFilter}
          onDateSelect={setDateFilter}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
};

export default HistoricoView;

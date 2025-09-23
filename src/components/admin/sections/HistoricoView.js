import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const HistoricoView = ({ currentUser }) => {
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const unidadeId = adminData.unidade_id; // NULL se for super admin
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('todos');

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
                .select('email, raw_user_meta_data, nome, telefone')
                .eq('id', item.usuario_id)
                .single();
              if (userData) {
                enriched.users = userData;
                console.log('👤 Dados do usuário carregados:', userData);
              }
            } catch (err) {
              console.log('⚠️ Erro ao buscar usuário:', item.usuario_id);
              enriched.users = { email: 'Usuario', raw_user_meta_data: { nome: 'Cliente' }, nome: 'Cliente', telefone: '' };
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

  const filteredHistorico = historico.filter(item => 
    statusFilter === 'todos' || item.status === statusFilter
  );

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

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Histórico de Agendamentos</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="todos">Todos os status</option>
          <option value="concluido">Concluídos</option>
          <option value="cancelado">Cancelados</option>
          <option value="excluido">Excluídos</option>
        </select>
      </div>

      {/* Histórico List */}
      <div className="space-y-4">
        {filteredHistorico.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhum registro encontrado no histórico</p>
          </div>
        ) : (
          filteredHistorico.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              {/* Header com Status - Data/Horário em Destaque */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-5 border-b border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                      <Calendar size={24} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-2xl font-bold text-blue-900">
                          {new Date(item.data_agendamento).toLocaleDateString('pt-BR')}
                        </h3>
                        <span className="text-xl text-blue-700">•</span>
                        <h4 className="text-xl font-bold text-blue-800">
                          {item.horario_inicio?.substring(0, 5)} - {item.horario_fim?.substring(0, 5)}
                        </h4>
                      </div>
                      <p className="text-sm text-blue-700 font-medium">Histórico de Agendamento</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              </div>

              {/* Conteúdo Principal */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Informações do Cliente */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-800">Cliente</h4>
                    </div>
                    <div className="ml-10 space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Nome:</p>
                        <p className="font-medium text-gray-900">
                          {item.users?.nome || item.users?.raw_user_meta_data?.nome || item.users?.email?.split('@')[0] || 'Cliente não identificado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email:</p>
                        <p className="font-medium text-gray-900">{item.users?.email || 'Não informado'}</p>
                      </div>
                      {item.users?.telefone && (
                        <div>
                          <p className="text-sm text-gray-500">Telefone:</p>
                          <p className="font-medium text-gray-900">{item.users.telefone}</p>
                        </div>
                      )}
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
                        <p className="font-medium text-gray-900">{item.profissionais?.nome || 'Profissional'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Local:</p>
                        <div className="flex items-center space-x-1">
                          <MapPin size={14} className="text-gray-400" />
                          <p className="font-medium text-gray-900">{item.unidades?.nome || 'Unidade'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Serviço e Pagamento */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <DollarSign size={16} className="text-orange-600" />
                      </div>
                      <h4 className="font-semibold text-gray-800">Serviço & Pagamento</h4>
                    </div>
                    <div className="ml-10 space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Serviço:</p>
                        <p className="font-medium text-gray-900">{item.servicos?.nome || 'Serviço'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Valor:</p>
                        <p className="font-bold text-green-600">
                          R$ {(item.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      {item.tipo_pagamento && (
                        <div>
                          <p className="text-sm text-gray-500">Tipo de Pagamento:</p>
                          <p className="font-medium text-gray-900">
                            {item.tipo_pagamento === 'pix' ? '📱 PIX' :
                             item.tipo_pagamento === 'debito' ? '💳 Cartão de Débito' :
                             item.tipo_pagamento === 'credito' ? '💎 Cartão de Crédito' :
                             item.tipo_pagamento === 'dinheiro' ? '💵 Dinheiro' :
                             item.tipo_pagamento}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Data de conclusão */}
                <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-500">
                    Finalizado em: <span className="font-medium text-gray-700">
                      {new Date(item.data_conclusao).toLocaleString('pt-BR', { 
                        timeZone: 'America/Sao_Paulo',
                        year: 'numeric',
                        month: '2-digit', 
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoricoView;

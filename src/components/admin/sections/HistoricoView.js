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
  }, []);

  const loadHistorico = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('historico')
        .select(`
          *,
          users (email, raw_user_meta_data),
          profissionais (nome),
          unidades (nome),
          servicos (nome)
        `)
        .order('data_conclusao', { ascending: false });

      // Se não for super admin, filtrar por unidade
      if (unidadeId) {
        query = query.eq('unidade_id', unidadeId);
      }

      const { data, error } = await query;

      if (!error) {
        setHistorico(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
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
      cancelado: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
    };

    const config = styles[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock };
    const Icon = config.icon;

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.text} flex items-center`}>
        <Icon size={14} className="mr-1" />
        {status === 'concluido' ? 'Concluído' : status === 'cancelado' ? 'Cancelado' : status}
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
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Cliente */}
                  <div>
                    <p className="font-medium text-gray-900 flex items-center">
                      <User size={16} className="mr-2 text-gray-400" />
                      {item.users?.raw_user_meta_data?.nome || item.users?.email || 'Cliente'}
                    </p>
                    <p className="text-sm text-gray-600">{item.users?.email}</p>
                  </div>

                  {/* Data & Horário */}
                  <div>
                    <p className="font-medium text-gray-900 flex items-center">
                      <Calendar size={16} className="mr-2 text-gray-400" />
                      {new Date(item.data_agendamento).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Clock size={14} className="mr-1" />
                      {item.horario_inicio?.substring(0, 5)} - {item.horario_fim?.substring(0, 5)}
                    </p>
                  </div>

                  {/* Profissional & Unidade */}
                  <div>
                    <p className="font-medium text-gray-900">{item.profissionais?.nome}</p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin size={14} className="mr-1" />
                      {item.unidades?.nome}
                    </p>
                  </div>

                  {/* Serviço & Valor */}
                  <div>
                    <p className="font-medium text-gray-900">{item.servicos?.nome || 'Serviço'}</p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <DollarSign size={14} className="mr-1" />
                      R$ {(item.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="ml-4">
                  {getStatusBadge(item.status)}
                </div>
              </div>

              {/* Data de conclusão */}
              <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                Finalizado em: {new Date(item.data_conclusao).toLocaleString('pt-BR')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoricoView;

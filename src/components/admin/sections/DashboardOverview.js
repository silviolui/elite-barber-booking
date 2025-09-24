import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { getBrazilDate, dateToStringBrazil } from '../../../utils/timezone';

const DashboardOverview = ({ currentUser }) => {
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const unidadeId = adminData.unidade_id || currentUser?.unidade_id; // Usar currentUser como fallback
  
  console.log('DashboardOverview - adminData:', adminData);
  console.log('DashboardOverview - currentUser:', currentUser);
  console.log('DashboardOverview - unidadeId:', unidadeId);
  const [stats, setStats] = useState({
    totalAgendamentos: 0,
    agendamentosHoje: 0,
    totalProfissionais: 0,
    totalUnidades: 0,
    receitaMes: 0,
    agendamentosConfirmados: 0,
    agendamentosCancelados: 0,
    loading: true
  });

  useEffect(() => {
    loadStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStats = async () => {
    try {
      const hoje = dateToStringBrazil(getBrazilDate());
      const brazilDate = getBrazilDate();
      const inicioMes = dateToStringBrazil(new Date(brazilDate.getFullYear(), brazilDate.getMonth(), 1));

      // Construir queries baseadas na unidade do admin
      let agendamentosQuery = supabase.from('agendamentos').select('id', { count: 'exact' });
      let agendamentosHojeQuery = supabase.from('agendamentos').select('id', { count: 'exact' }).eq('data_agendamento', hoje);
      let profissionaisQuery = supabase.from('profissionais').select('id', { count: 'exact' }).eq('ativo', true);
      let unidadesQuery = supabase.from('unidades').select('id', { count: 'exact' }).eq('ativo', true);
      let historicoQuery = supabase.from('historico').select('status, valor_total').gte('data_agendamento', inicioMes);

      // Se não for super admin, filtrar por unidade
      if (unidadeId) {
        agendamentosQuery = agendamentosQuery.eq('unidade_id', unidadeId);
        agendamentosHojeQuery = agendamentosHojeQuery.eq('unidade_id', unidadeId);
        profissionaisQuery = profissionaisQuery.eq('unidade_id', unidadeId);
        unidadesQuery = unidadesQuery.eq('id', unidadeId);
        historicoQuery = historicoQuery.eq('unidade_id', unidadeId);
      }

      // Buscar estatísticas em paralelo
      const [
        agendamentosResult,
        agendamentosHojeResult,
        profissionaisResult,
        unidadesResult,
        historicoResult
      ] = await Promise.all([
        agendamentosQuery,
        agendamentosHojeQuery,
        profissionaisQuery,
        unidadesQuery,
        historicoQuery
      ]);

      // Calcular estatísticas
      const historicoData = historicoResult.data || [];
      const receitaMes = historicoData
        .filter(h => h.status === 'concluido')
        .reduce((total, h) => total + (parseFloat(h.valor_total) || 0), 0);

      const confirmados = historicoData.filter(h => h.status === 'concluido').length;
      const cancelados = historicoData.filter(h => h.status === 'cancelado').length;

      // Usar callback para evitar race conditions
      setStats(prev => ({
        ...prev,
        totalAgendamentos: agendamentosResult.count || 0,
        agendamentosHoje: agendamentosHojeResult.count || 0,
        totalProfissionais: profissionaisResult.count || 0,
        totalUnidades: unidadesResult.count || 0,
        receitaMes,
        agendamentosConfirmados: confirmados,
        agendamentosCancelados: cancelados,
        loading: false
      }));

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-xl md:text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 md:p-3 rounded-lg flex-shrink-0 ${color}`}>
          <Icon size={20} className="text-white md:w-6 md:h-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 md:mt-4 flex items-center text-xs md:text-sm text-green-600">
          <TrendingUp size={14} className="mr-1 md:w-4 md:h-4" />
          {trend}
        </div>
      )}
    </div>
  );

  if (stats.loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <div className="animate-pulse">
                <div className="h-3 md:h-4 bg-gray-200 rounded w-2/3 mb-3 md:mb-4"></div>
                <div className="h-6 md:h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-white p-4 md:p-6">
        <h2 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">
          {unidadeId ? `Gestão - ${adminData.nome}` : 'Gestão Multi-Unidades'}
        </h2>
        <p className="text-sm md:text-base text-orange-100">
          {unidadeId 
            ? 'Gerencie sua unidade de forma completa e eficiente'
            : 'Acesso total a todas as unidades da rede'
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard
          title="Agendamentos Hoje"
          value={stats.agendamentosHoje}
          icon={Calendar}
          color="bg-blue-500"
          subtitle="Hoje"
        />
        
        <StatCard
          title="Total Agendamentos"
          value={stats.totalAgendamentos}
          icon={Clock}
          color="bg-green-500"
          subtitle="Em aberto"
        />
        
        <StatCard
          title="Profissionais Ativos"
          value={stats.totalProfissionais}
          icon={Users}
          color="bg-purple-500"
          subtitle="Trabalhando"
        />
        
        <StatCard
          title="Unidades Ativas"
          value={stats.totalUnidades}
          icon={Building2}
          color="bg-indigo-500"
          subtitle="Em funcionamento"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        <StatCard
          title="Receita do Mês"
          value={`R$ ${stats.receitaMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="bg-green-600"
          subtitle="Serviços concluídos"
        />
        
        <StatCard
          title="Serviços Concluídos"
          value={stats.agendamentosConfirmados}
          icon={CheckCircle}
          color="bg-emerald-500"
          subtitle="Este mês"
        />
        
        <StatCard
          title="Cancelamentos"
          value={stats.agendamentosCancelados}
          icon={XCircle}
          color="bg-red-500"
          subtitle="Este mês"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <button className="flex items-center p-3 md:p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors active:scale-95">
            <Calendar className="mr-2 md:mr-3 text-orange-500 flex-shrink-0" size={18} />
            <span className="text-sm md:text-base text-gray-700 font-medium">Novo Agendamento</span>
          </button>
          
          <button className="flex items-center p-3 md:p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors active:scale-95">
            <Users className="mr-2 md:mr-3 text-orange-500 flex-shrink-0" size={18} />
            <span className="text-sm md:text-base text-gray-700 font-medium">Adicionar Profissional</span>
          </button>
          
          <button className="flex items-center p-3 md:p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors active:scale-95">
            <Building2 className="mr-2 md:mr-3 text-orange-500 flex-shrink-0" size={18} />
            <span className="text-sm md:text-base text-gray-700 font-medium">Nova Unidade</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;

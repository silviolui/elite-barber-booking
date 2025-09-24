import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    User,
    MapPin,
    Search,
    Plus,
    Edit,
    Scissors
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import ConfirmationModal from '../../ConfirmationModal';
import { useToast } from '../../../contexts/ToastContext';
import { getBrazilDate, dateToStringBrazil, getBrazilISOString } from '../../../utils/timezone';

const AgendamentosManagerMobile = ({ currentUser }) => {
    const { showSuccess, showError, showWarning } = useToast();
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const unidadeId = adminData.unidade_id || currentUser?.unidade_id;

    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [dateStartFilter, setDateStartFilter] = useState('');
    const [dateEndFilter, setDateEndFilter] = useState('');
    const [quickFilter, setQuickFilter] = useState('todos');

    // Estados para modal de pagamento
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedAgendamento, setSelectedAgendamento] = useState(null);
    const [tipoPagamento, setTipoPagamento] = useState('');

    // Estados para modal de confirmação
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmData, setConfirmData] = useState({});

    // Função para definir filtros rápidos
    const handleQuickFilter = (filter) => {
        setQuickFilter(filter);
        const today = getBrazilDate();

        switch (filter) {
            case 'amanha':
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                const tomorrowStr = dateToStringBrazil(tomorrow);
                setDateStartFilter(tomorrowStr);
                setDateEndFilter(tomorrowStr);
                break;

            case 'semana':
                const weekStart = new Date(today);
                const weekEnd = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay()); // Domingo
                weekEnd.setDate(weekStart.getDate() + 6); // Sábado
                setDateStartFilter(dateToStringBrazil(weekStart));
                setDateEndFilter(dateToStringBrazil(weekEnd));
                break;

            case 'mes':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                setDateStartFilter(dateToStringBrazil(monthStart));
                setDateEndFilter(dateToStringBrazil(monthEnd));
                break;

            case 'todos':
            default:
                setDateStartFilter('');
                setDateEndFilter('');
                break;
        }
    };

    // Carregar agendamentos com queries separadas (evita erro de relacionamento)
    const loadAgendamentos = async () => {
        try {
            setLoading(true);
            
            // 1. Buscar agendamentos básicos
            let agendamentosQuery = supabase
                .from('agendamentos')
                .select(`
                    id,
                    data_agendamento,
                    horario_inicio,
                    horario_fim,
                    preco_total,
                    observacoes,
                    status,
                    status_pagamento,
                    criado_em,
                    atualizado_em,
                    usuario_id,
                    profissional_id,
                    unidade_id,
                    servico_id,
                    cliente_nome,
                    cliente_telefone,
                    cliente_email
                `)
                .order('data_agendamento', { ascending: false })
                .order('horario_inicio', { ascending: false });

            if (unidadeId) {
                agendamentosQuery = agendamentosQuery.eq('unidade_id', unidadeId);
            }

            const { data: agendamentosData, error: agendamentosError } = await agendamentosQuery;

            if (agendamentosError) throw agendamentosError;

            // 2. Buscar dados relacionados separadamente
            const [usersData, profissionaisData, unidadesData, servicosData] = await Promise.all([
                supabase.from('users').select('id, nome, telefone, email'),
                supabase.from('profissionais').select('id, nome, especialidade'),
                supabase.from('unidades').select('id, nome, endereco'),
                supabase.from('servicos').select('id, nome, duracao_minutos, preco')
            ]);

            // 3. Combinar dados manualmente
            const agendamentosCompletos = agendamentosData.map(agendamento => ({
                ...agendamento,
                users: usersData.data?.find(user => user.id === agendamento.usuario_id) || null,
                profissionais: profissionaisData.data?.find(prof => prof.id === agendamento.profissional_id) || null,
                unidades: unidadesData.data?.find(unidade => unidade.id === agendamento.unidade_id) || null,
                servicos: servicosData.data?.find(servico => servico.id === agendamento.servico_id) || null
            }));

            console.log('Agendamentos carregados:', agendamentosCompletos);
            setAgendamentos(agendamentosCompletos);
            
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            showError('Erro ao carregar agendamentos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAgendamentos();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const formatTime = (timeString) => {
        return timeString.slice(0, 5);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
            confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
            completed: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
            cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    // Filtrar agendamentos
    const filteredAgendamentos = agendamentos.filter(agendamento => {
        // Filtro de busca
        const searchLower = searchTerm.toLowerCase();
        const matchSearch = !searchTerm || 
            (agendamento.users?.nome || agendamento.cliente_nome || '').toLowerCase().includes(searchLower) ||
            (agendamento.users?.telefone || agendamento.cliente_telefone || '').includes(searchTerm) ||
            (agendamento.profissionais?.nome || '').toLowerCase().includes(searchLower) ||
            (agendamento.servicos?.nome || '').toLowerCase().includes(searchLower);

        // Filtro de status
        const matchStatus = statusFilter === 'todos' || agendamento.status === statusFilter;

        // Filtro de data
        const matchDate = (!dateStartFilter || agendamento.data_agendamento >= dateStartFilter) &&
                          (!dateEndFilter || agendamento.data_agendamento <= dateEndFilter);

        return matchSearch && matchStatus && matchDate;
    });

    // Funções de ação - mesmas da versão desktop
    const abrirModalPagamento = (agendamento) => {
        setSelectedAgendamento(agendamento);
        setTipoPagamento('');
        setShowPaymentModal(true);
    };

    const confirmarPagamento = async () => {
        if (!tipoPagamento) {
            showWarning('Selecione o tipo de pagamento');
            return;
        }

        try {
            const { error } = await supabase
                .from('agendamentos')
                .update({ 
                    status_pagamento: 'paid',
                    status: 'completed'
                })
                .eq('id', selectedAgendamento.id);

            if (error) throw error;

            // Inserir no histórico
            const { error: historicoError } = await supabase
                .from('historico')
                .insert({
                    agendamento_id: selectedAgendamento.id,
                    usuario_id: selectedAgendamento.usuario_id,
                    profissional_id: selectedAgendamento.profissional_id,
                    unidade_id: selectedAgendamento.unidade_id,
                    servico_id: selectedAgendamento.servico_id,
                    data_agendamento: selectedAgendamento.data_agendamento,
                    horario_inicio: selectedAgendamento.horario_inicio,
                    horario_fim: selectedAgendamento.horario_fim,
                    valor_total: selectedAgendamento.preco_total,
                    status: 'concluido',
                    tipo_pagamento: tipoPagamento,
                    created_at: getBrazilISOString(getBrazilDate())
                });

            if (historicoError) {
                console.warn('Aviso: erro ao inserir histórico:', historicoError);
            }

            showSuccess('Pagamento confirmado com sucesso!');
            setShowPaymentModal(false);
            loadAgendamentos();
        } catch (error) {
            console.error('Erro ao confirmar pagamento:', error);
            showError('Erro ao confirmar pagamento: ' + error.message);
        }
    };

    const cancelarAgendamento = (agendamento) => {
        setConfirmAction('cancel');
        setConfirmData({ agendamento });
        setShowConfirmModal(true);
    };

    const executarCancelamento = async () => {
        try {
            const { error } = await supabase
                .from('agendamentos')
                .update({ status: 'cancelled' })
                .eq('id', confirmData.agendamento.id);

            if (error) throw error;

            // Inserir no histórico
            const { error: historicoError } = await supabase
                .from('historico')
                .insert({
                    agendamento_id: confirmData.agendamento.id,
                    usuario_id: confirmData.agendamento.usuario_id,
                    profissional_id: confirmData.agendamento.profissional_id,
                    unidade_id: confirmData.agendamento.unidade_id,
                    servico_id: confirmData.agendamento.servico_id,
                    data_agendamento: confirmData.agendamento.data_agendamento,
                    horario_inicio: confirmData.agendamento.horario_inicio,
                    horario_fim: confirmData.agendamento.horario_fim,
                    valor_total: confirmData.agendamento.preco_total,
                    status: 'cancelado',
                    created_at: getBrazilISOString(getBrazilDate())
                });

            if (historicoError) {
                console.warn('Aviso: erro ao inserir histórico:', historicoError);
            }

            showSuccess('Agendamento cancelado com sucesso!');
            setShowConfirmModal(false);
            loadAgendamentos();
        } catch (error) {
            console.error('Erro ao cancelar agendamento:', error);
            showError('Erro ao cancelar agendamento: ' + error.message);
        }
    };

    // Função para abrir modal de criação (placeholder para futuro)
    const abrirModalCriacao = () => {
        showWarning('Funcionalidade de criação será implementada em breve');
    };

    const MobileAppointmentCard = ({ agendamento }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
            {/* Header with Date/Time */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-3 border-b border-orange-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                            <Calendar size={20} className="text-white" />
                        </div>
                        <div>
                            <div className="flex items-center space-x-2 text-orange-900">
                                <span className="text-lg font-bold">{formatDate(agendamento.data_agendamento)}</span>
                                <span className="text-sm">•</span>
                                <span className="text-lg font-bold">
                                    {formatTime(agendamento.horario_inicio)} - {formatTime(agendamento.horario_fim)}
                                </span>
                            </div>
                            <p className="text-xs text-orange-700 font-medium">Agendamento</p>
                        </div>
                    </div>
                    {getStatusBadge(agendamento.status)}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Cliente Section */}
                <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-blue-600 mb-1">Cliente</h4>
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {agendamento.users?.nome || agendamento.cliente_nome || 'Cliente'}
                        </p>
                        <p className="text-xs text-gray-500">
                            Telefone: {agendamento.users?.telefone || agendamento.cliente_telefone || 'Não informado'}
                        </p>
                    </div>
                </div>

                {/* Profissional Section */}
                <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-purple-600 mb-1">Profissional</h4>
                        <p className="text-sm font-medium text-gray-900">
                            {agendamento.profissionais?.nome || 'Profissional'}
                        </p>
                        <div className="flex items-center space-x-1">
                            <MapPin size={12} className="text-gray-400" />
                            <p className="text-xs text-gray-500 truncate">
                                {agendamento.unidades?.nome || 'Unidade'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Serviço Section */}
                <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Scissors size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-green-600 mb-1">Serviço</h4>
                        <p className="text-sm font-medium text-gray-900">
                            {agendamento.servicos?.nome || 'Corte de Cabelo'}
                        </p>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">Valor:</span>
                                <span className="text-sm font-bold text-green-600">
                                    R$ {(agendamento.servicos?.preco || agendamento.preco_total || 30.00).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Clock size={12} className="text-gray-400" />
                                <span className="text-xs text-gray-500">
                                    {agendamento.servicos?.duracao_minutos || 40} min
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="px-4 pb-4">
                <div className="flex space-x-2">
                    <button 
                        onClick={() => abrirModalPagamento(agendamento)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg text-sm font-semibold transition-colors"
                        disabled={agendamento.status === 'completed'}
                    >
                        Confirmar Pagamento
                    </button>
                    <button 
                        onClick={() => cancelarAgendamento(agendamento)}
                        className="bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg text-sm font-semibold transition-colors"
                        disabled={agendamento.status === 'cancelled'}
                    >
                        Cancelar
                    </button>
                    <button className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg text-sm font-semibold transition-colors">
                        <Edit size={16} />
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2].map(i => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="animate-pulse">
                            <div className="h-16 bg-gray-200 rounded mb-4"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            {/* Header - Mobile Optimized */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                <div className="md:hidden">
                    <h1 className="text-xl font-bold text-gray-900">Gerenciar</h1>
                    <h2 className="text-xl font-bold text-gray-900">Agendamentos</h2>
                </div>
                <div className="hidden md:block">
                    <h2 className="text-2xl font-bold text-gray-900">Gerenciar Agendamentos</h2>
                </div>
                <button 
                    onClick={abrirModalCriacao}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors shadow-sm flex items-center justify-center space-x-2 w-full md:w-auto">
                    <Plus size={18} />
                    <span>Novo Agendamento</span>
                </button>
            </div>

            {/* Filters - Mobile First */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
                {/* Quick Filters */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Filtros Rápidos</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'todos', label: 'Todos', icon: '📅' },
                            { id: 'amanha', label: 'Amanhã', icon: '⏰' },
                            { id: 'semana', label: 'Esta Semana', icon: '📆' },
                            { id: 'mes', label: 'Este Mês', icon: '🗓️' }
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => handleQuickFilter(filter.id)}
                                className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    quickFilter === filter.id
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <span>{filter.icon}</span>
                                <span>{filter.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por Cliente</label>
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, profissional..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Status Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    >
                        <option value="todos">Todos os status</option>
                        <option value="pending">Pendente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="completed">Concluído</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                </div>

                {/* Date Filters */}
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                        <input
                            type="date"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Data início"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                        <input
                            type="date"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Data fim"
                        />
                    </div>
                </div>

                {/* Clear Filters Button */}
                <button className="w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Limpar Filtros
                </button>
            </div>

            {/* Appointments List */}
            <div className="space-y-4">
                {filteredAgendamentos.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600">Nenhum agendamento encontrado</p>
                    </div>
                ) : (
                    filteredAgendamentos.map((agendamento) => (
                        <MobileAppointmentCard key={agendamento.id} agendamento={agendamento} />
                    ))
                )}
            </div>

            {/* Modal de Pagamento */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Pagamento</h3>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                Cliente: {selectedAgendamento?.users?.nome || selectedAgendamento?.cliente_nome}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                                Valor: R$ {(selectedAgendamento?.preco_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Pagamento
                            </label>
                            <select
                                value={tipoPagamento}
                                onChange={(e) => setTipoPagamento(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="">Selecione...</option>
                                <option value="dinheiro">Dinheiro</option>
                                <option value="cartao">Cartão</option>
                                <option value="pix">PIX</option>
                            </select>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarPagamento}
                                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação */}
            {showConfirmModal && (
                <ConfirmationModal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={confirmAction === 'cancel' ? executarCancelamento : () => {}}
                    title={confirmAction === 'cancel' ? 'Cancelar Agendamento' : 'Confirmação'}
                    message={confirmAction === 'cancel' 
                        ? 'Tem certeza que deseja cancelar este agendamento?' 
                        : 'Confirmar ação?'
                    }
                    confirmText="Confirmar"
                    cancelText="Cancelar"
                    type="danger"
                />
            )}
        </div>
    );
};

export default AgendamentosManagerMobile;

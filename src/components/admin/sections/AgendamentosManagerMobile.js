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
    XCircle,
    Scissors
} from 'lucide-react';

const AgendamentosManagerMobile = ({ currentUser }) => {
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [quickFilter, setQuickFilter] = useState('todos');

    // Mock data - replace with real data loading
    useEffect(() => {
        // Simulate loading
        setTimeout(() => {
            setAgendamentos([
                {
                    id: '1',
                    data_agendamento: '2025-09-24',
                    horario_inicio: '08:00',
                    horario_fim: '08:40',
                    status: 'pending',
                    preco_total: 30.00,
                    cliente: {
                        nome: 'SILVIO LUIZ GOMES DO MONTE JUNIOR',
                        telefone: '71991016948'
                    },
                    profissional: {
                        nome: 'Lucas M'
                    },
                    unidade: {
                        nome: 'BookIA - Boulevard Shopping Camaçari'
                    },
                    servico: {
                        nome: 'Corte cabelo',
                        duracao_minutos: 40
                    }
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);

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

    const handleQuickFilter = (filterId) => {
        setQuickFilter(filterId);
        // Apply filter logic here
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
                            {agendamento.cliente.nome}
                        </p>
                        <p className="text-xs text-gray-500">
                            Telefone: {agendamento.cliente.telefone}
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
                            {agendamento.profissional.nome}
                        </p>
                        <div className="flex items-center space-x-1">
                            <MapPin size={12} className="text-gray-400" />
                            <p className="text-xs text-gray-500 truncate">
                                {agendamento.unidade.nome}
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
                            {agendamento.servico.nome}
                        </p>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">Valor:</span>
                                <span className="text-sm font-bold text-green-600">
                                    R$ {agendamento.preco_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Clock size={12} className="text-gray-400" />
                                <span className="text-xs text-gray-500">
                                    {agendamento.servico.duracao_minutos} min
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="px-4 pb-4">
                <div className="flex space-x-2">
                    <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg text-sm font-semibold transition-colors">
                        Confirmar Pagamento
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg text-sm font-semibold transition-colors">
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
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors shadow-sm flex items-center justify-center space-x-2 w-full md:w-auto">
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
                {agendamentos.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600">Nenhum agendamento encontrado</p>
                    </div>
                ) : (
                    agendamentos.map((agendamento) => (
                        <MobileAppointmentCard key={agendamento.id} agendamento={agendamento} />
                    ))
                )}
            </div>
        </div>
    );
};

export default AgendamentosManagerMobile;

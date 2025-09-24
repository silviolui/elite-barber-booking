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
import SelectDateTime from '../../SelectDateTime';
import { useToast } from '../../../contexts/ToastContext';
import CustomDatePicker from '../../CustomDatePicker';
import { getBrazilDate, formatDateBR, dateToStringBrazil, getBrazilISOString } from '../../../utils/timezone';

const AgendamentosManager = ({ currentUser }) => {
    const { showSuccess, showError, showWarning } = useToast();
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const unidadeId = adminData.unidade_id || currentUser?.unidade_id; // Usar currentUser como fallback

    console.log('AgendamentosManager - adminData:', adminData);
    console.log('AgendamentosManager - currentUser:', currentUser);
    console.log('AgendamentosManager - unidadeId:', unidadeId);
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

    // Estados para modal de edição
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingAgendamento, setEditingAgendamento] = useState(null);
    const [profissionais, setProfissionais] = useState([]);
    const [servicosFiltrados, setServicosFiltrados] = useState([]);
    const [editForm, setEditForm] = useState({
        cliente_nome: '',
        cliente_telefone: '',
        profissional_id: '',
        servico_id: '',
        data_agendamento: '',
        horario_inicio: '',
        horario_fim: ''
    });

    // Estado para modal de seleção de data/hora
    const [showDateTimeModal, setShowDateTimeModal] = useState(false);

    // Estados para modal de criação de agendamento
    const [showCriacaoModal, setShowCriacaoModal] = useState(false);
    const [criacaoForm, setCriacaoForm] = useState({
        cliente_nome: '',
        cliente_telefone: '',
        cliente_email: '',
        profissional_id: '',
        servico_id: '',
        data_agendamento: '',
        horario_inicio: '',
        horario_fim: '',
        observacoes: ''
    });
    const [showCriacaoDateTimeModal, setShowCriacaoDateTimeModal] = useState(false);
    const [usuariosSugeridos, setUsuariosSugeridos] = useState([]);
    const [criandoAgendamento, setCriandoAgendamento] = useState(false);

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

    useEffect(() => {
        loadAgendamentos();
        loadProfissionais();
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

    const loadProfissionais = async () => {
        try {
            const { data, error } = await supabase
                .from('profissionais')
                .select('*')
                .eq('unidade_id', unidadeId)
                .order('nome');

            if (error) throw error;
            setProfissionais(data || []);
        } catch (error) {
            console.error('Erro ao carregar profissionais:', error);
        }
    };



    const filtrarServicosPorProfissional = async (profissionalId) => {
        if (!profissionalId) {
            setServicosFiltrados([]);
            return;
        }

        try {
            console.log('Carregando serviços do profissional:', profissionalId);

            // Usar a mesma lógica do app do cliente
            const { data, error } = await supabase
                .from('servicos')
                .select('*')
                .eq('profissional_id', profissionalId)
                .eq('ativo', true)
                .order('nome');

            if (error) {
                console.error('Erro ao carregar serviços:', error);
                setServicosFiltrados([]);
                return;
            }

            console.log(`Encontrados ${data?.length || 0} serviços ativos para o profissional`);
            setServicosFiltrados(data || []);
        } catch (error) {
            console.error('Erro ao filtrar serviços por profissional:', error);
            setServicosFiltrados([]);
        }
    };



    const abrirModalEdicao = async (agendamento) => {
        setEditingAgendamento(agendamento);
        setEditForm({
            cliente_nome: agendamento.users?.nome || '',
            cliente_telefone: agendamento.users?.telefone || '',
            profissional_id: agendamento.profissional_id || '',
            servico_id: agendamento.servico_id || '',
            data_agendamento: agendamento.data_agendamento || '',
            horario_inicio: agendamento.horario_inicio || '',
            horario_fim: agendamento.horario_fim || ''
        });

        // Filtrar serviços pelo profissional
        if (agendamento.profissional_id) {
            await filtrarServicosPorProfissional(agendamento.profissional_id);
        }

        setShowEditModal(true);
    };

    const handleProfissionalChange = async (profissionalId) => {
        setEditForm({ ...editForm, profissional_id: profissionalId, servico_id: '' });
        await filtrarServicosPorProfissional(profissionalId);
    };

    const handleServicoChange = (servicoId) => {
        setEditForm({ ...editForm, servico_id: servicoId });
    };

    const handleDateTimeSelect = (dateTime) => {
        console.log('Data/Hora selecionada:', dateTime);
        setEditForm({
            ...editForm,
            data_agendamento: dateTime.date,
            horario_inicio: dateTime.time,
            horario_fim: dateTime.endTime
        });
        setShowDateTimeModal(false);
    };

    const salvarEdicao = async () => {
        try {
            // Atualizar dados do usuário
            const { error: userError } = await supabase
                .from('users')
                .update({
                    nome: editForm.cliente_nome,
                    telefone: editForm.cliente_telefone
                })
                .eq('id', editingAgendamento.usuario_id);

            if (userError) throw userError;

            // Atualizar dados do agendamento
            const { error: agendamentoError } = await supabase
                .from('agendamentos')
                .update({
                    profissional_id: editForm.profissional_id,
                    servico_id: editForm.servico_id,
                    data_agendamento: editForm.data_agendamento,
                    horario_inicio: editForm.horario_inicio,
                    horario_fim: editForm.horario_fim
                })
                .eq('id', editingAgendamento.id);

            if (agendamentoError) throw agendamentoError;

            setShowEditModal(false);
            setEditingAgendamento(null);
            await loadAgendamentos();
            showSuccess('Agendamento editado com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar edição:', error);
            showError('Erro ao salvar edição: ' + error.message);
        }
    };

    const abrirModalPagamento = (agendamento) => {
        setSelectedAgendamento(agendamento);
        setTipoPagamento('');
        setShowPaymentModal(true);
    };

    const confirmarPagamento = async () => {
        if (!tipoPagamento) {
            showWarning('Por favor, selecione o tipo de pagamento');
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

            // Preparar data de conclusão com fuso horário do Brasil


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
                data_conclusao: getBrazilISOString()
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

            showSuccess('Pagamento confirmado e movido para histórico com sucesso!');
        } catch (error) {
            console.error('❌ ERRO GERAL ao confirmar pagamento:', error);
            showError('Erro ao confirmar pagamento: ' + error.message);
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
                showSuccess('Agendamento cancelado com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao cancelar agendamento:', error);
            showError(`Erro ao cancelar agendamento: ${error.message}`);
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

            // Preparar data de conclusão com fuso horário do Brasil


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
                    data_conclusao: getBrazilISOString()
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

    // ===== FUNÇÕES PARA CRIAÇÃO DE AGENDAMENTOS =====

    const abrirModalCriacao = async () => {
        setShowCriacaoModal(true);
        // Carregar profissionais se ainda não estão carregados
        if (profissionais.length === 0) {
            await loadProfissionais();
        }
        // Limpar formulário
        setCriacaoForm({
            cliente_nome: '',
            cliente_telefone: '',
            cliente_email: '',
            profissional_id: '',
            servico_id: '',
            data_agendamento: '',
            horario_inicio: '',
            horario_fim: '',
            observacoes: ''
        });
        setUsuariosSugeridos([]);
    };

    const handleCriacaoProfissionalChange = async (profissionalId) => {
        setCriacaoForm(prev => ({ ...prev, profissional_id: profissionalId, servico_id: '' }));
        
        if (profissionalId) {
            await filtrarServicosPorProfissional(profissionalId);
        } else {
            setServicosFiltrados([]);
        }
    };

    const handleCriacaoServicoChange = async (servicoId) => {
        setCriacaoForm(prev => ({ ...prev, servico_id: servicoId }));
    };

    const buscarUsuariosPorTelefone = async (telefone) => {
        if (telefone.length < 3) {
            setUsuariosSugeridos([]);
            return;
        }

        try {
            const { data, error } = await supabase
                .rpc('buscar_usuarios_por_telefone', { p_telefone_partial: telefone });

            if (error) {
                console.error('Erro ao buscar usuários:', error);
                setUsuariosSugeridos([]);
                return;
            }

            setUsuariosSugeridos(data || []);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            setUsuariosSugeridos([]);
        }
    };

    const handleTelefoneChange = (telefone) => {
        setCriacaoForm(prev => ({ ...prev, cliente_telefone: telefone }));
        buscarUsuariosPorTelefone(telefone);
    };

    const selecionarUsuarioSugerido = (usuario) => {
        setCriacaoForm(prev => ({
            ...prev,
            cliente_nome: usuario.name,
            cliente_telefone: usuario.phone,
            cliente_email: usuario.email || ''
        }));
        setUsuariosSugeridos([]);
    };

    const handleCriacaoDateTimeSelect = (data, horarioInicio, horarioFim) => {
        setCriacaoForm(prev => ({
            ...prev,
            data_agendamento: data,
            horario_inicio: horarioInicio,
            horario_fim: horarioFim
        }));
        setShowCriacaoDateTimeModal(false);
    };

    const criarAgendamento = async () => {
        // Validações básicas
        if (!criacaoForm.cliente_nome.trim() || !criacaoForm.cliente_telefone.trim()) {
            showError('Nome e telefone do cliente são obrigatórios');
            return;
        }

        if (!criacaoForm.profissional_id || !criacaoForm.servico_id) {
            showError('Profissional e serviço são obrigatórios');
            return;
        }

        if (!criacaoForm.data_agendamento || !criacaoForm.horario_inicio || !criacaoForm.horario_fim) {
            showError('Data e horário são obrigatórios');
            return;
        }

        setCriandoAgendamento(true);

        try {
            // Buscar preço do serviço
            const servicoSelecionado = servicosFiltrados.find(s => s.id === criacaoForm.servico_id);
            const precoTotal = servicoSelecionado?.preco || 0;

            const { data, error } = await supabase
                .rpc('criar_agendamento_admin', {
                    p_profissional_id: criacaoForm.profissional_id,
                    p_unidade_id: unidadeId,
                    p_servico_id: criacaoForm.servico_id,
                    p_data_agendamento: criacaoForm.data_agendamento,
                    p_horario_inicio: criacaoForm.horario_inicio,
                    p_horario_fim: criacaoForm.horario_fim,
                    p_preco_total: precoTotal,
                    p_usuario_id: null, // Sempre criar como cliente direto
                    p_cliente_nome: criacaoForm.cliente_nome,
                    p_cliente_telefone: criacaoForm.cliente_telefone,
                    p_cliente_email: criacaoForm.cliente_email || null,
                    p_observacoes: criacaoForm.observacoes || null
                });

            if (error) {
                console.error('Erro ao criar agendamento:', error);
                showError(`Erro ao criar agendamento: ${error.message}`);
                return;
            }

            const resultado = data[0]; // RPC retorna array

            if (!resultado.success) {
                showError(resultado.message);
                return;
            }

            showSuccess('Agendamento criado com sucesso!');
            setShowCriacaoModal(false);
            
            // Recarregar lista de agendamentos
            await loadAgendamentos();

        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
            showError('Erro inesperado ao criar agendamento');
        } finally {
            setCriandoAgendamento(false);
        }
    };

    // Função deleteAgendamento removida - agora usa handleDeleteAgendamento

    const filteredAgendamentos = agendamentos.filter(agendamento => {
        const matchesSearch =
            agendamento.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agendamento.profissionais?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agendamento.unidades?.nome?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'todos' || agendamento.status === statusFilter;

        // Filtro por período de datas
        let matchesDateRange = true;
        if (dateStartFilter && dateEndFilter) {
            const agendamentoDate = agendamento.data_agendamento;
            matchesDateRange = agendamentoDate >= dateStartFilter && agendamentoDate <= dateEndFilter;
        } else if (dateStartFilter) {
            matchesDateRange = agendamento.data_agendamento >= dateStartFilter;
        } else if (dateEndFilter) {
            matchesDateRange = agendamento.data_agendamento <= dateEndFilter;
        }

        return matchesSearch && matchesStatus && matchesDateRange;
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
        if (!dateString) return '';
        // Evitar problemas de timezone - tratar como data local
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        return formatDateBR(date);
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
                <button 
                    onClick={abrirModalCriacao}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <Plus size={20} className="mr-2" />
                    Novo Agendamento
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                {/* Botões Rápidos */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Filtros Rápidos</h3>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'todos', label: 'Todos', icon: '📅' },
                            { id: 'amanha', label: 'Amanhã', icon: '⏰' },
                            { id: 'semana', label: 'Esta Semana', icon: '📆' },
                            { id: 'mes', label: 'Este Mês', icon: '🗓️' }
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => handleQuickFilter(filter.id)}
                                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
                  ${quickFilter === filter.id
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }
                `}
                            >
                                <span>{filter.icon}</span>
                                <span>{filter.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filtros Detalhados */}
                <div className="space-y-4">
                    {/* Primeira linha: Busca e Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search */}
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
                    </div>

                    {/* Segunda linha: Datas e Botão */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Data Início */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                            <CustomDatePicker
                                value={dateStartFilter}
                                onChange={(date) => {
                                    setDateStartFilter(date);
                                    setQuickFilter(''); // Limpar filtro rápido quando usar filtro manual
                                }}
                                placeholder="Data início"
                                className="w-full"
                            />
                        </div>

                        {/* Data Fim */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                            <CustomDatePicker
                                value={dateEndFilter}
                                onChange={(date) => {
                                    setDateEndFilter(date);
                                    setQuickFilter(''); // Limpar filtro rápido quando usar filtro manual
                                }}
                                placeholder="Data fim"
                                className="w-full"
                                minDate={dateStartFilter ? new Date(dateStartFilter) : null}
                            />
                        </div>

                        {/* Botão Limpar Filtros */}
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('todos');
                                    setDateStartFilter('');
                                    setDateEndFilter('');
                                    setQuickFilter('todos');
                                }}
                                className="w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Limpar Filtros
                            </button>
                        </div>
                    </div>
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
                                        onClick={() => abrirModalEdicao(agendamento)}
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

            {/* Modal de Edição de Agendamento */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Header do Modal */}
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 rounded-t-xl">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                <Edit size={24} className="mr-3" />
                                Editar Agendamento
                            </h3>
                            <p className="text-orange-100 text-sm mt-1">
                                Modifique as informações do agendamento
                            </p>
                        </div>

                        {/* Conteúdo do Modal */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Dados do Cliente */}
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Dados do Cliente</h4>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nome do Cliente
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.cliente_nome}
                                                onChange={(e) => setEditForm({ ...editForm, cliente_nome: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                placeholder="Nome do cliente"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Telefone
                                            </label>
                                            <input
                                                type="tel"
                                                value={editForm.cliente_telefone}
                                                onChange={(e) => setEditForm({ ...editForm, cliente_telefone: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Dados do Serviço */}
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Dados do Serviço</h4>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Profissional
                                            </label>
                                            <select
                                                value={editForm.profissional_id}
                                                onChange={(e) => handleProfissionalChange(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            >
                                                <option value="">Selecione um profissional</option>
                                                {profissionais.map((prof) => (
                                                    <option key={prof.id} value={prof.id}>
                                                        {prof.nome}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Serviço
                                            </label>
                                            <select
                                                value={editForm.servico_id}
                                                onChange={(e) => handleServicoChange(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                disabled={!editForm.profissional_id}
                                            >
                                                <option value="">
                                                    {!editForm.profissional_id
                                                        ? 'Selecione um profissional primeiro'
                                                        : servicosFiltrados.length === 0
                                                            ? 'Este profissional não possui serviços ativos'
                                                            : 'Selecione um serviço'
                                                    }
                                                </option>
                                                {servicosFiltrados.map((servico) => (
                                                    <option key={servico.id} value={servico.id}>
                                                        {servico.nome} - R$ {servico.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({servico.duracao_minutos || 20} min)
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Mostrar duração do serviço selecionado */}
                                            {editForm.servico_id && (
                                                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                                            <span className="text-white text-xs">⏱</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-orange-800">
                                                                Duração do Serviço
                                                            </p>
                                                            <p className="text-xs text-orange-600">
                                                                {(() => {
                                                                    const servicoSelecionado = servicosFiltrados.find(s => s.id === editForm.servico_id);
                                                                    return servicoSelecionado ? `${servicoSelecionado.duracao_minutos || 20} minutos` : '20 minutos';
                                                                })()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Data e Horário */}
                            <div className="mt-6">
                                <h4 className="text-lg font-semibold text-gray-800 mb-4">Data e Horário</h4>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-4">
                                            Data e Horário
                                        </label>

                                        {editForm.data_agendamento && editForm.horario_inicio && editForm.horario_fim ? (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium text-green-700">
                                                            📅 {formatDate(editForm.data_agendamento)}
                                                        </div>
                                                        <div className="font-medium text-green-700 mt-1">
                                                            ⏰ {editForm.horario_inicio} - {editForm.horario_fim}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowDateTimeModal(true)}
                                                        className="text-green-600 hover:text-green-800 font-medium"
                                                    >
                                                        Alterar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setShowDateTimeModal(true)}
                                                disabled={!editForm.profissional_id || !editForm.servico_id}
                                                className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-left"
                                            >
                                                <div className="text-sm text-gray-600">
                                                    {!editForm.profissional_id || !editForm.servico_id
                                                        ? 'Selecione profissional e serviço primeiro'
                                                        : 'Clique para escolher data e horário'
                                                    }
                                                </div>
                                                <div className="text-gray-400 mt-1">
                                                    📅 Calendário personalizado com horários disponíveis
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Botões de Ação */}
                            <div className="flex space-x-3 mt-8">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingAgendamento(null);
                                    }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={salvarEdicao}
                                    disabled={!editForm.cliente_nome || !editForm.profissional_id || !editForm.servico_id || !editForm.data_agendamento || !editForm.horario_inicio}
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:text-gray-500 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                                >
                                    <CheckCircle size={20} />
                                    <span>Salvar Alterações</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Seleção de Data/Hora - Componente do App Cliente */}
            {showDateTimeModal && editForm.profissional_id && editForm.servico_id && (
                <SelectDateTime
                    onClose={() => setShowDateTimeModal(false)}
                    onSelect={handleDateTimeSelect}
                    professionalId={editForm.profissional_id}
                    unitId={unidadeId}
                    servicosSelecionados={servicosFiltrados.filter(s => s.id === editForm.servico_id)}
                    currentDate={null}
                    currentTime={null}
                    isModal={true}
                />
            )}

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
                                                <span className={`font-medium ${tipoPagamento === opcao.id ? 'text-green-700' : 'text-gray-700'
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

            {/* Modal de Criação de Agendamento */}
            {showCriacaoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Header do Modal */}
                        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 rounded-t-xl">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                <Plus size={24} className="mr-3" />
                                Criar Novo Agendamento
                            </h3>
                            <p className="text-green-100 text-sm mt-1">
                                Preencha os dados para criar um novo agendamento
                            </p>
                        </div>

                        {/* Conteúdo do Modal */}
                        <div className="p-6 space-y-6">
                            {/* Dados do Cliente */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User size={16} className="text-blue-600" />
                                    </div>
                                    <h4 className="font-semibold text-gray-800">Dados do Cliente</h4>
                                </div>

                                <div className="ml-10 space-y-4">
                                    {/* Nome do Cliente */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Cliente *</label>
                                        <input
                                            type="text"
                                            value={criacaoForm.cliente_nome}
                                            onChange={(e) => setCriacaoForm(prev => ({ ...prev, cliente_nome: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="Nome completo do cliente"
                                            required
                                        />
                                    </div>

                                    {/* Telefone do Cliente */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Telefone do Cliente *</label>
                                        <input
                                            type="tel"
                                            value={criacaoForm.cliente_telefone}
                                            onChange={(e) => handleTelefoneChange(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="(11) 99999-9999"
                                            required
                                        />
                                        
                                        {/* Lista de Sugestões */}
                                        {usuariosSugeridos.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {usuariosSugeridos.map((usuario) => (
                                                    <button
                                                        key={usuario.id}
                                                        onClick={() => selecionarUsuarioSugerido(usuario)}
                                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{usuario.name}</p>
                                                                <p className="text-sm text-gray-500">{usuario.phone}</p>
                                                            </div>
                                                            <span className="text-xs text-green-600">Cliente existente</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Email do Cliente */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">E-mail (opcional)</label>
                                        <input
                                            type="email"
                                            value={criacaoForm.cliente_email}
                                            onChange={(e) => setCriacaoForm(prev => ({ ...prev, cliente_email: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="cliente@email.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dados do Agendamento */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Calendar size={16} className="text-purple-600" />
                                    </div>
                                    <h4 className="font-semibold text-gray-800">Dados do Agendamento</h4>
                                </div>

                                <div className="ml-10 space-y-4">
                                    {/* Profissional */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Profissional *</label>
                                        <select
                                            value={criacaoForm.profissional_id}
                                            onChange={(e) => handleCriacaoProfissionalChange(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                            required
                                        >
                                            <option value="">Selecione um profissional</option>
                                            {profissionais.map((profissional) => (
                                                <option key={profissional.id} value={profissional.id}>
                                                    {profissional.nome} - {profissional.especialidade}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Serviço */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Serviço *</label>
                                        <select
                                            value={criacaoForm.servico_id}
                                            onChange={(e) => handleCriacaoServicoChange(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                            disabled={!criacaoForm.profissional_id}
                                            required
                                        >
                                            <option value="">
                                                {!criacaoForm.profissional_id 
                                                    ? 'Primeiro selecione um profissional' 
                                                    : 'Selecione um serviço'
                                                }
                                            </option>
                                            {servicosFiltrados.map((servico) => (
                                                <option key={servico.id} value={servico.id}>
                                                    {servico.nome} - R$ {servico.preco.toFixed(2)} ({servico.duracao_minutos}min)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Data e Horário */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-gray-700">Data e Horário *</label>
                                        
                                        {criacaoForm.data_agendamento && criacaoForm.horario_inicio ? (
                                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <Calendar size={20} className="text-green-600" />
                                                        <div>
                                                            <p className="font-medium text-green-800">
                                                                {formatDateBR(new Date(criacaoForm.data_agendamento + 'T00:00:00'))}
                                                            </p>
                                                            <p className="text-sm text-green-600">
                                                                {criacaoForm.horario_inicio} - {criacaoForm.horario_fim}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setShowCriacaoDateTimeModal(true)}
                                                        className="text-green-600 hover:text-green-700 font-medium"
                                                        disabled={!criacaoForm.profissional_id || !criacaoForm.servico_id}
                                                    >
                                                        Alterar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowCriacaoDateTimeModal(true)}
                                                disabled={!criacaoForm.profissional_id || !criacaoForm.servico_id}
                                                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-400 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                                            >
                                                {!criacaoForm.profissional_id || !criacaoForm.servico_id
                                                    ? 'Selecione profissional e serviço primeiro'
                                                    : 'Clique para selecionar data e horário'
                                                }
                                            </button>
                                        )}
                                    </div>

                                    {/* Observações */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Observações (opcional)</label>
                                        <textarea
                                            value={criacaoForm.observacoes}
                                            onChange={(e) => setCriacaoForm(prev => ({ ...prev, observacoes: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            rows="3"
                                            placeholder="Observações adicionais sobre o agendamento..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Botões de Ação */}
                            <div className="flex space-x-3 mt-8">
                                <button
                                    onClick={() => {
                                        setShowCriacaoModal(false);
                                        setCriacaoForm({
                                            cliente_nome: '',
                                            cliente_telefone: '',
                                            cliente_email: '',
                                            profissional_id: '',
                                            servico_id: '',
                                            data_agendamento: '',
                                            horario_inicio: '',
                                            horario_fim: '',
                                            observacoes: ''
                                        });
                                        setUsuariosSugeridos([]);
                                    }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                                    disabled={criandoAgendamento}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={criarAgendamento}
                                    disabled={
                                        criandoAgendamento ||
                                        !criacaoForm.cliente_nome.trim() || 
                                        !criacaoForm.cliente_telefone.trim() || 
                                        !criacaoForm.profissional_id || 
                                        !criacaoForm.servico_id || 
                                        !criacaoForm.data_agendamento || 
                                        !criacaoForm.horario_inicio
                                    }
                                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                                >
                                    {criandoAgendamento ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Criando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={20} />
                                            <span>Criar Agendamento</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Seleção de Data/Hora para Criação */}
            {showCriacaoDateTimeModal && criacaoForm.profissional_id && criacaoForm.servico_id && (
                <SelectDateTime
                    onClose={() => setShowCriacaoDateTimeModal(false)}
                    onSelect={handleCriacaoDateTimeSelect}
                    professionalId={criacaoForm.profissional_id}
                    unitId={unidadeId}
                    servicosSelecionados={servicosFiltrados.filter(s => s.id === criacaoForm.servico_id)}
                    currentDate={null}
                    currentTime={null}
                    isModal={true}
                />
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

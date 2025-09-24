import React, { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { supabaseData } from '../lib/supabaseData';
import { getBrazilDate, dateToStringBrazil } from '../utils/timezone';

const SelectDateTime = ({ onClose, onSelect, professionalId, currentDate, currentTime, unitId, servicosSelecionados, isModal = false }) => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(getBrazilDate());
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('manha');
    const [closedDays, setClosedDays] = useState([]);
    const [periodosDisponiveis, setPeriodosDisponiveis] = useState({ manha: false, tarde: false, noite: false });
    const [horariosDisponiveis, setHorariosDisponiveis] = useState({ manha: [], tarde: [], noite: [] });
    const [diasSemHorarios, setDiasSemHorarios] = useState([]); // Dias totalmente ocupados
    const [diasComHorarios, setDiasComHorarios] = useState([]); // Dias com horários disponíveis
    const [diasFolgaTotal, setDiasFolgaTotal] = useState([]); // Dias com folga total (vermelho escuro)
    const [loadingHorarios, setLoadingHorarios] = useState(false); // Loading para horários

    // Funções do calendário
    const getMonthName = (date) => {
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return months[date.getMonth()];
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Dias vazios do início
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Dias do mês
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const nextMonth = () => {
        const today = getBrazilDate();
        const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 1);
        const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

        if (next < maxDate) {
            setCurrentMonth(next);
        }
    };

    const prevMonth = () => {
        const today = getBrazilDate();
        const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);

        if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) {
            setCurrentMonth(prev);
        }
    };

    // Carregar horário de funcionamento da unidade
    useEffect(() => {
        const loadHorarioFuncionamento = async () => {
            if (!unitId) return;

            try {
                const horarios = await supabaseData.getHorarioFuncionamento(unitId);

                // Criar array com dias fechados (0-6, sendo 0=Domingo)
                const diasAbertos = [];
                const diasFechados = [];

                for (let dia = 0; dia <= 6; dia++) {
                    const horarioDia = horarios.find(h => h.dia_semana === dia);
                    if (horarioDia && (horarioDia.abre_manha || horarioDia.abre_tarde || horarioDia.abre_noite)) {
                        diasAbertos.push(dia);
                    } else {
                        diasFechados.push(dia);
                    }
                }

                setClosedDays(diasFechados);
                console.log(`Unidade ${unitId} - Dias fechados:`, diasFechados);
            } catch (error) {
                console.error('Erro ao carregar horários de funcionamento:', error);
                setClosedDays([0]); // Fechar apenas domingo por padrão
            }
        };

        loadHorarioFuncionamento();
    }, [unitId]);

    // Verificar quais dias do mês não têm horários disponíveis (OTIMIZADO)
    useEffect(() => {
        const verificarDiasSemHorarios = async () => {
            if (!unitId || !professionalId || !servicosSelecionados?.length) return;

            try {
                // Buscar agendamentos do mês
                const primeiroDia = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const ultimoDia = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

                const agendamentosDoMes = await supabaseData.getAgendamentosMes(
                    professionalId,
                    dateToStringBrazil(primeiroDia),
                    dateToStringBrazil(ultimoDia)
                );

                // Buscar folgas do profissional
                const mesAno = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}`;
                const datasComFolga = await supabaseData.getDatasfolga(professionalId, mesAno);

                // Analisar localmente quais dias estão ocupados e quais têm horários
                const diasOcupados = [];
                const diasDisponiveis = [];
                const diasComFolgaTotal = [];
                const diasDoMes = getDaysInMonth(currentMonth);
                const hoje = getBrazilDate();
                hoje.setHours(0, 0, 0, 0);

                for (const day of diasDoMes) {
                    if (!day || closedDays.includes(day.getDay())) continue;

                    const dataStr = dateToStringBrazil(day);
                    const diaSemana = day.getDay();

                    // VERIFICAR SE TODOS OS PERÍODOS ESTÃO DE FOLGA (só para datas presente/futuras)
                    let todosPeriodosDeFolga = false;
                    if (day >= hoje) {
                        const folgasNoDia = datasComFolga.filter(folga => {
                            if (folga.tipo_folga === 'data_especifica' && folga.data_folga === dataStr) {
                                return true;
                            }
                            if (folga.tipo_folga === 'dia_semana_recorrente' && folga.dia_semana === diaSemana) {
                                return true;
                            }
                            return false;
                        });

                        // Verificar se todos os períodos (manhã E tarde E noite) estão de folga
                        if (folgasNoDia.length > 0) {
                            console.log('🔍 Folgas encontradas para', dataStr, ':', folgasNoDia);
                            // Verificar se existe alguma folga que cobre TODOS os períodos
                            todosPeriodosDeFolga = folgasNoDia.some(folga => {
                                const todosPeriodos = folga.folga_manha && folga.folga_tarde && folga.folga_noite;
                                console.log('🔍 Folga completa?', todosPeriodos, folga);
                                return todosPeriodos;
                            });
                        }
                    }

                    // Se TODOS os períodos estão de folga, marcar como folga total (vermelho escuro)
                    if (todosPeriodosDeFolga) {
                        diasComFolgaTotal.push(day.getDate());
                        console.log('🔴 Dia com folga total:', day.getDate());
                    } else {
                        // Verificar agendamentos normalmente
                        const agendamentosDoDia = agendamentosDoMes.filter(ag => ag.data_agendamento === dataStr);

                        if (agendamentosDoDia.length >= 3) {
                            // Muitos agendamentos = sem horários
                            diasOcupados.push(day.getDate());
                        } else {
                            // Poucos agendamentos = tem horários disponíveis
                            diasDisponiveis.push(day.getDate());
                        }
                    }
                }

                setDiasSemHorarios(diasOcupados);
                setDiasComHorarios(diasDisponiveis);
                setDiasFolgaTotal(diasComFolgaTotal);
                console.log('📅 Dias sem horários (ocupados):', diasOcupados);
                console.log('📅 Dias com horários:', diasDisponiveis);
                console.log('🔴 Dias com folga total:', diasComFolgaTotal);
            } catch (error) {
                console.error('Erro ao verificar dias sem horários:', error);
            }
        };

        verificarDiasSemHorarios();
    }, [unitId, professionalId, servicosSelecionados, currentMonth, closedDays]);

    // Carregar períodos e horários quando a data for selecionada (OTIMIZADO)
    useEffect(() => {
        const loadPeriodosDisponiveis = async () => {
            if (!unitId || !selectedDate) {
                console.log('❌ Faltam dados:', { unitId, selectedDate });
                setLoadingHorarios(false);
                return;
            }

            // VERIFICAR SE O DIA SELECIONADO ESTÁ SEM HORÁRIOS (ocupado ou folga total)
            const dataSelecionadaObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
            const diaDoMes = dataSelecionadaObj.getDate();

            if (diasSemHorarios.includes(diaDoMes) || diasFolgaTotal.includes(diaDoMes)) {
                console.log('❌ Dia selecionado sem horários (ocupado ou folga total), não carregando períodos');
                setPeriodosDisponiveis({ manha: false, tarde: false, noite: false });
                setHorariosDisponiveis({ manha: [], tarde: [], noite: [] });
                setLoadingHorarios(false);
                return;
            }

            // INICIAR LOADING E LIMPAR DADOS ANTERIORES
            setLoadingHorarios(true);
            setPeriodosDisponiveis({ manha: false, tarde: false, noite: false });
            setHorariosDisponiveis({ manha: [], tarde: [], noite: [] });
            setSelectedTime(null); // Limpar horário selecionado anteriormente

            try {
                console.log('🚀 Carregando períodos OTIMIZADO para:', { unitId, selectedDate });

                // Criar data de forma mais robusta
                let dataObj;
                if (selectedDate instanceof Date) {
                    dataObj = selectedDate;
                } else if (typeof selectedDate === 'string') {
                    // Se é string no formato 'YYYY-MM-DD' ou similar
                    if (selectedDate.includes('-')) {
                        dataObj = new Date(selectedDate + 'T00:00:00');
                    } else {
                        dataObj = new Date(selectedDate);
                    }
                } else {
                    console.error('❌ Formato de data inválido:', selectedDate);
                    return;
                }

                // Verificar se a data é válida
                if (isNaN(dataObj.getTime())) {
                    console.error('❌ Data inválida criada:', { selectedDate, dataObj });
                    return;
                }

                console.log('📅 Data criada:', dataObj.toISOString());

                // USAR FUNÇÃO OTIMIZADA - UMA ÚNICA CHAMADA
                const dadosCompletos = await supabaseData.getDadosCompletosData(
                    unitId,
                    dataObj,
                    professionalId,
                    servicosSelecionados
                );

                const { periodos, horariosMap } = dadosCompletos;

                setHorariosDisponiveis(horariosMap);
                setPeriodosDisponiveis(periodos);

                // Se o período atual não está disponível, mudar para o primeiro disponível (SEM causar recarregamento)
                setTimeout(() => {
                    // Usar callback para acessar o estado atual sem dependência
                    setSelectedPeriod(currentPeriod => {
                        if (!periodos[currentPeriod]) {
                            console.log(`🔄 Período ${currentPeriod} não disponível, mudando...`);
                            if (periodos.manha) return 'manha';
                            else if (periodos.tarde) return 'tarde';
                            else if (periodos.noite) return 'noite';
                        }
                        return currentPeriod; // Manter período atual se estiver disponível
                    });
                }, 0);

                console.log('📋 Resumo final OTIMIZADO:', {
                    periodos,
                    horariosMap
                });
            } catch (error) {
                console.error('Erro ao carregar períodos disponíveis:', error);
                // Fallback para método anterior em caso de erro
                console.warn('🔄 Tentando método não otimizado...');
                // Aqui você pode manter o código antigo como fallback se necessário
            } finally {
                // FINALIZAR LOADING
                setLoadingHorarios(false);
            }
        };

        loadPeriodosDisponiveis();
    }, [unitId, selectedDate, professionalId, servicosSelecionados, diasSemHorarios, diasFolgaTotal]); // Removi selectedPeriod das dependências

    // Set initial selections if provided (não fazer quando null)
    useEffect(() => {
        if (currentDate && currentTime) {
            setSelectedDate(currentDate);
            setSelectedTime(currentTime);
        }
    }, [currentDate, currentTime]);

    // Horários agora são carregados dinamicamente da base de dados

    // Componente de Loading Spinner
    const LoadingSpinner = () => (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-500 text-sm">Carregando horários disponíveis...</p>
        </div>
    );

    const renderTimeSlots = (times) => (
        <div className="mb-6">
            <div className="grid grid-cols-4 gap-2">
                {times.map(time => (
                    <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${selectedTime === time
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                            }`}
                    >
                        {time}
                    </button>
                ))}
            </div>
        </div>
    );

    const handleContinue = () => {
        if (selectedDate && selectedTime) {
            // Para o admin, calcular horário de fim baseado na duração do serviço
            if (isModal && servicosSelecionados?.[0]?.duracao_minutos) {
                const [horas, minutos] = selectedTime.split(':').map(Number);
                const inicioMinutos = horas * 60 + minutos;
                const fimMinutos = inicioMinutos + servicosSelecionados[0].duracao_minutos;
                const fimHoras = Math.floor(fimMinutos / 60);
                const fimMinutosResto = fimMinutos % 60;
                const horarioFim = `${fimHoras.toString().padStart(2, '0')}:${fimMinutosResto.toString().padStart(2, '0')}:00`;

                const dataFormatted = dateToStringBrazil(selectedDate);
                onSelect({
                    date: dataFormatted,
                    time: selectedTime + ':00',
                    endTime: horarioFim
                });
            } else {
                onSelect(selectedDate, selectedTime);
            }
            onClose();
        }
    };

    // Se for modal (admin), renderizar como popup flutuante
    if (isModal) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-gray-900 text-xl font-semibold">Agendar Horário</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="text-gray-900 text-lg font-semibold mb-2">Quando você prefere?</h3>
                            <p className="text-gray-600">Escolha a melhor data e horário</p>
                        </div>

                        <div className="space-y-8">
                            {/* Calendar */}
                            <div>
                                <h4 className="text-gray-900 font-semibold mb-4">Calendário</h4>

                                {/* Month Navigation */}
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={prevMonth}
                                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                    >
                                        <ChevronRight size={16} className="text-gray-600 rotate-180" />
                                    </button>

                                    <div className="text-center">
                                        <h5 className="text-lg font-semibold text-gray-900">
                                            {getMonthName(currentMonth)} {currentMonth.getFullYear()}
                                        </h5>
                                    </div>

                                    <button
                                        onClick={nextMonth}
                                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                    >
                                        <ChevronRight size={16} className="text-gray-600" />
                                    </button>
                                </div>

                                {/* Calendar Grid */}
                                <div className="bg-white rounded-2xl p-4 shadow-sm border">
                                    {/* Days of week header */}
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Calendar days */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {getDaysInMonth(currentMonth).map((day, index) => {
                                            if (!day) {
                                                return <div key={index} className="w-10 h-10"></div>;
                                            }

                                            const today = getBrazilDate();
                                            today.setHours(0, 0, 0, 0);
                                            const isToday = day.toDateString() === today.toDateString();
                                            const isPast = day < today;
                                            const isClosed = closedDays.includes(day.getDay());
                                            const isSemHorarios = diasSemHorarios.includes(day.getDate());
                                            const isComHorarios = diasComHorarios.includes(day.getDate());
                                            const isFolgaTotal = diasFolgaTotal.includes(day.getDate());
                                            const isSelected = selectedDate && day &&
                                                (typeof selectedDate === 'object' ?
                                                    day.toDateString() === selectedDate.toDateString() :
                                                    day.toDateString() === new Date(selectedDate).toDateString());
                                            const isDisabled = isPast || isClosed;

                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => !isDisabled && setSelectedDate(day)}
                                                    disabled={isDisabled}
                                                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors relative ${(isFolgaTotal || isSemHorarios) && !isSelected
                                                            ? 'bg-red-100 text-red-600 border border-red-300 hover:bg-red-200'
                                                            : isDisabled
                                                                ? 'text-gray-200 cursor-not-allowed bg-gray-50'
                                                                : isSelected
                                                                    ? 'bg-orange-500 text-white'
                                                                    : isComHorarios && !isSelected
                                                                        ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                                                                        : isToday
                                                                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                                            : 'text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                    title={isFolgaTotal ? 'Profissional de folga (dia todo)' : isClosed ? 'Fechado neste dia' : isSemHorarios ? 'Sem horários disponíveis' : isComHorarios ? 'Horários disponíveis' : ''}
                                                >
                                                    {day.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Time Slots */}
                            {selectedDate && (
                                <div>
                                    <h4 className="text-gray-900 font-semibold mb-4">Horários Disponíveis</h4>

                                    {/* Loading Spinner */}
                                    {loadingHorarios ? (
                                        <LoadingSpinner />
                                    ) : (
                                        <>
                                            {/* Period Buttons */}
                                            <div className="flex space-x-2 mb-6">
                                                {periodosDisponiveis.manha && (
                                                    <button
                                                        onClick={() => setSelectedPeriod('manha')}
                                                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${selectedPeriod === 'manha'
                                                                ? 'bg-orange-500 text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        ☀️ Manhã
                                                    </button>
                                                )}
                                                {periodosDisponiveis.tarde && (
                                                    <button
                                                        onClick={() => setSelectedPeriod('tarde')}
                                                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${selectedPeriod === 'tarde'
                                                                ? 'bg-orange-500 text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        🌤️ Tarde
                                                    </button>
                                                )}
                                                {periodosDisponiveis.noite && (
                                                    <button
                                                        onClick={() => setSelectedPeriod('noite')}
                                                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${selectedPeriod === 'noite'
                                                                ? 'bg-orange-500 text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        🌙 Noite
                                                    </button>
                                                )}
                                            </div>

                                            {/* Show only selected period times */}
                                            {selectedPeriod === 'manha' && horariosDisponiveis.manha.length > 0 && (
                                                <div className="grid grid-cols-4 gap-2">
                                                    {horariosDisponiveis.manha.map(time => (
                                                        <button
                                                            key={time}
                                                            onClick={() => setSelectedTime(time)}
                                                            className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${selectedTime === time
                                                                    ? 'bg-orange-500 text-white shadow-lg'
                                                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                                                                }`}
                                                        >
                                                            {time}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {selectedPeriod === 'tarde' && horariosDisponiveis.tarde.length > 0 && (
                                                <div className="grid grid-cols-4 gap-2">
                                                    {horariosDisponiveis.tarde.map(time => (
                                                        <button
                                                            key={time}
                                                            onClick={() => setSelectedTime(time)}
                                                            className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${selectedTime === time
                                                                    ? 'bg-orange-500 text-white shadow-lg'
                                                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                                                                }`}
                                                        >
                                                            {time}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {selectedPeriod === 'noite' && horariosDisponiveis.noite.length > 0 && (
                                                <div className="grid grid-cols-4 gap-2">
                                                    {horariosDisponiveis.noite.map(time => (
                                                        <button
                                                            key={time}
                                                            onClick={() => setSelectedTime(time)}
                                                            className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${selectedTime === time
                                                                    ? 'bg-orange-500 text-white shadow-lg'
                                                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                                                                }`}
                                                        >
                                                            {time}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Mensagem se não houver horários disponíveis */}
                                            {selectedPeriod && horariosDisponiveis[selectedPeriod]?.length === 0 && (
                                                <div className="text-center py-8">
                                                    <p className="text-gray-500">Nenhum horário disponível para este período.</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex space-x-3 mt-8 pt-6 border-t border-gray-200">
                            <button
                                onClick={onClose}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleContinue}
                                disabled={!selectedDate || !selectedTime}
                                className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:text-gray-500 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                            >
                                Confirmar Horário
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Renderização original para tela cheia (app cliente)
    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-gray-900 text-xl font-semibold">Agendar Horário</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="mb-6">
                    <h3 className="text-gray-900 text-lg font-semibold mb-2">Quando você prefere?</h3>
                    <p className="text-gray-600">Escolha a melhor data e horário</p>
                </div>

                <div className="pb-24">
                    {/* Calendar */}
                    <div className="mb-8">
                        <h4 className="text-gray-900 font-semibold mb-4">Calendário</h4>

                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={prevMonth}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <ChevronRight size={16} className="text-gray-600 rotate-180" />
                            </button>

                            <div className="text-center">
                                <h5 className="text-lg font-semibold text-gray-900">
                                    {getMonthName(currentMonth)} {currentMonth.getFullYear()}
                                </h5>
                            </div>

                            <button
                                onClick={nextMonth}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <ChevronRight size={16} className="text-gray-600" />
                            </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                            {/* Days of week header */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar days */}
                            <div className="grid grid-cols-7 gap-1">
                                {getDaysInMonth(currentMonth).map((day, index) => {
                                    if (!day) {
                                        return <div key={index} className="w-10 h-10"></div>;
                                    }

                                    const today = getBrazilDate();
                                    today.setHours(0, 0, 0, 0); // Zerar horas para comparação correta
                                    const isToday = day.toDateString() === today.toDateString();
                                    const isPast = day < today; // Apenas dias anteriores ao hoje são considerados passados
                                    const isClosed = closedDays.includes(day.getDay()); // Verifica se o dia da semana está fechado
                                    const isSemHorarios = diasSemHorarios.includes(day.getDate()); // Dia sem horários disponíveis
                                    const isComHorarios = diasComHorarios.includes(day.getDate()); // Dia com horários disponíveis  
                                    const isFolgaTotal = diasFolgaTotal.includes(day.getDate()); // Dia com folga total
                                    const isSelected = selectedDate && day &&
                                        (typeof selectedDate === 'object' ?
                                            day.toDateString() === selectedDate.toDateString() :
                                            day.toDateString() === new Date(selectedDate).toDateString());
                                    const isDisabled = isPast || isClosed;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => !isDisabled && setSelectedDate(day)}
                                            disabled={isDisabled}
                                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors relative ${(isFolgaTotal || isSemHorarios) && !isSelected
                                                    ? 'bg-red-100 text-red-600 border border-red-300 hover:bg-red-200'
                                                    : isDisabled
                                                        ? 'text-gray-200 cursor-not-allowed bg-gray-50'
                                                        : isSelected
                                                            ? 'bg-primary text-white'
                                                            : isComHorarios && !isSelected
                                                                ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                                                                : isToday
                                                                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                                    : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                            title={isFolgaTotal ? 'Profissional de folga (dia todo)' : isClosed ? 'Fechado neste dia' : isSemHorarios ? 'Sem horários disponíveis' : isComHorarios ? 'Horários disponíveis' : ''}
                                        >
                                            {day.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Time Slots */}
                    {selectedDate && (
                        <div>
                            <h4 className="text-gray-900 font-semibold mb-4">Horários Disponíveis</h4>

                            {/* Loading Spinner */}
                            {loadingHorarios ? (
                                <LoadingSpinner />
                            ) : (
                                <>
                                    {/* Period Buttons - Apenas períodos disponíveis */}
                                    <div className="flex space-x-2 mb-6">
                                        {periodosDisponiveis.manha && (
                                            <button
                                                onClick={() => setSelectedPeriod('manha')}
                                                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${selectedPeriod === 'manha'
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                ☀️ Manhã
                                            </button>
                                        )}
                                        {periodosDisponiveis.tarde && (
                                            <button
                                                onClick={() => setSelectedPeriod('tarde')}
                                                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${selectedPeriod === 'tarde'
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                🌤️ Tarde
                                            </button>
                                        )}
                                        {periodosDisponiveis.noite && (
                                            <button
                                                onClick={() => setSelectedPeriod('noite')}
                                                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${selectedPeriod === 'noite'
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                🌙 Noite
                                            </button>
                                        )}
                                    </div>

                                    {/* Show only selected period times */}
                                    {selectedPeriod === 'manha' && horariosDisponiveis.manha.length > 0 && renderTimeSlots(horariosDisponiveis.manha)}
                                    {selectedPeriod === 'tarde' && horariosDisponiveis.tarde.length > 0 && renderTimeSlots(horariosDisponiveis.tarde)}
                                    {selectedPeriod === 'noite' && horariosDisponiveis.noite.length > 0 && renderTimeSlots(horariosDisponiveis.noite)}

                                    {/* Mensagem se não houver horários disponíveis */}
                                    {selectedPeriod && horariosDisponiveis[selectedPeriod]?.length === 0 && (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">Nenhum horário disponível para este período.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Continue Button */}
            {selectedDate && selectedTime && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-200">
                    <button
                        onClick={handleContinue}
                        className="w-full bg-primary text-white py-4 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                    >
                        Confirmar Agendamento
                    </button>
                </div>
            )}
        </div>
    );
};

export default SelectDateTime;

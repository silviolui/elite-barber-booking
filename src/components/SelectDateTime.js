import React, { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { supabaseData } from '../lib/supabaseData';

const SelectDateTime = ({ onClose, onSelect, professionalId, currentDate, currentTime, unitId, servicosSelecionados }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('manha');
  const [closedDays, setClosedDays] = useState([]);
  const [periodosDisponiveis, setPeriodosDisponiveis] = useState({ manha: false, tarde: false, noite: false });
  const [horariosDisponiveis, setHorariosDisponiveis] = useState({ manha: [], tarde: [], noite: [] });
  const [diasSemHorarios, setDiasSemHorarios] = useState([]); // Dias totalmente ocupados
  const [diasComHorarios, setDiasComHorarios] = useState([]); // Dias com horários disponíveis
  const [diasFolgaTotal, setDiasFolgaTotal] = useState([]); // Dias com folga total (vermelho escuro)

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
    const today = new Date();
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 1);
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    
    if (next < maxDate) {
      setCurrentMonth(next);
    }
  };

  const prevMonth = () => {
    const today = new Date();
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
          primeiroDia.toISOString().split('T')[0], 
          ultimoDia.toISOString().split('T')[0]
        );

        // Buscar folgas do profissional
        const mesAno = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}`;
        const datasComFolga = await supabaseData.getDatasfolga(professionalId, mesAno);
        
        // Analisar localmente quais dias estão ocupados e quais têm horários
        const diasOcupados = [];
        const diasDisponiveis = [];
        const diasComFolgaTotal = [];
        const diasDoMes = getDaysInMonth(currentMonth);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        for (const day of diasDoMes) {
          if (!day || closedDays.includes(day.getDay())) continue;
          
          const dataStr = day.toISOString().split('T')[0];
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

  // Carregar períodos e horários quando a data for selecionada
  useEffect(() => {
    const loadPeriodosDisponiveis = async () => {
      if (!unitId || !selectedDate) {
        console.log('❌ Faltam dados:', { unitId, selectedDate });
        return;
      }

      // VERIFICAR SE O DIA SELECIONADO ESTÁ SEM HORÁRIOS (ocupado ou folga total)
      const dataSelecionadaObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
      const diaDoMes = dataSelecionadaObj.getDate();
      
      if (diasSemHorarios.includes(diaDoMes) || diasFolgaTotal.includes(diaDoMes)) {
        console.log('❌ Dia selecionado sem horários (ocupado ou folga total), não carregando períodos');
        setPeriodosDisponiveis({ manha: false, tarde: false, noite: false });
        setHorariosDisponiveis({ manha: [], tarde: [], noite: [] });
        return;
      }
      
      try {
        console.log('🚀 Carregando períodos para:', { unitId, selectedDate });
        
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
        const periodos = await supabaseData.getPeriodosDisponiveis(unitId, dataObj);
        
        // Carregar horários para cada período disponível (verificando folgas por período)
        const horariosMap = { manha: [], tarde: [], noite: [] };
        const periodosComFolga = { manha: false, tarde: false, noite: false };
        
        // Verificar folgas por período
        for (const periodo of ['manha', 'tarde', 'noite']) {
          const estaDefolga = await supabaseData.profissionalEstaDefolguePeriodo(
            professionalId, 
            dataObj.toISOString().split('T')[0], 
            periodo
          );
          periodosComFolga[periodo] = estaDefolga;
          
          if (periodos[periodo] && !estaDefolga) {
            console.log(`🕐 Carregando horários para período: ${periodo}`);
            const horarios = await supabaseData.gerarHorariosDisponiveis(unitId, dataObj, periodo, professionalId, servicosSelecionados);
            horariosMap[periodo] = horarios;
            console.log(`✅ Horários para ${periodo}:`, horarios);
          } else if (estaDefolga) {
            console.log(`❌ Profissional de folga no período: ${periodo}`);
            periodos[periodo] = false; // Desabilitar período de folga
          }
        }
        
        setHorariosDisponiveis(horariosMap);
        setPeriodosDisponiveis(periodos); // Atualizar períodos após verificar folgas
        
        // Se o período selecionado não está disponível, mudar para o primeiro disponível
        if (!periodos[selectedPeriod]) {
          console.log(`🔄 Período ${selectedPeriod} não disponível, mudando...`);
          if (periodos.manha) setSelectedPeriod('manha');
          else if (periodos.tarde) setSelectedPeriod('tarde');
          else if (periodos.noite) setSelectedPeriod('noite');
        }
        
        console.log('📋 Resumo final:', {
          periodos,
          horariosMap,
          selectedPeriod
        });
      } catch (error) {
        console.error('Erro ao carregar períodos disponíveis:', error);
      }
    };

    loadPeriodosDisponiveis();
  }, [unitId, selectedDate, selectedPeriod, professionalId, servicosSelecionados, diasSemHorarios, diasFolgaTotal]);

  // Set initial selections if provided
  useEffect(() => {
    if (currentDate && currentTime) {
      setSelectedDate(currentDate);
      setSelectedTime(currentTime);
    }
  }, [currentDate, currentTime]);

  // Horários agora são carregados dinamicamente da base de dados

  const renderTimeSlots = (times, title, icon) => (
    <div className="mb-6">
      <div className="flex items-center mb-3">
        <span className="text-lg mr-2">{icon}</span>
        <h5 className="text-gray-900 font-semibold">{title}</h5>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {times.map(time => (
          <button
            key={time}
            onClick={() => setSelectedTime(time)}
            className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${
              selectedTime === time
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
      onSelect(selectedDate, selectedTime);
      onClose();
    }
  };

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

                  const today = new Date();
                  const isToday = day.toDateString() === today.toDateString();
                  const isPast = day < today;
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
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors relative ${
                        (isFolgaTotal || isSemHorarios) && !isSelected
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
              
              {/* Period Buttons - Apenas períodos disponíveis */}
              <div className="flex space-x-2 mb-6">
                {periodosDisponiveis.manha && (
                  <button
                    onClick={() => setSelectedPeriod('manha')}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                      selectedPeriod === 'manha'
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
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                      selectedPeriod === 'tarde'
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
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                      selectedPeriod === 'noite'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🌙 Noite
                  </button>
                )}
              </div>

              {/* Show only selected period times */}
              {selectedPeriod === 'manha' && horariosDisponiveis.manha.length > 0 && renderTimeSlots(horariosDisponiveis.manha, 'Manhã', '☀️')}
              {selectedPeriod === 'tarde' && horariosDisponiveis.tarde.length > 0 && renderTimeSlots(horariosDisponiveis.tarde, 'Tarde', '🌤️')}
              {selectedPeriod === 'noite' && horariosDisponiveis.noite.length > 0 && renderTimeSlots(horariosDisponiveis.noite, 'Noite', '🌙')}

              {/* Mensagem se não houver horários disponíveis */}
              {selectedPeriod && horariosDisponiveis[selectedPeriod]?.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum horário disponível para este período.</p>
                </div>
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

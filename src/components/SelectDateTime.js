import React, { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { supabaseData } from '../lib/supabaseData';

const SelectDateTime = ({ onClose, onSelect, professionalId, currentDate, currentTime, unitId }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('manha');
  const [closedDays, setClosedDays] = useState([]);
  const [periodosDisponiveis, setPeriodosDisponiveis] = useState({ manha: false, tarde: false, noite: false });
  const [horariosDisponiveis, setHorariosDisponiveis] = useState({ manha: [], tarde: [], noite: [] });

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

  // Carregar períodos e horários quando a data for selecionada
  useEffect(() => {
    const loadPeriodosDisponiveis = async () => {
      if (!unitId || !selectedDate) {
        console.log('❌ Faltam dados:', { unitId, selectedDate });
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
        setPeriodosDisponiveis(periodos);
        
        // Carregar horários para cada período disponível
        const horariosMap = { manha: [], tarde: [], noite: [] };
        
        for (const periodo of ['manha', 'tarde', 'noite']) {
          if (periodos[periodo]) {
            console.log(`🕐 Carregando horários para período: ${periodo}`);
            const horarios = await supabaseData.gerarHorariosDisponiveis(unitId, dataObj, periodo);
            horariosMap[periodo] = horarios;
            console.log(`✅ Horários para ${periodo}:`, horarios);
          }
        }
        
        setHorariosDisponiveis(horariosMap);
        
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
  }, [unitId, selectedDate, selectedPeriod]);

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
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        isDisabled
                          ? 'text-gray-200 cursor-not-allowed bg-gray-50'
                          : isSelected
                          ? 'bg-primary text-white'
                          : isToday
                          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      title={isClosed ? 'Fechado neste dia' : ''}
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

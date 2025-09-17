import React, { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

const SelectDateTime = ({ onClose, onSelect, professionalId, currentDate, currentTime }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('morning');

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
  
  // Set initial selections if provided
  useEffect(() => {
    if (currentDate && currentTime) {
      setSelectedDate(currentDate);
      setSelectedTime(currentTime);
    }
  }, [currentDate, currentTime]);

  // Horários disponíveis por período
  const timeSlots = {
    morning: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
    afternoon: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
    evening: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30']
  };

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
    <div className="fixed inset-0 bg-white z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-gray-900 text-xl font-semibold">Agendar Horário</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
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
                  const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

                  return (
                    <button
                      key={index}
                      onClick={() => !isPast && setSelectedDate(day)}
                      disabled={isPast}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        isPast 
                          ? 'text-gray-300 cursor-not-allowed'
                          : isSelected
                          ? 'bg-primary text-white'
                          : isToday
                          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
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
              
              {/* Period Buttons */}
              <div className="flex space-x-2 mb-6">
                <button
                  onClick={() => setSelectedPeriod('morning')}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                    selectedPeriod === 'morning'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ☀️ Manhã
                </button>
                <button
                  onClick={() => setSelectedPeriod('afternoon')}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                    selectedPeriod === 'afternoon'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🌤️ Tarde
                </button>
                <button
                  onClick={() => setSelectedPeriod('evening')}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                    selectedPeriod === 'evening'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🌙 Noite
                </button>
              </div>

              {/* Show only selected period times */}
              {selectedPeriod === 'morning' && renderTimeSlots(timeSlots.morning, 'Manhã', '☀️')}
              {selectedPeriod === 'afternoon' && renderTimeSlots(timeSlots.afternoon, 'Tarde', '🌤️')}
              {selectedPeriod === 'evening' && renderTimeSlots(timeSlots.evening, 'Noite', '🌙')}
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

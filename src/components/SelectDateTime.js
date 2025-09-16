import React, { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

const SelectDateTime = ({ onClose, onSelect, professionalId, currentDate, currentTime }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(0);
  
  // Set initial selections if provided
  useEffect(() => {
    if (currentDate && currentTime) {
      // Convert currentDate back to YYYY-MM-DD format for calendar
      const today = new Date();
      let targetDate = null;
      
      // Generate dates to find matching date
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const day = date.getDate();
        const month = date.toLocaleString('pt-BR', { month: 'short' });
        const formattedDate = `${day} ${month}`;
        
        if (formattedDate === currentDate) {
          targetDate = date.toISOString().split('T')[0];
          break;
        }
      }
      
      if (targetDate) {
        setSelectedDate(targetDate);
      }
      setSelectedTime(currentTime);
    }
  }, [currentDate, currentTime]);
  
  // Generate weeks
  const generateWeeks = () => {
    const weeks = [];
    const today = new Date();
    
    for (let w = 0; w < 4; w++) {
      const weekDates = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() + (w * 7) + d);
        
        weekDates.push({
          date: date.toISOString().split('T')[0],
          day: date.getDate(),
          month: date.toLocaleString('pt-BR', { month: 'short' }),
          weekDay: date.toLocaleString('pt-BR', { weekday: 'short' }),
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
          isToday: date.toDateString() === today.toDateString()
        });
      }
      weeks.push(weekDates);
    }
    
    return weeks;
  };

  const weeks = generateWeeks();
  
  // Mock available times
  const timeSlots = {
    morning: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
    afternoon: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'],
    evening: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00']
  };

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      const dateObj = weeks.flat().find(d => d.date === selectedDate);
      const formattedDate = `${dateObj.day} ${dateObj.month}`;
      onSelect(formattedDate, selectedTime);
      onClose();
    }
  };

  const renderTimeSlots = (period, slots, icon) => (
    <div className="mb-6">
      <div className="flex items-center mb-3">
        {icon}
        <h4 className="text-lg font-semibold ml-2 text-gray-900">{period}</h4>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {slots.map((time) => (
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
          <p className="text-gray-600">Escolha o melhor dia e horário</p>
        </div>

        <div className="pb-24">
          {/* Calendar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Calendário</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
                  disabled={currentWeek === 0}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    currentWeek === 0
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ChevronRight size={16} className="rotate-180" />
                </button>
                <button
                  onClick={() => setCurrentWeek(Math.min(3, currentWeek + 1))}
                  disabled={currentWeek === 3}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    currentWeek === 3
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {weeks[currentWeek].map((date) => (
                <button
                  key={date.date}
                  onClick={() => setSelectedDate(date.date)}
                  disabled={date.isWeekend}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedDate === date.date
                      ? 'bg-primary text-white shadow-lg'
                      : date.isWeekend
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : date.isToday
                      ? 'bg-orange-50 text-primary border-2 border-primary'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200'
                  }`}
                >
                  <div className="text-xs mb-1 font-medium">{date.weekDay}</div>
                  <div className="font-bold text-sm">{date.day}</div>
                  <div className="text-xs font-medium">{date.month}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <h4 className="text-lg font-semibold mb-6 text-gray-900">Horários Disponíveis</h4>
              
              {renderTimeSlots('Manhã', timeSlots.morning, 
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              )}
              
              {renderTimeSlots('Tarde', timeSlots.afternoon,
                <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              )}
              
              {renderTimeSlots('Noite', timeSlots.evening,
                <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
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
            className="w-full py-4 rounded-2xl font-semibold text-lg bg-primary text-white hover:bg-orange-600 transition-colors"
          >
            Confirmar para {weeks.flat().find(d => d.date === selectedDate)?.day} {weeks.flat().find(d => d.date === selectedDate)?.month} às {selectedTime}
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectDateTime;
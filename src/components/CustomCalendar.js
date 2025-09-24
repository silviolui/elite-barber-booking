import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getBrazilDate } from '../utils/timezone';

const CustomCalendar = ({ selectedDate, onDateSelect, onClose }) => {
  const [currentDate, setCurrentDate] = useState(getBrazilDate());
  const calendarRef = useRef(null);

  // Fechar calendário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    onDateSelect(selectedDate);
    onClose();
  };

  const isToday = (day) => {
    const today = getBrazilDate();
    return today.getDate() === day &&
           today.getMonth() === currentDate.getMonth() &&
           today.getFullYear() === currentDate.getFullYear();
  };

  const isSelectedDate = (day) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day &&
           selectedDate.getMonth() === currentDate.getMonth() &&
           selectedDate.getFullYear() === currentDate.getFullYear();
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Dias vazios do mês anterior
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const isCurrentDay = isToday(day);
      const isSelected = isSelectedDate(day);
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`
            h-10 w-10 rounded-lg text-sm font-medium transition-colors duration-200
            hover:bg-blue-100 hover:text-blue-600 
            ${isCurrentDay ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-gray-700'}
            ${isSelected ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}
            ${isSelected && isCurrentDay ? 'bg-gradient-to-r from-blue-500 to-orange-500' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={calendarRef}
        className="bg-white rounded-xl shadow-2xl p-6 w-80 border border-gray-200"
      >
        {/* Header do Calendário */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="text-blue-500" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">Selecionar Data</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Navegação Mês/Ano */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-800">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>
          </div>
          
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Dias da Semana */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {weekDays.map(day => (
            <div key={day} className="h-10 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-500">{day}</span>
            </div>
          ))}
        </div>

        {/* Dias do Calendário */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {renderCalendarDays()}
        </div>

        {/* Botões de Ação */}
        <div className="flex space-x-3">
          <button
            onClick={() => {
              onDateSelect(null);
              onClose();
            }}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Limpar Filtro
          </button>
          <button
            onClick={() => {
              onDateSelect(new Date());
              onClose();
            }}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Hoje
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomCalendar;

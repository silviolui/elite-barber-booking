import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { getBrazilDate, toBrazilDate, formatDateBR, dateToStringBrazil, parseDateStringToBrazil } from '../utils/timezone';

const CustomDatePicker = ({
    value,
    onChange,
    placeholder = "Selecione uma data",
    className = "",
    disabled = false,
    minDate = null,
    maxDate = null
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(getBrazilDate());
    const [selectedDate, setSelectedDate] = useState(value ? parseDateStringToBrazil(value) : null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (value) {
            const date = parseDateStringToBrazil(value);
            setSelectedDate(date);
            setCurrentDate(date);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

    const handleDateSelect = (date) => {
        if (!date || disabled) return;

        // Verificar limites de data
        if (minDate && date < minDate) return;
        if (maxDate && date > maxDate) return;

        setSelectedDate(date);
        const dateString = dateToStringBrazil(date);
        onChange(dateString);
        setIsOpen(false);
    };

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const formatDisplayDate = (date) => {
        if (!date) return '';
        return formatDateBR(date);
    };

    const isDateDisabled = (date) => {
        if (!date) return true;
        if (minDate && date < minDate) return true;
        if (maxDate && date > maxDate) return true;
        return false;
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = getBrazilDate();
        return toBrazilDate(date).toDateString() === today.toDateString();
    };

    const isSelected = (date) => {
        if (!date || !selectedDate) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const clearDate = (e) => {
        e.stopPropagation();
        setSelectedDate(null);
        onChange('');
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Input Display */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
          flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg 
          bg-white cursor-pointer transition-colors
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent'}
          ${isOpen ? 'ring-2 ring-orange-500 border-transparent' : ''}
        `}
            >
                <div className="flex items-center space-x-2">
                    <Calendar size={16} className={disabled ? 'text-gray-400' : 'text-gray-500'} />
                    <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
                    </span>
                </div>

                <div className="flex items-center space-x-1">
                    {selectedDate && !disabled && (
                        <button
                            onClick={clearDate}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X size={14} className="text-gray-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Calendar Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-[300px]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={16} className="text-gray-600" />
                        </button>

                        <h3 className="font-semibold text-gray-900">
                            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h3>

                        <button
                            onClick={() => navigateMonth(1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronRight size={16} className="text-gray-600" />
                        </button>
                    </div>

                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {daysOfWeek.map(day => (
                            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-1">
                        {getDaysInMonth(currentDate).map((date, index) => {
                            if (!date) {
                                return <div key={index} className="w-8 h-8"></div>;
                            }

                            const disabled = isDateDisabled(date);
                            const today = isToday(date);
                            const selected = isSelected(date);

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleDateSelect(date)}
                                    disabled={disabled}
                                    className={`
                    w-8 h-8 text-sm rounded-lg transition-colors
                    ${disabled
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : selected
                                                ? 'bg-orange-500 text-white font-semibold'
                                                : today
                                                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                        }
                  `}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    {/* Today button */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        <button
                            onClick={() => {
                                const today = getBrazilDate();
                                handleDateSelect(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
                            }}
                            className="w-full text-center py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                            Hoje
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;

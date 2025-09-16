import React, { useState } from 'react';
import { ChevronRight, MapPin, User, Scissors, Calendar } from 'lucide-react';

const BookingHome = ({ onNext }) => {
  const [selectedStep, setSelectedStep] = useState(null);

  const handleStepClick = (step) => {
    setSelectedStep(step);
    onNext(step);
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-6 py-4 flex items-center">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-gray-900 text-xl font-bold">BookIA</h1>
            <p className="text-gray-500 text-xs">Agendamento Inteligente</p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-6 pt-8 pb-24">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-gray-900 text-3xl font-bold mb-4">Agende seu horário</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Escolha os serviços que desejar e agende no melhor horário para você
          </p>
        </div>
        {/* Booking Steps */}
        <div className="space-y-4">
          <button
            onClick={() => handleStepClick('unidade')}
            className="w-full bg-white rounded-2xl p-6 flex items-center justify-between hover:shadow-md transition-all shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-xl flex items-center justify-center">
                <MapPin size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <span className="text-gray-900 text-lg font-semibold block">Selecionar unidade</span>
                <span className="text-gray-500 text-sm">Escolha a barbearia</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          
          <button
            onClick={() => handleStepClick('barbeiro')}
            className="w-full bg-white rounded-2xl p-6 flex items-center justify-between hover:shadow-md transition-all shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-xl flex items-center justify-center">
                <User size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <span className="text-gray-900 text-lg font-semibold block">Selecionar barbeiro</span>
                <span className="text-gray-500 text-sm">Escolha seu profissional</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          
          <button
            onClick={() => handleStepClick('servico')}
            className="w-full bg-white rounded-2xl p-6 flex items-center justify-between hover:shadow-md transition-all shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-xl flex items-center justify-center">
                <Scissors size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <span className="text-gray-900 text-lg font-semibold block">Selecionar serviços</span>
                <span className="text-gray-500 text-sm">Escolha os procedimentos</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          
          <button
            onClick={() => handleStepClick('data')}
            className="w-full bg-white rounded-2xl p-6 flex items-center justify-between hover:shadow-md transition-all shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <span className="text-gray-900 text-lg font-semibold block">Data e horário</span>
                <span className="text-gray-500 text-sm">Quando você prefere</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>
        
        {/* Schedule Button */}
        <button className="w-full bg-gray-200 text-gray-400 rounded-2xl py-4 mt-8 font-semibold cursor-not-allowed">
          Finalizar Agendamento
        </button>
      </div>
    </div>
  );
};

export default BookingHome;

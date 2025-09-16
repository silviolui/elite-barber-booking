import React from 'react';
import { ChevronRight, MapPin, User, Scissors, Calendar } from 'lucide-react';

const BookingHome = ({ onNext }) => {
  const handleStepClick = (step) => {
    onNext(step);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-gray-900 text-lg font-bold">BookIA</h1>
              <p className="text-gray-500 text-xs">Agendamento</p>
            </div>
          </div>
          
          {/* Profile */}
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-6 pt-8 pb-24">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-gray-900 text-2xl font-bold mb-2">Agende seu horário</h2>
          <p className="text-gray-600 text-base">
            Escolha os serviços que desejar e agende no melhor horário para você
          </p>
        </div>
        {/* Booking Steps - Clean Cards */}
        <div className="space-y-4">
          <button
            onClick={() => handleStepClick('unidade')}
            className="w-full bg-white rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <MapPin size={20} className="text-pink-600" />
              </div>
              <div className="text-left">
                <div className="text-gray-900 text-base font-semibold">Selecionar unidade</div>
                <div className="text-gray-500 text-sm">Escolha a barbearia</div>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          
          <button
            onClick={() => handleStepClick('barbeiro')}
            className="w-full bg-white rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
              <div className="text-left">
                <div className="text-gray-900 text-base font-semibold">Selecionar barbeiro</div>
                <div className="text-gray-500 text-sm">Escolha seu profissional</div>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          
          <button
            onClick={() => handleStepClick('servico')}
            className="w-full bg-white rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Scissors size={20} className="text-orange-600" />
              </div>
              <div className="text-left">
                <div className="text-gray-900 text-base font-semibold">Selecionar serviços</div>
                <div className="text-gray-500 text-sm">Escolha os procedimentos</div>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          
          <button
            onClick={() => handleStepClick('data')}
            className="w-full bg-white rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-green-600" />
              </div>
              <div className="text-left">
                <div className="text-gray-900 text-base font-semibold">Data e horário</div>
                <div className="text-gray-500 text-sm">Quando você prefere</div>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>
        
        {/* CTA Button */}
        <button className="w-full bg-gray-200 text-gray-400 rounded-2xl py-4 mt-8 font-semibold cursor-not-allowed">
          Finalizar Agendamento
        </button>
      </div>
    </div>
  );
};

export default BookingHome;

import React from 'react';
import { ChevronRight, MapPin, User, Scissors, Calendar } from 'lucide-react';

const BookingHome = ({ onNext }) => {
  const handleStepClick = (step) => {
    onNext(step);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-purple-600/20"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl animate-float"></div>
      </div>

      {/* Header Premium */}
      <div className="relative z-10">
        <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
          <div className="px-6 py-6 flex items-center">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-tr from-primary via-orange-500 to-yellow-400 rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                <svg className="w-7 h-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full shadow-lg animate-ping"></div>
            </div>
            <div>
              <h1 className="text-white text-xl font-bold drop-shadow-lg">BookIA</h1>
              <p className="text-white/70 text-sm font-medium">Agendamento Inteligente</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 px-6 pt-12 pb-28">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-white text-4xl font-bold mb-4 drop-shadow-lg tracking-tight">
            Agende seu horário
          </h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-md mx-auto drop-shadow">
            Escolha os serviços que desejar e agende no melhor horário para você
          </p>
          
          {/* Stats */}
          <div className="flex justify-center space-x-8 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary drop-shadow">50k+</div>
              <div className="text-white/60 text-xs">Agendamentos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary drop-shadow">4.9★</div>
              <div className="text-white/60 text-xs">Avaliação</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary drop-shadow">200+</div>
              <div className="text-white/60 text-xs">Barbearias</div>
            </div>
          </div>
        </div>
        {/* Booking Steps - Premium Cards */}
        <div className="space-y-5">
          <div
            onClick={() => handleStepClick('unidade')}
            className="group relative overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-7 cursor-pointer hover:bg-white/15 hover:border-white/30 hover:scale-105 transition-all duration-300 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-5">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-tr from-red-500 via-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <MapPin size={24} className="text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full shadow-lg"></div>
                </div>
                <div className="text-left">
                  <span className="text-white text-xl font-bold block drop-shadow">Selecionar unidade</span>
                  <span className="text-white/70 text-sm font-medium">Escolha a barbearia</span>
                </div>
              </div>
              <ChevronRight size={24} className="text-white/60 group-hover:text-white transition-colors" />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-purple-600/20 rounded-full blur-xl"></div>
          </div>
          
          <div
            onClick={() => handleStepClick('barbeiro')}
            className="group relative overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-7 cursor-pointer hover:bg-white/15 hover:border-white/30 hover:scale-105 transition-all duration-300 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-5">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 via-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <User size={24} className="text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full shadow-lg"></div>
                </div>
                <div className="text-left">
                  <span className="text-white text-xl font-bold block drop-shadow">Selecionar barbeiro</span>
                  <span className="text-white/70 text-sm font-medium">Escolha seu profissional</span>
                </div>
              </div>
              <ChevronRight size={24} className="text-white/60 group-hover:text-white transition-colors" />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-teal-600/20 rounded-full blur-xl"></div>
          </div>
          
          <div
            onClick={() => handleStepClick('servico')}
            className="group relative overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-7 cursor-pointer hover:bg-white/15 hover:border-white/30 hover:scale-105 transition-all duration-300 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-5">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <Scissors size={24} className="text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-400 rounded-full shadow-lg"></div>
                </div>
                <div className="text-left">
                  <span className="text-white text-xl font-bold block drop-shadow">Selecionar serviços</span>
                  <span className="text-white/70 text-sm font-medium">Escolha os procedimentos</span>
                </div>
              </div>
              <ChevronRight size={24} className="text-white/60 group-hover:text-white transition-colors" />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-orange-400/20 to-red-600/20 rounded-full blur-xl"></div>
          </div>
          
          <div
            onClick={() => handleStepClick('data')}
            className="group relative overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-7 cursor-pointer hover:bg-white/15 hover:border-white/30 hover:scale-105 transition-all duration-300 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-5">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 via-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Calendar size={24} className="text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-400 rounded-full shadow-lg"></div>
                </div>
                <div className="text-left">
                  <span className="text-white text-xl font-bold block drop-shadow">Data e horário</span>
                  <span className="text-white/70 text-sm font-medium">Quando você prefere</span>
                </div>
              </div>
              <ChevronRight size={24} className="text-white/60 group-hover:text-white transition-colors" />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-teal-600/20 rounded-full blur-xl"></div>
          </div>
        </div>
        
        {/* CTA Button */}
        <div className="mt-12">
          <div className="relative">
            <button className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white/60 rounded-3xl py-5 font-bold text-lg cursor-not-allowed shadow-xl">
              Finalizar Agendamento
            </button>
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-orange-500 to-yellow-400 rounded-3xl opacity-30 blur-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingHome;

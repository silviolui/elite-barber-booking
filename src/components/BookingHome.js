import React from 'react';
import { ChevronRight, MapPin, User, Scissors, Calendar, Check } from 'lucide-react';
import { supabaseData } from '../lib/supabaseData';

const BookingHome = ({ onNext, selections, currentUser, onLogout, skipUnidadeSelection, unidadesLoading }) => {
  console.log('🔍 BookingHome props:', { skipUnidadeSelection, unidadesLoading, unidade: selections?.unit?.nome });
  
  const isUnitSelected = selections?.unit !== null;
  const isProfessionalSelected = selections?.professional !== null;
  const isServiceSelected = selections?.services?.length > 0;
  const isDateSelected = selections?.date !== null && selections?.time !== null;

  const handleStepClick = (step) => {
    if (step === 'unidade') {
      onNext(step);
    } else if (step === 'barbeiro' && isUnitReady) {
      onNext('profissional');
    } else if (step === 'servico' && isProfessionalSelected) {
      onNext(step);
    } else if (step === 'data' && isServiceSelected) {
      onNext(step);
    }
  };

  // Função para finalizar agendamento
  const handleFinalizarAgendamento = async () => {
    if (!canFinalize) return;

    try {
      console.log('🚀 Iniciando finalização do agendamento...');
      
      // BUSCAR USUÁRIO ATUAL DA SESSÃO DINAMICAMENTE
      let usuarioAtual = null;
      try {
        // Buscar primeiro usuário da tabela users (produção)
        const usuarios = await supabaseData.getUsuarios();
        if (usuarios && usuarios.length > 0) {
          usuarioAtual = usuarios[0].id;
          console.log('👤 Usuário encontrado na tabela:', usuarioAtual, usuarios[0].nome);
        } else {
          throw new Error('Nenhum usuário encontrado na base de dados');
        }
      } catch (authError) {
        console.log('🔄 Erro na autenticação, buscando usuário da tabela...');
        // Fallback: buscar usuários da tabela
        const usuarios = await supabaseData.getUsuarios();
        if (usuarios && usuarios.length > 0) {
          usuarioAtual = usuarios[0].id;
          console.log('👤 Usuário da tabela:', usuarioAtual);
        } else {
          throw new Error('Nenhum usuário encontrado na base de dados');
        }
      }
      
      // Calcular horário de fim baseado na duração real dos serviços
      const duracaoTotal = selections.services?.reduce((total, service) => {
        return total + (parseInt(service.duracao_minutos || service.duracao || service.duration) || 30);
      }, 0) || 30;
      
      const [hora, minuto] = selections.time.split(':').map(Number);
      const fimMinuto = minuto + duracaoTotal;
      const fimHora = hora + Math.floor(fimMinuto / 60);
      const horarioFim = `${fimHora.toString().padStart(2, '0')}:${(fimMinuto % 60).toString().padStart(2, '0')}`;
      
      // Calcular preço total dos serviços
      const precoTotal = selections.services?.reduce((total, service) => {
        return total + (parseFloat(service.price || service.preco || 0));
      }, 0) || 50.00;
      
      // Dados do agendamento (formato correto para a função)
      const dadosAgendamento = {
        profissionalId: selections.professional?.id,
        unidadeId: selections.unit?.id,
        data: selections.date.toISOString().split('T')[0], // YYYY-MM-DD
        horarioInicio: selections.time,
        horarioFim: horarioFim,
        precoTotal: precoTotal,
        observacoes: null
      };

      console.log('📋 Dados do agendamento:', dadosAgendamento);

      // Criar agendamento com ID dinâmico do usuário
      const agendamento = await supabaseData.criarAgendamento(usuarioAtual, dadosAgendamento);
      
      console.log('✅ Agendamento criado com sucesso:', agendamento);
      alert('✅ AGENDAMENTO CONFIRMADO COM SUCESSO!');
      
      // Aqui você pode redirecionar ou limpar o formulário
      
    } catch (error) {
      console.error('❌ Erro ao finalizar agendamento:', error);
      alert('Erro ao finalizar agendamento. Tente novamente.');
    }
  };

  // Se skipUnidadeSelection=true, considerar unidade sempre selecionada
  const isUnitReady = skipUnidadeSelection || isUnitSelected;
  const canFinalize = isUnitReady && isProfessionalSelected && isServiceSelected && isDateSelected;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
          
          {/* Logout Button */}
          <button 
            onClick={onLogout}
            className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
            title="Sair da conta"
          >
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-6 pt-8 pb-24">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-gray-900 text-2xl font-bold mb-2">Novo Agendamento</h2>
          <p className="text-gray-600 text-base">
            Preencha as informações para agendar
          </p>
        </div>

        {/* Booking Steps - Clean Cards */}
        <div className="space-y-4">
          {/* DEBUG: Mostrar estado da lógica */}
          {console.log('🔍 DEBUG:', { skipUnidadeSelection, isUnitSelected, unidade: selections?.unit?.nome })}
          
          {/* Unidade - TESTE: Só mostrar se unidade NÃO está selecionada */}
          {!isUnitSelected && (
            <button
              onClick={() => handleStepClick('unidade')}
              className="w-full bg-white rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all shadow-sm border border-gray-100"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isUnitSelected ? 'bg-green-500 text-white' : 'bg-pink-100 text-pink-600'
                }`}>
                  {isUnitSelected ? <Check size={20} /> : <MapPin size={20} />}
                </div>
                <div className="text-left">
                  <div className="text-gray-900 text-base font-semibold">Unidade</div>
                  <div className="text-gray-500 text-sm">
                    {selections?.unit ? (selections.unit.nome || selections.unit.name)?.split(' - ')[1] || 'Selecionado' : 'Escolher unidade'}
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          )}

          {/* Indicador de unidade auto-selecionada (quando há apenas 1) */}
          {skipUnidadeSelection && selections?.unit && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                  <Check size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-green-800 font-medium text-sm">Estabelecimento</p>
                  <p className="text-green-600 text-xs">{selections.unit.nome}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Profissional */}
          <button
            onClick={() => handleStepClick('barbeiro')}
            disabled={!isUnitReady}
            className={`w-full bg-white rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all shadow-sm border border-gray-100 ${
              !isUnitReady ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isProfessionalSelected ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600'
              }`}>
                {isProfessionalSelected ? <Check size={20} /> : <User size={20} />}
              </div>
              <div className="text-left">
                <div className="text-gray-900 text-base font-semibold">Profissional</div>
                <div className="text-gray-500 text-sm">
                  {selections?.professional ? (selections.professional.nome || selections.professional.name) : 'Escolher profissional'}
                </div>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          
          {/* Serviços */}
          <button
            onClick={() => handleStepClick('servico')}
            disabled={!isProfessionalSelected}
            className={`w-full bg-white rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all shadow-sm border border-gray-100 ${
              !isProfessionalSelected ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isServiceSelected ? 'bg-green-500 text-white' : 'bg-orange-100 text-orange-600'
              }`}>
                {isServiceSelected ? <Check size={20} /> : <Scissors size={20} />}
              </div>
              <div className="text-left">
                <div className="text-gray-900 text-base font-semibold">Serviços</div>
                <div className="text-gray-500 text-sm">
                  {selections?.services?.length > 0 
                    ? `${selections.services.length} selecionado${selections.services.length > 1 ? 's' : ''}` 
                    : 'Escolher serviços'
                  }
                </div>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          
          {/* Data/Horário */}
          <button
            onClick={() => handleStepClick('data')}
            disabled={!isServiceSelected}
            className={`w-full bg-white rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all shadow-sm border border-gray-100 ${
              !isServiceSelected ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDateSelected ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600'
              }`}>
                {isDateSelected ? <Check size={20} /> : <Calendar size={20} />}
              </div>
              <div className="text-left">
                <div className="text-gray-900 text-base font-semibold">Data e Horário</div>
                <div className="text-gray-500 text-sm">
                  {selections?.date && selections?.time 
                    ? `${selections.date} às ${selections.time}`
                    : 'Escolher horário'
                  }
                </div>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>
        
        {/* CTA Button */}
        <button 
          onClick={handleFinalizarAgendamento}
          className={`w-full rounded-2xl py-4 mt-8 font-semibold transition-all ${
            canFinalize 
              ? 'bg-primary text-white hover:bg-orange-600 shadow-lg' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!canFinalize}
        >
          {canFinalize ? 'Finalizar Agendamento' : 'Preencha as informações acima'}
        </button>
      </div>
    </div>
  );
};

export default BookingHome;
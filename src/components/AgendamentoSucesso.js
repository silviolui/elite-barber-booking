import React from 'react';
import { Check } from 'lucide-react';

const AgendamentoSucesso = ({ dadosAgendamento, onVoltar }) => {
  // Formatar data por extenso
  const formatarData = (dataStr) => {
    const data = new Date(dataStr);
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    const diaSemana = diasSemana[data.getDay()];
    const dia = data.getDate();
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();
    
    return `${diaSemana}, ${dia} de ${mes} de ${ano}`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-green-500 to-green-600 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-green-400 px-6 py-4 flex items-center justify-center">
        <div className="flex items-center">
          <div className="mr-2">📱</div>
          <span className="text-white font-medium">Agendamento criado com sucesso</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-8">
          <Check size={40} className="text-green-500" />
        </div>

        {/* Title */}
        <h1 className="text-white text-3xl font-bold mb-4">
          Agendamento realizado<br />
          Com sucesso!
        </h1>

        {/* Subtitle */}
        <p className="text-white/90 text-lg mb-12 leading-relaxed">
          Seu horário na {dadosAgendamento.nomeEmpresa} - {dadosAgendamento.nomeUnidade} está confirmado. 
          Você deverá receber detalhes no seu email em breve.
        </p>

        {/* Details */}
        <div className="w-full max-w-sm space-y-6">
          {/* Unidade */}
          <div className="border-b border-white/20 pb-4">
            <div className="flex justify-between items-center">
              <div className="text-left">
                <p className="text-white font-medium">Unidade</p>
                <p className="text-white/80 text-sm">{dadosAgendamento.nomeEmpresa} - {dadosAgendamento.nomeUnidade}</p>
              </div>
              <button className="text-white/60 text-sm hover:text-white">
                Ver localização
              </button>
            </div>
          </div>

          {/* Data */}
          <div className="border-b border-white/20 pb-4">
            <p className="text-white font-medium">Data</p>
            <p className="text-white/80">{formatarData(dadosAgendamento.dataAgendamento)}</p>
          </div>

          {/* Horário */}
          <div className="border-b border-white/20 pb-4">
            <p className="text-white font-medium">Horário</p>
            <p className="text-white/80">{dadosAgendamento.horarioInicio}</p>
          </div>

          {/* Colaborador */}
          <div className="border-b border-white/20 pb-4">
            <p className="text-white font-medium">Colaborador</p>
            <p className="text-white/80">{dadosAgendamento.nomeProfissional}</p>
          </div>

          {/* Serviços */}
          <div className="border-b border-white/20 pb-4">
            <p className="text-white font-medium">Serviços</p>
            <p className="text-white/80">{dadosAgendamento.nomeServico}</p>
          </div>
        </div>
      </div>

      {/* Footer Button */}
      <div className="px-6 pb-8">
        <button
          onClick={onVoltar}
          className="w-full bg-white text-green-600 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
};

export default AgendamentoSucesso;

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-green-500 px-6 py-4 flex items-center justify-center rounded-t-3xl">
          <div className="flex items-center">
            <div className="mr-2">📱</div>
            <span className="text-white font-medium">Agendamento criado com sucesso</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Check size={40} className="text-white" />
          </div>

          {/* Title */}
          <h1 className="text-gray-900 text-2xl font-bold mb-4 text-center">
            Agendamento realizado<br />
            <span className="text-orange-500">Com sucesso!</span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-700 text-base mb-8 text-center leading-relaxed">
            Seu horário na {dadosAgendamento.nomeEmpresa} - {dadosAgendamento.nomeUnidade} está confirmado. 
            Você deverá receber detalhes no seu email em breve.
          </p>

          {/* Details */}
          <div className="space-y-4">
            {/* Unidade */}
            <div className="border-b border-gray-200 pb-3">
              <div className="text-left">
                <p className="text-gray-900 font-medium mb-1">Unidade</p>
                <p className="text-gray-700 text-sm">{dadosAgendamento.nomeEmpresa} - {dadosAgendamento.nomeUnidade}</p>
                <button className="text-orange-500 text-sm hover:text-orange-600 mt-1">
                  Ver localização
                </button>
              </div>
            </div>

            {/* Data */}
            <div className="border-b border-gray-200 pb-3">
              <div className="text-left">
                <p className="text-gray-900 font-medium mb-1">Data</p>
                <p className="text-gray-700">{formatarData(dadosAgendamento.dataAgendamento)}</p>
              </div>
            </div>

            {/* Horário */}
            <div className="border-b border-gray-200 pb-3">
              <div className="text-left">
                <p className="text-gray-900 font-medium mb-1">Horário</p>
                <p className="text-gray-700">{dadosAgendamento.horarioInicio}</p>
              </div>
            </div>

            {/* Colaborador */}
            <div className="border-b border-gray-200 pb-3">
              <div className="text-left">
                <p className="text-gray-900 font-medium mb-1">Colaborador</p>
                <p className="text-gray-700">{dadosAgendamento.nomeProfissional}</p>
              </div>
            </div>

            {/* Serviços */}
            <div className="border-b border-gray-200 pb-3">
              <div className="text-left">
                <p className="text-gray-900 font-medium mb-1">Serviços</p>
                <p className="text-gray-700">{dadosAgendamento.nomeServico}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="px-6 pb-6">
          <button
            onClick={onVoltar}
            className="w-full bg-orange-500 text-white py-3 rounded-2xl font-semibold text-lg hover:bg-orange-600 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgendamentoSucesso;

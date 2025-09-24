import React from 'react';
import { Check } from 'lucide-react';
import { toBrazilDate } from '../utils/timezone';

const AgendamentoSucesso = ({ dadosAgendamento, onVoltar }) => {
  // Formatar data por extenso
  const formatarData = (dataStr) => {
    const data = toBrazilDate(dataStr);
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
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full flex flex-col" style={{maxHeight: 'calc(100vh - 2rem)'}}>
        {/* Header */}
        <div className="bg-green-500 px-4 py-3 flex items-center justify-center rounded-t-3xl flex-shrink-0">
          <div className="flex items-center">
            <div className="mr-2">📱</div>
            <span className="text-white font-medium text-sm">Agendamento criado com sucesso</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4 flex-1 flex flex-col">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto flex-shrink-0">
            <Check size={32} className="text-white" />
          </div>

          {/* Title */}
          <h1 className="text-gray-900 text-xl font-bold mb-3 text-center flex-shrink-0">
            Agendamento realizado<br />
            <span className="text-orange-500">Com sucesso!</span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-700 text-sm mb-4 text-center leading-relaxed flex-shrink-0">
            Seu horário na {dadosAgendamento.nomeEmpresa} - {dadosAgendamento.nomeUnidade} está confirmado. 
            Você deverá receber detalhes no seu email em breve.
          </p>

          {/* Details */}
          <div className="space-y-3 flex-1 overflow-y-auto">
            {/* Unidade */}
            <div className="border-b border-gray-200 pb-2">
              <div className="text-left">
                <p className="text-gray-900 font-medium text-sm mb-1">Unidade</p>
                <p className="text-gray-700 text-sm">{dadosAgendamento.nomeEmpresa} - {dadosAgendamento.nomeUnidade}</p>
                <button className="text-orange-500 text-xs hover:text-orange-600 mt-1">
                  Ver localização
                </button>
              </div>
            </div>

            {/* Data */}
            <div className="border-b border-gray-200 pb-2">
              <div className="text-left">
                <p className="text-gray-900 font-medium text-sm mb-1">Data</p>
                <p className="text-gray-700 text-sm">{formatarData(dadosAgendamento.dataAgendamento)}</p>
              </div>
            </div>

            {/* Horário */}
            <div className="border-b border-gray-200 pb-2">
              <div className="text-left">
                <p className="text-gray-900 font-medium text-sm mb-1">Horário</p>
                <p className="text-gray-700 text-sm">{dadosAgendamento.horarioInicio}</p>
              </div>
            </div>

            {/* Colaborador */}
            <div className="border-b border-gray-200 pb-2">
              <div className="text-left">
                <p className="text-gray-900 font-medium text-sm mb-1">Colaborador</p>
                <p className="text-gray-700 text-sm">{dadosAgendamento.nomeProfissional}</p>
              </div>
            </div>

            {/* Serviços */}
            <div className="pb-2">
              <div className="text-left">
                <p className="text-gray-900 font-medium text-sm mb-1">Serviços</p>
                <p className="text-gray-700 text-sm">{dadosAgendamento.nomeServico}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="px-4 pb-4 flex-shrink-0">
          <button
            onClick={onVoltar}
            className="w-full bg-orange-500 text-white py-3 rounded-2xl font-semibold hover:bg-orange-600 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgendamentoSucesso;

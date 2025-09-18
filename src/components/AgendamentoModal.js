import React from 'react';
import { X } from 'lucide-react';

const AgendamentoModal = ({ agendamento, onClose, onConfirmar, onDesmarcar }) => {
  if (!agendamento) return null;

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

  const formatarHorario = (inicio, fim) => {
    return `${inicio} - ${fim}`;
  };

  const formatarPreco = (preco) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco || 0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
        {/* Header com botão fechar */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-xl font-bold text-gray-900">Avaliar atendimento</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Nome da Unidade */}
          <h3 className="text-lg font-medium mb-6 text-gray-900">
            {agendamento.unidades?.nome}
          </h3>

          {/* Detalhes */}
          <div className="space-y-4">
            {/* Data */}
            <div className="border-b border-gray-200 pb-3">
              <p className="text-sm text-gray-500 mb-1">Data</p>
              <p className="text-gray-900">{formatarData(agendamento.data_agendamento)}</p>
            </div>

            {/* Horário */}
            <div className="border-b border-gray-200 pb-3">
              <p className="text-sm text-gray-500 mb-1">Horário</p>
              <p className="text-gray-900">{formatarHorario(agendamento.horario_inicio, agendamento.horario_fim)}</p>
            </div>

            {/* Profissional */}
            <div className="border-b border-gray-200 pb-3">
              <p className="text-sm text-gray-500 mb-1">Profissional</p>
              <p className="text-gray-900">{agendamento.profissionais?.nome}</p>
            </div>

            {/* Serviços e Preço */}
            <div className="border-b border-gray-200 pb-3">
              <p className="text-sm text-gray-500 mb-1">Serviços</p>
              <div className="flex justify-between items-center">
                <p className="text-gray-900">{agendamento.servicos?.nome}</p>
                <p className="text-orange-500 font-medium">{formatarPreco(agendamento.preco_total)}</p>
              </div>
            </div>

            {/* Total */}
            <div className="pb-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-900 font-semibold">Total</p>
                <p className="text-orange-500 font-semibold">{formatarPreco(agendamento.preco_total)}</p>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="space-y-3 mt-8">
            <button
              onClick={() => onConfirmar(agendamento.id)}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-orange-600 transition-colors"
            >
              Confirmar
            </button>
            
            <button
              onClick={() => onDesmarcar(agendamento.id)}
              className="w-full bg-transparent border-2 border-gray-300 text-gray-700 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-colors"
            >
              Desmarcar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendamentoModal;

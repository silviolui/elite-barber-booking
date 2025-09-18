import React from 'react';
import { Clock } from 'lucide-react';

const HorariosConfig = ({ currentUser }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Configurar Horários de Funcionamento</h2>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <Clock size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Configuração de Horários</h3>
        <p className="text-gray-600 mb-6">
          Configure os horários de funcionamento para cada unidade e profissional
        </p>
        <div className="text-sm text-orange-600 bg-orange-50 rounded-lg p-4">
          Funcionalidade em desenvolvimento - Em breve você poderá configurar horários personalizados
        </div>
      </div>
    </div>
  );
};

export default HorariosConfig;

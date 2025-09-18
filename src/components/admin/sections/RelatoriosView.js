import React from 'react';
import { BarChart3 } from 'lucide-react';

const RelatoriosView = ({ currentUser }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Relatórios e Análises</h2>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Relatórios Detalhados</h3>
        <p className="text-gray-600 mb-6">
          Analise o desempenho do seu estabelecimento com relatórios detalhados
        </p>
        <div className="text-sm text-orange-600 bg-orange-50 rounded-lg p-4">
          Funcionalidade em desenvolvimento - Em breve você terá acesso a relatórios completos
        </div>
      </div>
    </div>
  );
};

export default RelatoriosView;

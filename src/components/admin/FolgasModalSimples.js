import React, { useState } from 'react';
import { X, Calendar, Plus } from 'lucide-react';

const FolgasModalSimples = ({ isOpen, onClose, profissional }) => {
  const [tipoFolga, setTipoFolga] = useState('dia_semana_recorrente');
  const [diaSemana, setDiaSemana] = useState('');
  const [folgaManha, setFolgaManha] = useState(false);
  const [folgaTarde, setFolgaTarde] = useState(false);
  const [folgaNoite, setFolgaNoite] = useState(false);

  const diasSemana = [
    { id: 2, nome: 'Terça-feira' },
    { id: 3, nome: 'Quarta-feira' },
    { id: 4, nome: 'Quinta-feira' },
    { id: 5, nome: 'Sexta-feira' },
  ];

  const salvarFolga = () => {
    alert(`Folga configurada para ${profissional?.nome}:
- Dia: ${diasSemana.find(d => d.id == diaSemana)?.nome}
- Períodos: ${folgaManha ? 'Manhã ' : ''}${folgaTarde ? 'Tarde ' : ''}${folgaNoite ? 'Noite' : ''}

Execute SQL no Supabase para ativar a funcionalidade completa.`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Calendar size={24} className="text-blue-600 mr-3" />
            Configurar Folgas
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Profissional: <strong>{profissional?.nome}</strong></p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dia da Semana</label>
            <select
              value={diaSemana}
              onChange={(e) => setDiaSemana(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Selecione um dia...</option>
              {diasSemana.map(dia => (
                <option key={dia.id} value={dia.id}>{dia.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Períodos de Folga</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={folgaManha}
                  onChange={(e) => setFolgaManha(e.target.checked)}
                  className="mr-3"
                />
                ☀️ Manhã (8h às 12h)
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={folgaTarde}
                  onChange={(e) => setFolgaTarde(e.target.checked)}
                  className="mr-3"
                />
                🌤️ Tarde (14h às 18h)
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={folgaNoite}
                  onChange={(e) => setFolgaNoite(e.target.checked)}
                  className="mr-3"
                />
                🌙 Noite (19h às 22h)
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg">
            Cancelar
          </button>
          <button 
            onClick={salvarFolga}
            disabled={!diaSemana || (!folgaManha && !folgaTarde && !folgaNoite)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Configurar Folga
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolgasModalSimples;

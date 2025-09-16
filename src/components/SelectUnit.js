import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SelectUnit = ({ onClose, onSelect, currentSelection, units }) => {
  const [selectedUnit, setSelectedUnit] = useState(currentSelection);
  const [realUnits, setRealUnits] = useState(units || []);

  // Carregar unidades REAIS da tabela
  useEffect(() => {
    const loadRealUnits = async () => {
      try {
        const { data, error } = await supabase
          .from('unidades')
          .select('*')
          .eq('ativo', true);
        
        if (data && data.length > 0) {
          console.log(`Carregadas ${data.length} unidades da tabela`);
          setRealUnits(data);
        } else {
          console.log('Usando dados mock como fallback');
          setRealUnits(units);
        }
      } catch (error) {
        console.error('Erro ao carregar unidades, usando mock:', error);
        setRealUnits(units);
      }
    };

    loadRealUnits();
  }, [units]);

  const handleContinue = () => {
    if (selectedUnit) {
      onSelect(selectedUnit);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-gray-900 text-xl font-semibold">Escolha sua unidade</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>
      
      {/* Content */}
      <div className="px-6 py-6">
        <div className="mb-6">
          <h3 className="text-gray-900 text-lg font-semibold mb-2">Onde você prefere?</h3>
          <p className="text-gray-600">Selecione a unidade mais próxima</p>
        </div>

        {/* Units List */}
        <div className="space-y-4 pb-32">
          {realUnits.map((unit) => (
            <button
              key={unit.id}
              onClick={() => setSelectedUnit(unit)}
              className={`w-full relative overflow-hidden rounded-2xl transition-all ${
                selectedUnit?.id === unit.id 
                  ? 'ring-2 ring-primary shadow-xl' 
                  : 'shadow-lg hover:shadow-xl'
              }`}
              style={{ minHeight: '140px' }}
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${unit.imagem_url || unit.image})` }}
              />
              <div className={`absolute inset-0 transition-colors ${
                selectedUnit?.id === unit.id 
                  ? 'bg-primary bg-opacity-80' 
                  : 'bg-black bg-opacity-40'
              }`}>
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                <img
                  src={unit.imagem_url || unit.image}
                  alt={unit.nome || unit.name}
                  className="w-full h-32 object-cover"
                />
              </div>
              
              <div className="p-4">
                <h4 className="text-gray-900 font-semibold text-lg mb-1">{unit.nome || unit.name}</h4>
                <p className="text-gray-600 text-sm">{unit.endereco || unit.address}</p>
              </div>
              
              {selectedUnit?.id === unit.id && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check size={16} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      {selectedUnit && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-200">
          <button
            onClick={handleContinue}
            className="w-full bg-primary text-white py-4 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectUnit;

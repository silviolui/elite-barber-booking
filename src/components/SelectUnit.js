import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

const SelectUnit = ({ onClose, onSelect, currentSelection, units }) => {
  const [selectedUnit, setSelectedUnit] = useState(currentSelection);

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
          {units.map((unit) => (
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
                style={{ backgroundImage: `url(${unit.image})` }}
              />
              <div className={`absolute inset-0 transition-colors ${
                selectedUnit?.id === unit.id 
                  ? 'bg-primary bg-opacity-80' 
                  : 'bg-black bg-opacity-50'
              }`} />
              
              {/* Content */}
              <div className="relative p-4 flex flex-col justify-end h-36">
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-base mb-2 leading-tight">{unit.name}</h4>
                    <p className="text-white text-opacity-90 text-sm font-medium leading-tight">{unit.address}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ml-3 flex-shrink-0 transition-all ${
                    selectedUnit?.id === unit.id
                      ? 'border-white bg-white'
                      : 'border-white border-opacity-60'
                  }`}>
                    {selectedUnit?.id === unit.id && (
                      <Check size={14} className="text-primary" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      {selectedUnit && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-200">
          <button
            onClick={handleContinue}
            className="w-full py-4 rounded-2xl font-semibold text-lg bg-primary text-white hover:bg-orange-600 transition-colors"
          >
            Continuar com {selectedUnit.name.split(' - ')[1]}
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectUnit;
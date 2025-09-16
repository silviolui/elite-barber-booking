import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const SelectUnit = ({ onClose, onSelect }) => {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [units, setUnits] = useState([]);

  // Mock data - será substituído pela busca no Supabase
  useEffect(() => {
    const mockUnits = [
      {
        id: 1,
        name: 'Barber Style - Boulevard Shopping Camaçari',
        address: 'BA-535, s/n - Industrial, s/n, Camaçari',
        image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 2,
        name: 'Barber Style - Salvador Norte Shopping',
        address: 'BA-535, s/n, Salvador',
        image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 3,
        name: 'Barber Style - Centro Camaçari',
        address: 'Radial B, 80, Camaçari',
        image: 'https://images.unsplash.com/photo-1562004760-aceed7bb0fe3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 4,
        name: 'Barber Style - Caminho Das Árvores',
        address: 'Rua Marcos Freire, 805, Salvador',
        image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
      }
    ];
    setUnits(mockUnits);
  }, []);

  const handleContinue = () => {
    if (selectedUnit) {
      onSelect(selectedUnit);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <h2 className="text-white text-xl font-medium">Escolha uma unidade</h2>
        <button onClick={onClose} className="text-white">
          <X size={24} />
        </button>
      </div>
      
      {/* Units List */}
      <div className="flex-1 px-6 py-6 pb-32 overflow-y-auto">
        <div className="space-y-4">
          {units.map((unit) => (
            <button
              key={unit.id}
              onClick={() => setSelectedUnit(unit)}
              className={`w-full p-4 rounded-2xl border-2 transition-colors ${
                selectedUnit?.id === unit.id 
                  ? 'border-white bg-gray-800' 
                  : 'border-gray-700 bg-gray-800'
              }`}
            >
              <div className="flex items-center space-x-4">
                <img
                  src={unit.image}
                  alt={unit.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1 text-left">
                  <h3 className="text-white font-medium mb-1">{unit.name}</h3>
                  <p className="text-gray-400 text-sm">{unit.address}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 ${
                  selectedUnit?.id === unit.id
                    ? 'border-white bg-white'
                    : 'border-gray-500'
                }`}>
                  {selectedUnit?.id === unit.id && (
                    <div className="w-full h-full rounded-full bg-gray-800 scale-50"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-black border-t border-gray-800">
        <button
          onClick={handleContinue}
          disabled={!selectedUnit}
          className={`w-full py-4 rounded-2xl font-medium transition-colors ${
            selectedUnit
              ? 'bg-white text-black hover:bg-gray-100'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default SelectUnit;

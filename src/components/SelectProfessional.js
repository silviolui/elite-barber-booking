import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SelectProfessional = ({ onClose, onSelect, unitId, currentSelection, professionals }) => {
  const [selectedProfessional, setSelectedProfessional] = useState(currentSelection);
  const [realProfessionals, setRealProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Carregar profissionais REAIS da tabela
  useEffect(() => {
    const loadRealProfessionals = async () => {
      if (!unitId) {
        setRealProfessionals([]);
        setLoading(false);
        return;
      }
      
      try {
        const { data } = await supabase
          .from('profissionais')
          .select('*')
          .eq('unidade_id', unitId)
          .eq('ativo', true);
        
        if (data && data.length > 0) {
          console.log(`Carregados ${data.length} profissionais da unidade ${unitId}`);
          setRealProfessionals(data);
        } else {
          console.log('Nenhum profissional encontrado na tabela, usando mock');
          setRealProfessionals(professionals[unitId] || []);
        }
      } catch (error) {
        console.error('Erro ao carregar profissionais, usando mock:', error);
        setRealProfessionals(professionals[unitId] || []);
      } finally {
        setLoading(false);
      }
    };

    loadRealProfessionals();
  }, [unitId, professionals]);

  const handleContinue = () => {
    if (selectedProfessional) {
      onSelect(selectedProfessional);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-gray-900 text-xl font-semibold">Nossos Profissionais</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>
      
      {/* Content */}
      <div className="px-6 py-6">
        <div className="mb-6">
          <h3 className="text-gray-900 text-lg font-semibold mb-2">Quem vai te atender?</h3>
          <p className="text-gray-600">Escolha seu profissional favorito</p>
        </div>

        {/* Professionals List */}
        <div className="space-y-4 pb-32">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500">Carregando profissionais...</p>
            </div>
          ) : realProfessionals.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">👨‍💼</span>
              </div>
              <h3 className="text-gray-900 font-semibold mb-2">Nenhum profissional encontrado</h3>
              <p className="text-gray-600 text-sm">Esta unidade ainda não tem profissionais cadastrados.</p>
            </div>
          ) : (
            realProfessionals.map((professional) => (
            <button
              key={professional.id}
              onClick={() => setSelectedProfessional(professional)}
              className={`w-full p-4 rounded-2xl border-2 transition-all ${
                selectedProfessional?.id === professional.id 
                  ? 'border-primary bg-orange-50' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* Profile Image */}
                <div className="relative flex-shrink-0">
                  <img
                    src={professional.foto_url || professional.image}
                    alt={professional.nome || professional.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                  {selectedProfessional?.id === professional.id && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Professional Info */}
                <div className="flex-1 text-left">
                  <h4 className="text-gray-900 font-semibold text-lg mb-1">{professional.nome || professional.name}</h4>
                  <p className="text-gray-600 text-base mb-2">{professional.especialidade || professional.specialty}</p>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(professional.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-gray-900 font-semibold">{professional.avaliacao || professional.rating}</span>
                  </div>
                </div>
              </div>
            </button>
          ))
          )}
        </div>
      </div>

      {/* Continue Button */}
      {selectedProfessional && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-200">
          <button
            onClick={handleContinue}
            className="w-full py-4 rounded-2xl font-semibold text-lg bg-primary text-white hover:bg-orange-600 transition-colors"
          >
            Continuar com {selectedProfessional.name}
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectProfessional;
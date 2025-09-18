import React, { useState, useEffect } from 'react';
import { X, Check, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SelectServices = ({ onClose, onSelect, professionalId, selectedServices, services }) => {
  const [currentService, setCurrentService] = useState(selectedServices?.[0] || null); // APENAS UM SERVIÇO
  const [realServices, setRealServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar serviços REAIS do profissional da tabela
  useEffect(() => {
    const loadRealServices = async () => {
      if (!professionalId) {
        setRealServices([]);
        setLoading(false);
        return;
      }
      
      try {
        const { data } = await supabase
          .from('servicos')
          .select('*')
          .eq('profissional_id', professionalId)
          .eq('ativo', true)
          .order('nome');
        
        if (data && data.length > 0) {
          console.log(`Carregados ${data.length} serviços do profissional ${professionalId}`);
          setRealServices(data);
        } else {
          console.log('Nenhum serviço encontrado na tabela, usando mock');
          setRealServices(services[professionalId] || []);
        }
      } catch (error) {
        console.error('Erro ao carregar serviços, usando mock:', error);
        setRealServices(services[professionalId] || []);
      } finally {
        setLoading(false);
      }
    };

    loadRealServices();
  }, [professionalId, services]);

  // SELEÇÃO ÚNICA: Apenas um serviço por vez
  const selectService = (service) => {
    setCurrentService(service === currentService ? null : service);
  };

  const handleContinue = () => {
    if (currentService) {
      onSelect([currentService]); // Enviar como array para compatibilidade
      onClose();
    }
  };

  const totalPrice = currentService ? (currentService.preco || currentService.price) : 0;
  const totalDuration = currentService ? (currentService.duracao_minutos || currentService.duration) : 0;

  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-gray-900 text-xl font-semibold">Nossos Serviços</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>
      
      {/* Content */}
      <div className="px-6 py-6">
        <div className="mb-6">
          <h3 className="text-gray-900 text-lg font-semibold mb-2">O que você deseja?</h3>
          <p className="text-gray-600">Selecione um ou mais serviços</p>
        </div>

        {/* Services List */}
        <div className="space-y-3 pb-40">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500">Carregando serviços...</p>
            </div>
          ) : realServices.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">✂️</span>
              </div>
              <h3 className="text-gray-900 font-semibold mb-2">Nenhum serviço encontrado</h3>
              <p className="text-gray-600 text-sm">Este profissional ainda não tem serviços cadastrados.</p>
            </div>
          ) : (
            realServices.map((service) => {
            const isSelected = currentService?.id === service.id;
            
            return (
              <button
                key={service.id}
                onClick={() => selectService(service)}
                className={`w-full p-4 rounded-2xl border-2 transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary text-white' 
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`text-base font-semibold ${
                        isSelected ? 'text-white' : 'text-gray-900'
                      }`}>{service.nome || service.name}</h4>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-white bg-white'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <Check size={14} className="text-primary" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium flex items-center ${
                        isSelected ? 'text-white opacity-90' : 'text-gray-600'
                      }`}>
                        <Clock size={14} className="mr-2" />
                        {service.duracao_minutos || service.duration}min
                      </span>
                      <span className={`text-lg font-bold ${
                        isSelected ? 'text-white' : 'text-gray-900'
                      }`}>
                        R$ {(service.preco || service.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
          )}
        </div>
      </div>

      {/* Cart Summary & Continue Button */}
      {currentService && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          {/* Summary */}
          <div className="px-6 pt-4 pb-2">
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-gray-900">
                  1 serviço
                </span>
                <span className="text-primary font-bold text-lg">
                  R$ {totalPrice.toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Duração total: {totalDuration} minutos
              </div>
            </div>
          </div>
          
          {/* Continue Button */}
          <div className="px-6 pb-6">
            <button
              onClick={handleContinue}
              className="w-full py-4 rounded-2xl font-semibold text-lg bg-primary text-white hover:bg-orange-600 transition-colors"
            >
              Continuar (1 selecionado)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectServices;
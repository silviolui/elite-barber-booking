import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Save, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { supabaseData } from '../../../lib/supabaseData';

const diasSemana = [
  { id: 0, nome: 'Domingo', abrev: 'Dom' },
  { id: 1, nome: 'Segunda-feira', abrev: 'Seg' },
  { id: 2, nome: 'Terça-feira', abrev: 'Ter' },
  { id: 3, nome: 'Quarta-feira', abrev: 'Qua' },
  { id: 4, nome: 'Quinta-feira', abrev: 'Qui' },
  { id: 5, nome: 'Sexta-feira', abrev: 'Sex' },
  { id: 6, nome: 'Sábado', abrev: 'Sab' }
];

const HorariosConfig = ({ currentUser }) => {
  const [unidades, setUnidades] = useState([]);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Carregar unidades
  useEffect(() => {
    carregarUnidades();
  }, []);

  // Carregar horários quando uma unidade é selecionada
  useEffect(() => {
    if (unidadeSelecionada) {
      carregarHorarios();
    }
  }, [unidadeSelecionada, carregarHorarios]);

  const carregarUnidades = async () => {
    const unidadesList = await supabaseData.getUnidades();
    setUnidades(unidadesList);
  };

  const carregarHorarios = useCallback(async () => {
    setLoading(true);
    try {
      const horariosData = await supabaseData.getHorarioFuncionamento(unidadeSelecionada);
      
      // Se não há horários para esta unidade, criar o template padrão
      if (!horariosData || horariosData.length === 0) {
        const horariosDefault = diasSemana.map(dia => ({
          id: null,
          unidade_id: unidadeSelecionada,
          dia_semana: dia.id,
          
          // Manhã
          abre_manha: dia.id >= 1 && dia.id <= 6, // Segunda a sábado
          horario_abertura_manha: (dia.id >= 1 && dia.id <= 6) ? '08:00' : '',
          horario_fechamento_manha: (dia.id >= 1 && dia.id <= 6) ? '12:00' : '',
          
          // Tarde
          abre_tarde: dia.id >= 1 && dia.id <= 5, // Segunda a sexta
          horario_abertura_tarde: (dia.id >= 1 && dia.id <= 5) ? '14:00' : '',
          horario_fechamento_tarde: (dia.id >= 1 && dia.id <= 5) ? '18:00' : '',
          
          // Noite
          abre_noite: dia.id >= 1 && dia.id <= 4, // Segunda a quinta
          horario_abertura_noite: (dia.id >= 1 && dia.id <= 4) ? '19:00' : '',
          horario_fechamento_noite: (dia.id >= 1 && dia.id <= 4) ? '22:00' : '',
          
          ativo: true,
          isNew: true
        }));
        setHorarios(horariosDefault);
      } else {
        setHorarios(horariosData.map(h => ({ ...h, isNew: false })));
      }
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      showMessage('error', 'Erro ao carregar horários');
    } finally {
      setLoading(false);
    }
  }, [unidadeSelecionada]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleHorarioChange = (diaIndex, campo, valor) => {
    const novosHorarios = [...horarios];
    novosHorarios[diaIndex] = {
      ...novosHorarios[diaIndex],
      [campo]: valor
    };
    setHorarios(novosHorarios);
  };

  const salvarHorarios = async () => {
    if (!unidadeSelecionada) {
      showMessage('error', 'Selecione uma unidade primeiro');
      return;
    }

    setSaving(true);
    try {
      for (const horario of horarios) {
        const horarioData = {
          unidade_id: unidadeSelecionada,
          dia_semana: horario.dia_semana,
          abre_manha: horario.abre_manha,
          horario_abertura_manha: horario.abre_manha && horario.horario_abertura_manha ? horario.horario_abertura_manha : null,
          horario_fechamento_manha: horario.abre_manha && horario.horario_fechamento_manha ? horario.horario_fechamento_manha : null,
          abre_tarde: horario.abre_tarde,
          horario_abertura_tarde: horario.abre_tarde && horario.horario_abertura_tarde ? horario.horario_abertura_tarde : null,
          horario_fechamento_tarde: horario.abre_tarde && horario.horario_fechamento_tarde ? horario.horario_fechamento_tarde : null,
          abre_noite: horario.abre_noite,
          horario_abertura_noite: horario.abre_noite && horario.horario_abertura_noite ? horario.horario_abertura_noite : null,
          horario_fechamento_noite: horario.abre_noite && horario.horario_fechamento_noite ? horario.horario_fechamento_noite : null,
          ativo: horario.ativo
        };

        if (horario.isNew || !horario.id) {
          // Inserir novo horário
          const { error } = await supabase
            .from('horario_funcionamento')
            .insert(horarioData);
          
          if (error) throw error;
        } else {
          // Atualizar horário existente
          const { error } = await supabase
            .from('horario_funcionamento')
            .update(horarioData)
            .eq('id', horario.id);
          
          if (error) throw error;
        }
      }

      showMessage('success', 'Horários salvos com sucesso!');
      await carregarHorarios(); // Recarregar para atualizar IDs
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      showMessage('error', 'Erro ao salvar horários: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const criarHorariosDefault = async () => {
    if (!unidadeSelecionada) {
      showMessage('error', 'Selecione uma unidade primeiro');
      return;
    }

    const horariosDefault = diasSemana.map(dia => ({
      id: null,
      unidade_id: unidadeSelecionada,
      dia_semana: dia.id,
      
      // Padrão: Segunda a sábado manhã, segunda a sexta tarde, segunda a quinta noite
      abre_manha: dia.id >= 1 && dia.id <= 6,
      horario_abertura_manha: (dia.id >= 1 && dia.id <= 6) ? '08:00' : '',
      horario_fechamento_manha: (dia.id >= 1 && dia.id <= 6) ? '12:00' : '',
      
      abre_tarde: dia.id >= 1 && dia.id <= 5,
      horario_abertura_tarde: (dia.id >= 1 && dia.id <= 5) ? '14:00' : '',
      horario_fechamento_tarde: (dia.id >= 1 && dia.id <= 5) ? '18:00' : '',
      
      abre_noite: dia.id >= 1 && dia.id <= 4,
      horario_abertura_noite: (dia.id >= 1 && dia.id <= 4) ? '19:00' : '',
      horario_fechamento_noite: (dia.id >= 1 && dia.id <= 4) ? '22:00' : '',
      
      ativo: true,
      isNew: true
    }));

    setHorarios(horariosDefault);
    showMessage('success', 'Horários padrão carregados. Clique em "Salvar" para aplicar.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Configurar Horários de Funcionamento</h2>
        {unidadeSelecionada && (
          <button
            onClick={criarHorariosDefault}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Horários Padrão
          </button>
        )}
      </div>

      {/* Mensagem de feedback */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={20} className="mr-2" />
          ) : (
            <AlertCircle size={20} className="mr-2" />
          )}
          {message.text}
        </div>
      )}

      {/* Seletor de Unidade */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecionar Unidade
        </label>
        <select
          value={unidadeSelecionada}
          onChange={(e) => setUnidadeSelecionada(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Escolha uma unidade...</option>
          {unidades.map(unidade => (
            <option key={unidade.id} value={unidade.id}>
              {unidade.nome} - {unidade.endereco}
            </option>
          ))}
        </select>
      </div>

      {/* Configuração de Horários */}
      {unidadeSelecionada && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock size={20} className="mr-2" />
              Horários de Funcionamento
            </h3>
            <button
              onClick={salvarHorarios}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Save size={20} className="mr-2" />
              {saving ? 'Salvando...' : 'Salvar Horários'}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Carregando horários...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {horarios.map((horario, index) => {
                const dia = diasSemana.find(d => d.id === horario.dia_semana);
                return (
                  <div key={`${horario.dia_semana}-${index}`} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-800">{dia?.nome}</h4>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={horario.ativo}
                          onChange={(e) => handleHorarioChange(index, 'ativo', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600">Ativo</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Manhã */}
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={horario.abre_manha}
                            onChange={(e) => handleHorarioChange(index, 'abre_manha', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="font-medium text-blue-700">Manhã</span>
                        </label>
                        {horario.abre_manha && (
                          <div className="flex space-x-2">
                            <input
                              type="time"
                              value={horario.horario_abertura_manha || ''}
                              onChange={(e) => handleHorarioChange(index, 'horario_abertura_manha', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <span className="py-1 text-gray-500">às</span>
                            <input
                              type="time"
                              value={horario.horario_fechamento_manha || ''}
                              onChange={(e) => handleHorarioChange(index, 'horario_fechamento_manha', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        )}
                      </div>

                      {/* Tarde */}
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={horario.abre_tarde}
                            onChange={(e) => handleHorarioChange(index, 'abre_tarde', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="font-medium text-green-700">Tarde</span>
                        </label>
                        {horario.abre_tarde && (
                          <div className="flex space-x-2">
                            <input
                              type="time"
                              value={horario.horario_abertura_tarde || ''}
                              onChange={(e) => handleHorarioChange(index, 'horario_abertura_tarde', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <span className="py-1 text-gray-500">às</span>
                            <input
                              type="time"
                              value={horario.horario_fechamento_tarde || ''}
                              onChange={(e) => handleHorarioChange(index, 'horario_fechamento_tarde', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        )}
                      </div>

                      {/* Noite */}
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={horario.abre_noite}
                            onChange={(e) => handleHorarioChange(index, 'abre_noite', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="font-medium text-purple-700">Noite</span>
                        </label>
                        {horario.abre_noite && (
                          <div className="flex space-x-2">
                            <input
                              type="time"
                              value={horario.horario_abertura_noite || ''}
                              onChange={(e) => handleHorarioChange(index, 'horario_abertura_noite', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <span className="py-1 text-gray-500">às</span>
                            <input
                              type="time"
                              value={horario.horario_fechamento_noite || ''}
                              onChange={(e) => handleHorarioChange(index, 'horario_fechamento_noite', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!unidadeSelecionada && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Clock size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Configuração de Horários</h3>
          <p className="text-gray-600 mb-4">
            Selecione uma unidade acima para configurar seus horários de funcionamento
          </p>
          <div className="text-sm text-blue-600 bg-blue-50 rounded-lg p-4">
            <p className="font-medium mb-2">Funcionalidades disponíveis:</p>
            <ul className="text-left space-y-1">
              <li>• Configurar horários por período (manhã, tarde, noite)</li>
              <li>• Definir dias de funcionamento</li>
              <li>• Ativar/desativar períodos específicos</li>
              <li>• Aplicar horários padrão automaticamente</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default HorariosConfig;

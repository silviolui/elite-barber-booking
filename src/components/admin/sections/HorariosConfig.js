import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Save, Plus, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
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
  
  // Estados para configuração de intervalos de slots
  const [intervalosConfig, setIntervalosConfig] = useState({
    intervalo_slots: 20, // Padrão atual: 20 minutos
    loading: false
  });

  const carregarUnidades = async () => {
    const unidadesList = await supabaseData.getUnidades();
    setUnidades(unidadesList);
  };

  // Carregar configuração de intervalos de slots
  const carregarIntervalosConfig = useCallback(async () => {
    if (!unidadeSelecionada) return;
    
    setIntervalosConfig(prev => ({ ...prev, loading: true }));
    try {
      const { data, error } = await supabase
        .from('configuracoes_unidade')
        .select('intervalo_slots')
        .eq('unidade_id', unidadeSelecionada)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // Se não existe configuração, usar o padrão de 20 minutos
      const intervalo = data?.intervalo_slots || 20;
      setIntervalosConfig(prev => ({ 
        ...prev, 
        intervalo_slots: intervalo,
        loading: false 
      }));
      
      console.log('📊 Configuração de intervalos carregada:', { intervalo, unidade: unidadeSelecionada });
    } catch (error) {
      console.error('Erro ao carregar configuração de intervalos:', error);
      showMessage('error', 'Erro ao carregar configuração de intervalos');
      setIntervalosConfig(prev => ({ ...prev, loading: false }));
    }
  }, [unidadeSelecionada]);

  // Salvar configuração de intervalos de slots
  const salvarIntervalosConfig = async () => {
    if (!unidadeSelecionada) {
      showMessage('error', 'Selecione uma unidade primeiro');
      return;
    }

    setIntervalosConfig(prev => ({ ...prev, loading: true }));
    try {
      // Verificar se já existe configuração
      const { data: existing } = await supabase
        .from('configuracoes_unidade')
        .select('id')
        .eq('unidade_id', unidadeSelecionada)
        .maybeSingle();

      if (existing) {
        // Atualizar existente
        const { error } = await supabase
          .from('configuracoes_unidade')
          .update({ 
            intervalo_slots: intervalosConfig.intervalo_slots,
            updated_at: new Date().toISOString()
          })
          .eq('unidade_id', unidadeSelecionada);
          
        if (error) throw error;
      } else {
        // Criar novo
        const { error } = await supabase
          .from('configuracoes_unidade')
          .insert({
            unidade_id: unidadeSelecionada,
            intervalo_slots: intervalosConfig.intervalo_slots,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (error) throw error;
      }

      showMessage('success', `Intervalo de slots atualizado para ${intervalosConfig.intervalo_slots} minutos!`);
      console.log('✅ Configuração de intervalos salva:', { 
        intervalo: intervalosConfig.intervalo_slots, 
        unidade: unidadeSelecionada 
      });
    } catch (error) {
      console.error('Erro ao salvar configuração de intervalos:', error);
      showMessage('error', 'Erro ao salvar configuração: ' + error.message);
    } finally {
      setIntervalosConfig(prev => ({ ...prev, loading: false }));
    }
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

  // Carregar unidades e definir unidade padrão baseado no usuário logado
  useEffect(() => {
    const initializeData = async () => {
      await carregarUnidades();
      
      // Se o usuário tem unidade_id, selecionar automaticamente
      if (currentUser && currentUser.unidade_id) {
        setUnidadeSelecionada(currentUser.unidade_id);
      }
    };
    
    initializeData();
  }, [currentUser]);

  // Carregar horários e configurações quando uma unidade é selecionada
  useEffect(() => {
    if (unidadeSelecionada) {
      carregarHorarios();
      carregarIntervalosConfig();
    }
  }, [unidadeSelecionada, carregarHorarios, carregarIntervalosConfig]);

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
      // 1. Primeiro, excluir todos os horários existentes desta unidade
      await supabase
        .from('horario_funcionamento')
        .delete()
        .eq('unidade_id', unidadeSelecionada);

      // 2. Inserir os novos horários
      const horariosParaInserir = horarios.map(horario => ({
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
      }));

      const { error } = await supabase
        .from('horario_funcionamento')
        .insert(horariosParaInserir);
      
      if (error) throw error;

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

    // Verificar se já existem horários para esta unidade
    if (horarios && horarios.length > 0) {
      const confirmar = window.confirm(
        'Já existem horários configurados para esta unidade.\n\n' +
        'Ao criar horários padrão, os horários atuais serão substituídos.\n\n' +
        'Deseja continuar?'
      );
      if (!confirmar) return;
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

  const excluirTodosHorarios = async () => {
    if (!unidadeSelecionada) {
      showMessage('error', 'Selecione uma unidade primeiro');
      return;
    }

    const confirmar = window.confirm(
      'ATENÇÃO: Esta ação irá EXCLUIR TODOS os horários de funcionamento desta unidade.\n\n' +
      'Esta ação não pode ser desfeita!\n\n' +
      'Deseja realmente excluir todos os horários?'
    );

    if (!confirmar) return;

    setSaving(true);
    try {
      // Excluir todos os horários da unidade no banco
      const { error } = await supabase
        .from('horario_funcionamento')
        .delete()
        .eq('unidade_id', unidadeSelecionada);

      if (error) throw error;

      // Limpar horários da interface
      setHorarios([]);
      showMessage('success', 'Todos os horários foram excluídos com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir horários:', error);
      showMessage('error', 'Erro ao excluir horários: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Configurar Horários de Funcionamento</h2>
        {unidadeSelecionada && (
          <div className="flex gap-2">
            <button
              onClick={criarHorariosDefault}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Horários Padrão
            </button>
            <button
              onClick={excluirTodosHorarios}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={20} className="mr-2" />
              Excluir Todos
            </button>
          </div>
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

      {/* Seletor de Unidade - Só aparece para Super Admin */}
      {!currentUser?.unidade_id ? (
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
      ) : (
        // Para Admin de Unidade - Mostrar qual unidade está configurando
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock size={16} className="text-blue-600" />
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900">Configurando Horários</h3>
              <p className="text-sm text-blue-700">
                {unidades.find(u => u.id === unidadeSelecionada)?.nome || 'Carregando...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuração de Intervalos de Slots */}
      {unidadeSelecionada && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock size={20} className="mr-2" />
              Configuração de Intervalos de Agendamento
            </h3>
            <button
              onClick={salvarIntervalosConfig}
              disabled={intervalosConfig.loading}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              <Save size={20} className="mr-2" />
              {intervalosConfig.loading ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle size={20} className="text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">Como funciona:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• <strong>10 minutos:</strong> Slots de 8:00, 8:10, 8:20, 8:30... (mais flexível)</li>
                  <li>• <strong>20 minutos:</strong> Slots de 8:00, 8:20, 8:40, 9:00... (padrão atual)</li>
                  <li>• <strong>40 minutos:</strong> Slots de 8:00, 8:40, 9:20, 10:00... (menos opções)</li>
                </ul>
              </div>
            </div>
          </div>

          {intervalosConfig.loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Carregando configuração...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[10, 20, 40].map(intervalo => (
                <label key={intervalo} className="relative">
                  <input
                    type="radio"
                    name="intervalo_slots"
                    value={intervalo}
                    checked={intervalosConfig.intervalo_slots === intervalo}
                    onChange={(e) => setIntervalosConfig(prev => ({ 
                      ...prev, 
                      intervalo_slots: parseInt(e.target.value) 
                    }))}
                    className="sr-only"
                  />
                  <div className={`
                    border-2 rounded-lg p-4 cursor-pointer transition-all
                    ${intervalosConfig.intervalo_slots === intervalo
                      ? 'border-orange-500 bg-orange-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-25'
                    }
                  `}>
                    <div className="text-center">
                      <div className={`
                        text-2xl font-bold mb-2
                        ${intervalosConfig.intervalo_slots === intervalo ? 'text-orange-600' : 'text-gray-700'}
                      `}>
                        {intervalo} min
                      </div>
                      <div className={`
                        text-sm mb-2
                        ${intervalosConfig.intervalo_slots === intervalo ? 'text-orange-700' : 'text-gray-500'}
                      `}>
                        Intervalos de {intervalo} em {intervalo} minutos
                      </div>
                      <div className={`
                        text-xs
                        ${intervalosConfig.intervalo_slots === intervalo ? 'text-orange-600' : 'text-gray-400'}
                      `}>
                        {intervalo === 10 && 'Máxima flexibilidade'}
                        {intervalo === 20 && 'Padrão atual'}
                        {intervalo === 40 && 'Menos opções, mais organização'}
                      </div>
                    </div>
                    {intervalosConfig.intervalo_slots === intervalo && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle size={20} className="text-orange-500" />
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Exemplo prático:</h4>
            <p className="text-sm text-blue-800">
              {intervalosConfig.intervalo_slots === 10 && 
                "Corte de 40min às 8:00h → ocupará slots: 8:00, 8:10, 8:20, 8:30. Próximo disponível: 8:40"
              }
              {intervalosConfig.intervalo_slots === 20 && 
                "Corte de 40min às 8:00h → ocupará slots: 8:00, 8:20. Próximo disponível: 8:40"
              }
              {intervalosConfig.intervalo_slots === 40 && 
                "Corte de 40min às 8:00h → ocupará slot: 8:00. Próximo disponível: 8:40"
              }
            </p>
          </div>
        </div>
      )}

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

      {!unidadeSelecionada && !currentUser?.unidade_id && (
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

import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const diasSemana = [
  { id: 0, nome: 'Domingo', abrev: 'Dom' },
  { id: 1, nome: 'Segunda-feira', abrev: 'Seg' },
  { id: 2, nome: 'Terça-feira', abrev: 'Ter' },
  { id: 3, nome: 'Quarta-feira', abrev: 'Qua' },
  { id: 4, nome: 'Quinta-feira', abrev: 'Qui' },
  { id: 5, nome: 'Sexta-feira', abrev: 'Sex' },
  { id: 6, nome: 'Sábado', abrev: 'Sáb' }
];

const FolgasModal = ({ isOpen, onClose, profissional }) => {
  const [folgas, setFolgas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [tipoFolga, setTipoFolga] = useState('data_especifica');
  const [novaFolga, setNovaFolga] = useState({
    data_folga: '',
    dia_semana: '',
    motivo: '',
    observacoes: '',
    folga_manha: false,
    folga_tarde: false,
    folga_noite: false
  });

  const carregarFolgas = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('folgas_profissionais')
        .select('*')
        .eq('profissional_id', profissional.id)
        .eq('ativo', true)
        .order('tipo_folga', { ascending: true });

      if (error) throw error;
      setFolgas(data || []);
    } catch (error) {
      console.error('Erro ao carregar folgas:', error);
      showMessage('error', 'Erro ao carregar folgas');
    } finally {
      setLoading(false);
    }
  }, [profissional]);

  useEffect(() => {
    if (isOpen && profissional) {
      carregarFolgas();
    }
  }, [isOpen, profissional, carregarFolgas]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const adicionarFolga = async () => {
    try {
      // Verificar se pelo menos um período foi selecionado
      if (!novaFolga.folga_manha && !novaFolga.folga_tarde && !novaFolga.folga_noite) {
        showMessage('error', 'Selecione pelo menos um período (manhã, tarde ou noite)');
        return;
      }

      const folgaData = {
        profissional_id: profissional.id,
        tipo_folga: tipoFolga,
        motivo: novaFolga.motivo,
        observacoes: novaFolga.observacoes,
        folga_manha: novaFolga.folga_manha,
        folga_tarde: novaFolga.folga_tarde,
        folga_noite: novaFolga.folga_noite,
        ativo: true
      };

      if (tipoFolga === 'data_especifica') {
        if (!novaFolga.data_folga) {
          showMessage('error', 'Selecione uma data');
          return;
        }
        folgaData.data_folga = novaFolga.data_folga;
        folgaData.dia_semana = null;
      } else {
        if (!novaFolga.dia_semana) {
          showMessage('error', 'Selecione um dia da semana');
          return;
        }
        folgaData.dia_semana = parseInt(novaFolga.dia_semana);
        folgaData.data_folga = null;
      }

      const { error } = await supabase
        .from('folgas_profissionais')
        .insert(folgaData);

      if (error) throw error;

      showMessage('success', 'Folga adicionada com sucesso!');
      setNovaFolga({ 
        data_folga: '', 
        dia_semana: '', 
        motivo: '', 
        observacoes: '',
        folga_manha: false,
        folga_tarde: false,
        folga_noite: false
      });
      await carregarFolgas();
    } catch (error) {
      console.error('Erro ao adicionar folga:', error);
      showMessage('error', 'Erro ao adicionar folga: ' + error.message);
    }
  };

  const removerFolga = async (id) => {
    if (window.confirm('Tem certeza que deseja remover esta folga?')) {
      try {
        const { error } = await supabase
          .from('folgas_profissionais')
          .delete()
          .eq('id', id);

        if (error) throw error;

        showMessage('success', 'Folga removida com sucesso!');
        await carregarFolgas();
      } catch (error) {
        console.error('Erro ao remover folga:', error);
        showMessage('error', 'Erro ao remover folga');
      }
    }
  };

  const formatarData = (data) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const obterNomeDiaSemana = (dia) => {
    return diasSemana.find(d => d.id === dia)?.nome || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Calendar size={24} className="text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Configurar Folgas
              </h2>
              <p className="text-sm text-gray-600">
                {profissional?.nome}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Mensagem de feedback */}
          {message.text && (
            <div className={`mb-4 p-4 rounded-lg flex items-center ${
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

          {/* Adicionar Nova Folga */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Plus size={20} className="mr-2" />
              Adicionar Nova Folga
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Folga
                  </label>
                  <select
                    value={tipoFolga}
                    onChange={(e) => setTipoFolga(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="data_especifica">Data Específica</option>
                    <option value="dia_semana_recorrente">Dia da Semana (Recorrente)</option>
                  </select>
                </div>

              {tipoFolga === 'data_especifica' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Folga
                  </label>
                  <input
                    type="date"
                    value={novaFolga.data_folga}
                    onChange={(e) => setNovaFolga({...novaFolga, data_folga: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dia da Semana
                  </label>
                  <select
                    value={novaFolga.dia_semana}
                    onChange={(e) => setNovaFolga({...novaFolga, dia_semana: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um dia...</option>
                    {diasSemana.map(dia => (
                      <option key={dia.id} value={dia.id}>
                        {dia.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              </div>

              {/* Seleção de Períodos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Períodos de Folga
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novaFolga.folga_manha}
                      onChange={(e) => setNovaFolga({...novaFolga, folga_manha: e.target.checked})}
                      className="mr-3 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-blue-700">☀️ Manhã</div>
                      <div className="text-xs text-gray-500">8h às 12h</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-green-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novaFolga.folga_tarde}
                      onChange={(e) => setNovaFolga({...novaFolga, folga_tarde: e.target.checked})}
                      className="mr-3 text-green-600"
                    />
                    <div>
                      <div className="font-medium text-green-700">🌤️ Tarde</div>
                      <div className="text-xs text-gray-500">14h às 18h</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-purple-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novaFolga.folga_noite}
                      onChange={(e) => setNovaFolga({...novaFolga, folga_noite: e.target.checked})}
                      className="mr-3 text-purple-600"
                    />
                    <div>
                      <div className="font-medium text-purple-700">🌙 Noite</div>
                      <div className="text-xs text-gray-500">19h às 22h</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo
                </label>
                <input
                  type="text"
                  value={novaFolga.motivo}
                  onChange={(e) => setNovaFolga({...novaFolga, motivo: e.target.value})}
                  placeholder="Ex: Férias, Consulta médica..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <input
                  type="text"
                  value={novaFolga.observacoes}
                  onChange={(e) => setNovaFolga({...novaFolga, observacoes: e.target.value})}
                  placeholder="Informações adicionais..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={adicionarFolga}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus size={20} className="mr-2" />
              Adicionar Folga
            </button>
          </div>

          {/* Lista de Folgas Existentes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Folgas Configuradas
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Carregando folgas...</p>
              </div>
            ) : folgas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <p>Nenhuma folga configurada para este profissional</p>
              </div>
            ) : (
              <div className="space-y-3">
                {folgas.map((folga) => (
                  <div key={folga.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            folga.tipo_folga === 'data_especifica' 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {folga.tipo_folga === 'data_especifica' ? 'Data Específica' : 'Recorrente'}
                          </span>
                        </div>
                        
                        <div className="text-lg font-semibold text-gray-900">
                          {folga.tipo_folga === 'data_especifica' 
                            ? formatarData(folga.data_folga)
                            : `Todas as ${obterNomeDiaSemana(folga.dia_semana)}`
                          }
                        </div>

                        {/* Exibir períodos da folga */}
                        <div className="flex items-center mt-2 space-x-2">
                          {folga.folga_manha && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              ☀️ Manhã
                            </span>
                          )}
                          {folga.folga_tarde && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              🌤️ Tarde
                            </span>
                          )}
                          {folga.folga_noite && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              🌙 Noite
                            </span>
                          )}
                        </div>
                        
                        {folga.motivo && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Motivo:</strong> {folga.motivo}
                          </p>
                        )}
                        
                        {folga.observacoes && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Obs:</strong> {folga.observacoes}
                          </p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => removerFolga(folga.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded ml-4"
                        title="Remover Folga"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolgasModal;

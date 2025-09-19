import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const FolgasModalSimples = ({ isOpen, onClose, profissional }) => {
  // const [tipoFolga, setTipoFolga] = useState('dia_semana_recorrente');
  const [diaSemana, setDiaSemana] = useState('');
  const [folgaManha, setFolgaManha] = useState(false);
  const [folgaTarde, setFolgaTarde] = useState(false);
  const [folgaNoite, setFolgaNoite] = useState(false);
  const [folgas, setFolgas] = useState([]);
  const [loading, setLoading] = useState(false);

  const diasSemana = [
    { id: 2, nome: 'Terça-feira' },
    { id: 3, nome: 'Quarta-feira' },
    { id: 4, nome: 'Quinta-feira' },
    { id: 5, nome: 'Sexta-feira' },
  ];

  const carregarFolgas = useCallback(async () => {
    if (!profissional?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('folgas_profissionais')
        .select('*')
        .eq('profissional_id', profissional.id)
        .eq('ativo', true)
        .order('dia_semana');

      if (error) throw error;
      setFolgas(data || []);
    } catch (error) {
      console.error('Erro ao carregar folgas:', error);
    } finally {
      setLoading(false);
    }
  }, [profissional]);

  const removerFolga = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover esta folga?')) return;
    
    try {
      const { error } = await supabase
        .from('folgas_profissionais')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await carregarFolgas(); // Recarregar lista
      alert('✅ Folga removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover folga:', error);
      alert('❌ Erro ao remover folga: ' + error.message);
    }
  };

  useEffect(() => {
    if (isOpen && profissional) {
      carregarFolgas();
    }
  }, [isOpen, profissional, carregarFolgas]);

  const salvarFolga = async () => {
    try {
      const folgaData = {
        profissional_id: profissional.id,
        tipo_folga: 'dia_semana_recorrente',
        dia_semana: parseInt(diaSemana),
        data_folga: null,
        folga_manha: folgaManha,
        folga_tarde: folgaTarde,
        folga_noite: folgaNoite,
        motivo: 'Folga configurada pelo admin',
        ativo: true
      };

      const { error } = await supabase
        .from('folgas_profissionais')
        .insert(folgaData);

      if (error) throw error;

      alert(`✅ Folga salva com sucesso para ${profissional?.nome}!
- Dia: ${diasSemana.find(d => d.id === parseInt(diaSemana))?.nome}
- Períodos: ${folgaManha ? 'Manhã ' : ''}${folgaTarde ? 'Tarde ' : ''}${folgaNoite ? 'Noite' : ''}

Agora teste no app de agendamento!`);
      
      // Resetar formulário
      setDiaSemana('');
      setFolgaManha(false);
      setFolgaTarde(false);
      setFolgaNoite(false);
      
      await carregarFolgas(); // Recarregar lista (modal permanece aberto)
    } catch (error) {
      console.error('Erro ao salvar folga:', error);
      alert('❌ Erro ao salvar folga: ' + error.message);
    }
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
                ☀️ Manhã
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={folgaTarde}
                  onChange={(e) => setFolgaTarde(e.target.checked)}
                  className="mr-3"
                />
                🌤️ Tarde
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={folgaNoite}
                  onChange={(e) => setFolgaNoite(e.target.checked)}
                  className="mr-3"
                />
                🌙 Noite
              </label>
            </div>
          </div>

          {/* Lista de Folgas Existentes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Folgas Configuradas</h3>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : folgas.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma folga configurada</p>
            ) : (
              <div className="space-y-2">
                {folgas.map((folga) => (
                  <div key={folga.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">
                        {diasSemana.find(d => d.id === folga.dia_semana)?.nome || `Dia ${folga.dia_semana}`}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {folga.folga_manha && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">☀️ Manhã</span>}
                        {folga.folga_tarde && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">🌤️ Tarde</span>}
                        {folga.folga_noite && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">🌙 Noite</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => removerFolga(folga.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded"
                      title="Remover folga"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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

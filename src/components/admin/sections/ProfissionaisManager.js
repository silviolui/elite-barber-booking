import React, { useState, useEffect } from 'react';
import { 
  User,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Calendar
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import PhotoUpload from '../PhotoUpload';
// import FolgasModal from '../FolgasModal'; // Temporariamente desabilitado

const ProfissionaisManager = ({ currentUser }) => {
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const unidadeId = adminData.unidade_id; // NULL se for super admin
  const [profissionais, setProfissionais] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProfissional, setEditingProfissional] = useState(null);
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  // const [showFolgasModal, setShowFolgasModal] = useState(false);
  // const [profissionalFolgasSelected, setProfissionalFolgasSelected] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    especialidade: '',
    descricao: '',
    foto_url: '',
    avaliacao: 5.0,
    anos_experiencia: 1,
    unidade_id: '',
    ativo: true
  });

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    try {
      // Construir queries baseadas na unidade do admin
      let profissionaisQuery = supabase.from('profissionais').select(`*, unidades (nome)`).order('nome');
      let unidadesQuery = supabase.from('unidades').select('id, nome').eq('ativo', true).order('nome');
      let servicosQuery = supabase.from('servicos').select('id, nome').eq('ativo', true).is('profissional_id', null).order('nome');

      // Se não for super admin, filtrar por unidade
      if (unidadeId) {
        profissionaisQuery = profissionaisQuery.eq('unidade_id', unidadeId);
        unidadesQuery = unidadesQuery.eq('id', unidadeId);
        // Serviços podem ser da unidade específica ou globais (se implementarmos isso depois)
      }

      const [profissionaisResult, unidadesResult, servicosResult] = await Promise.all([
        profissionaisQuery,
        unidadesQuery,
        servicosQuery
      ]);

      setProfissionais(profissionaisResult.data || []);
      setUnidades(unidadesResult.data || []);
      setServicos(servicosResult.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let profissionalId;

      if (editingProfissional) {
        // Atualizar profissional existente
        const { error } = await supabase
          .from('profissionais')
          .update(formData)
          .eq('id', editingProfissional.id);

        if (error) throw error;
        profissionalId = editingProfissional.id;
      } else {
        // Criar novo profissional
        const { data, error } = await supabase
          .from('profissionais')
          .insert([formData])
          .select('id')
          .single();

        if (error) throw error;
        profissionalId = data.id;
      }

      // Atualizar serviços do profissional
      await atualizarServicosProfissional(profissionalId, servicosSelecionados);

      closeModal();
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar profissional:', error);
    }
  };

  const atualizarServicosProfissional = async (profissionalId, servicosIds) => {
    console.log('🔄 Atualizando serviços do profissional:', profissionalId, servicosIds);
    
    try {
      // 1. Remover serviços atuais do profissional (da tabela servicos)
      console.log('🗑️ Removendo serviços atuais do profissional...');
      const { error: deleteError } = await supabase
        .from('servicos')
        .delete()
        .eq('profissional_id', profissionalId);

      if (deleteError) {
        console.error('❌ Erro ao deletar serviços:', deleteError);
      } else {
        console.log('✅ Serviços antigos do profissional removidos');
      }

      // 2. Para cada serviço selecionado, criar nova linha na tabela servicos
      if (servicosIds.length > 0) {
        console.log('➕ Criando serviços específicos para o profissional...');
        
        for (const servicoId of servicosIds) {
          // Buscar dados do serviço modelo (sem profissional_id)
          const { data: servicoModelo } = await supabase
            .from('servicos')
            .select('nome, preco, duracao_minutos, unidade_id')
            .eq('id', servicoId)
            .single();

          if (servicoModelo) {
            // Criar novo serviço específico para este profissional
            const novoServico = {
              nome: servicoModelo.nome,
              preco: servicoModelo.preco,
              duracao_minutos: servicoModelo.duracao_minutos,
              unidade_id: servicoModelo.unidade_id || unidadeId, // Usar unidade do admin se o modelo for global
              profissional_id: profissionalId, // Associar ao profissional
              ativo: true
            };

            console.log('📋 Criando serviço:', novoServico);

            const { error: insertError } = await supabase
              .from('servicos')
              .insert(novoServico);

            if (insertError) {
              console.error('❌ Erro ao inserir serviço:', insertError);
            } else {
              console.log('✅ Serviço criado:', servicoModelo.nome);
            }
          }
        }
      }
    } catch (error) {
      console.error('💥 Erro geral ao atualizar serviços:', error);
    }
  };

  const handleEdit = async (profissional) => {
    setEditingProfissional(profissional);
    setFormData({
      nome: profissional.nome || '',
      especialidade: profissional.especialidade || '',
      descricao: profissional.descricao || '',
      foto_url: profissional.foto_url || '',
      avaliacao: profissional.avaliacao || 5.0,
      anos_experiencia: profissional.anos_experiencia || 1,
      unidade_id: profissional.unidade_id || '',
      ativo: profissional.ativo
    });

    // Carregar serviços do profissional 
    // Precisamos encontrar quais serviços-modelo foram usados para criar serviços específicos deste profissional
    try {
      // Buscar serviços específicos do profissional
      const { data: servicosEspecificos } = await supabase
        .from('servicos')
        .select('nome, preco, duracao_minutos')
        .eq('profissional_id', profissional.id)
        .eq('ativo', true);

      console.log('🔍 Serviços específicos do profissional:', servicosEspecificos);

      // Para cada serviço específico, encontrar o serviço-modelo correspondente
      const servicosModeloIds = [];
      
      if (servicosEspecificos && servicosEspecificos.length > 0) {
        for (const servicoEspecifico of servicosEspecificos) {
          // Buscar serviço-modelo com mesmo nome/preço/duração e sem profissional_id
          const { data: servicoModelo } = await supabase
            .from('servicos')
            .select('id')
            .eq('nome', servicoEspecifico.nome)
            .eq('preco', servicoEspecifico.preco)
            .eq('duracao_minutos', servicoEspecifico.duracao_minutos)
            .is('profissional_id', null)
            .eq('ativo', true)
            .single();

          if (servicoModelo) {
            servicosModeloIds.push(servicoModelo.id);
          }
        }
      }

      console.log('📋 Serviços-modelo correspondentes:', servicosModeloIds);
      setServicosSelecionados(servicosModeloIds);
    } catch (error) {
      console.error('Erro ao carregar serviços do profissional:', error);
      setServicosSelecionados([]);
    }

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este profissional?')) {
      try {
        const { error } = await supabase
          .from('profissionais')
          .delete()
          .eq('id', id);

        if (!error) {
          await loadData();
        }
      } catch (error) {
        console.error('Erro ao excluir profissional:', error);
      }
    }
  };

  const handleFolgas = (profissional) => {
    // setProfissionalFolgasSelected(profissional);
    // setShowFolgasModal(true);
    alert(`Configurar folgas para ${profissional.nome} - Em desenvolvimento`);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      especialidade: '',
      descricao: '',
      foto_url: '',
      avaliacao: 5.0,
      anos_experiencia: 1,
      unidade_id: unidadeId || '', // Se admin de unidade específica, já preencher
      ativo: true
    });
    setServicosSelecionados([]);
  };

  const openModal = () => {
    resetForm();
    setEditingProfissional(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProfissional(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Profissionais</h2>
        <button
          onClick={openModal}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Novo Profissional
        </button>
      </div>

      {/* Profissionais Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profissionais.map((profissional) => (
          <div key={profissional.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                  {profissional.foto_url ? (
                    <img 
                      src={profissional.foto_url} 
                      alt={profissional.nome}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <User 
                    size={24} 
                    className="text-orange-500" 
                    style={{display: profissional.foto_url ? 'none' : 'block'}}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{profissional.nome}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    profissional.ativo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profissional.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => handleFolgas(profissional)}
                  className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                  title="Configurar Folgas"
                >
                  <Calendar size={16} />
                </button>
                <button
                  onClick={() => handleEdit(profissional)}
                  className="text-gray-600 hover:bg-gray-50 p-2 rounded"
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(profissional.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  {profissional.anos_experiencia || 0} anos exp. | ⭐ {profissional.avaliacao || 5.0}
                </span>
              </div>
              
              {profissional.especialidade && (
                <div className="flex items-center text-gray-600">
                  <span className="font-medium">{profissional.especialidade}</span>
                </div>
              )}
              
              {profissional.unidades && (
                <div className="flex items-center text-gray-600">
                  <MapPin size={16} className="mr-2" />
                  <span>{profissional.unidades.nome}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProfissional ? 'Editar Profissional' : 'Novo Profissional'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Nome do profissional"
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidade
                </label>
                <input
                  type="text"
                  value={formData.especialidade}
                  onChange={(e) => setFormData({...formData, especialidade: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Coloração e Design"
                />
              </div>

              {/* Upload de Foto */}
              <PhotoUpload
                currentPhotoUrl={formData.foto_url}
                onPhotoChange={(url) => setFormData({...formData, foto_url: url})}
                profissionalNome={formData.nome || 'profissional'}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avaliação (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formData.avaliacao}
                    onChange={(e) => setFormData({...formData, avaliacao: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anos de Experiência
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.anos_experiencia}
                    onChange={(e) => setFormData({...formData, anos_experiencia: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidade {unidadeId && <span className="text-xs text-gray-500">(fixo para sua unidade)</span>}
                </label>
                {unidadeId ? (
                  // Admin de unidade específica - campo readonly
                  <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-700">
                    {unidades.find(u => u.id === unidadeId)?.nome || 'Sua unidade'}
                  </div>
                ) : (
                  // Super admin - pode escolher unidade
                  <select
                    value={formData.unidade_id}
                    onChange={(e) => setFormData({...formData, unidade_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma unidade</option>
                    {unidades.map(unidade => (
                      <option key={unidade.id} value={unidade.id}>
                        {unidade.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Seleção de Serviços */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serviços que oferece
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {servicos.map(servico => (
                    <label key={servico.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={servicosSelecionados.includes(servico.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setServicosSelecionados([...servicosSelecionados, servico.id]);
                          } else {
                            setServicosSelecionados(servicosSelecionados.filter(id => id !== servico.id));
                          }
                        }}
                        className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded mr-2"
                      />
                      <span className="text-sm text-gray-700">{servico.nome}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selecione todos os serviços que este profissional oferece
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Descrição do profissional"
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">
                  Profissional ativo
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center"
                >
                  <Save size={16} className="mr-2" />
                  {editingProfissional ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Folgas - Temporariamente desabilitado */}
      {/*
      <FolgasModal 
        isOpen={showFolgasModal}
        onClose={() => setShowFolgasModal(false)}
        profissional={profissionalFolgasSelected}
      />
      */}
    </div>
  );
};

export default ProfissionaisManager;

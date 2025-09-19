import React, { useState, useEffect } from 'react';
import { 
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const ProfissionaisManager = ({ currentUser }) => {
  const [profissionais, setProfissionais] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProfissional, setEditingProfissional] = useState(null);
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    unidade_id: '',
    ativo: true,
    observacoes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profissionaisResult, unidadesResult, servicosResult] = await Promise.all([
        supabase
          .from('profissionais')
          .select(`
            *,
            unidades (nome)
          `)
          .order('nome'),
        supabase
          .from('unidades')
          .select('id, nome')
          .eq('ativo', true)
          .order('nome'),
        supabase
          .from('servicos')
          .select('id, nome')
          .eq('ativo', true)
          .order('nome')
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
    try {
      // 1. Remover todos os serviços atuais do profissional
      await supabase
        .from('profissional_servicos')
        .delete()
        .eq('profissional_id', profissionalId);

      // 2. Inserir novos serviços selecionados
      if (servicosIds.length > 0) {
        const relacionamentos = servicosIds.map(servicoId => ({
          profissional_id: profissionalId,
          servico_id: servicoId,
          ativo: true
        }));

        await supabase
          .from('profissional_servicos')
          .insert(relacionamentos);
      }
    } catch (error) {
      console.error('Erro ao atualizar serviços do profissional:', error);
    }
  };

  const handleEdit = async (profissional) => {
    setEditingProfissional(profissional);
    setFormData({
      nome: profissional.nome || '',
      telefone: profissional.telefone || '',
      email: profissional.email || '',
      unidade_id: profissional.unidade_id || '',
      ativo: profissional.ativo,
      observacoes: profissional.observacoes || ''
    });

    // Carregar serviços do profissional
    try {
      const { data: servicosProfissional } = await supabase
        .from('profissional_servicos')
        .select('servico_id')
        .eq('profissional_id', profissional.id)
        .eq('ativo', true);

      const servicosIds = servicosProfissional?.map(ps => ps.servico_id) || [];
      setServicosSelecionados(servicosIds);
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

  const resetForm = () => {
    setFormData({
      nome: '',
      telefone: '',
      email: '',
      unidade_id: '',
      ativo: true,
      observacoes: ''
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
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <User size={24} className="text-orange-500" />
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
              {profissional.telefone && (
                <div className="flex items-center text-gray-600">
                  <Phone size={16} className="mr-2" />
                  <span>{profissional.telefone}</span>
                </div>
              )}
              
              {profissional.email && (
                <div className="flex items-center text-gray-600">
                  <Mail size={16} className="mr-2" />
                  <span>{profissional.email}</span>
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
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidade
                </label>
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
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Observações adicionais"
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
    </div>
  );
};

export default ProfissionaisManager;

import React, { useState, useEffect } from 'react';
import { Scissors, DollarSign, Clock, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const ServicosManager = ({ currentUser }) => {
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const unidadeId = adminData.unidade_id; // NULL se for super admin
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingServico, setEditingServico] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    preco: '',
    duracao: 30,
    ativo: true,
    descricao: ''
  });

  useEffect(() => {
    loadServicos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadServicos = async () => {
    setLoading(true);
    try {
      let query = supabase.from('servicos').select('*').is('profissional_id', null).order('nome');

      // Se não for super admin, filtrar por unidade (ou serviços globais)
      if (unidadeId) {
        query = query.or(`unidade_id.eq.${unidadeId},unidade_id.is.null`);
      }

      const { data, error } = await query;

      if (!error) {
        setServicos(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dataToSave = {
      ...formData,
      preco: parseFloat(formData.preco),
      duracao_minutos: formData.duracao, // Usar nome correto da coluna
      unidade_id: unidadeId // Associar à unidade do admin (NULL se super admin)
    };
    
    // Remover campo 'duracao' do objeto para evitar erro
    delete dataToSave.duracao;

    try {
      if (editingServico) {
        const { error } = await supabase
          .from('servicos')
          .update(dataToSave)
          .eq('id', editingServico.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('servicos')
          .insert([dataToSave]);

        if (error) throw error;
      }

      closeModal();
      await loadServicos();
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
    }
  };

  const handleEdit = (servico) => {
    setEditingServico(servico);
    setFormData({
      nome: servico.nome || '',
      preco: servico.preco?.toString() || '',
      duracao: servico.duracao_minutos || servico.duracao || 30,
      ativo: servico.ativo,
      descricao: servico.descricao || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
      try {
        const { error } = await supabase
          .from('servicos')
          .delete()
          .eq('id', id);

        if (!error) {
          await loadServicos();
        }
      } catch (error) {
        console.error('Erro ao excluir serviço:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      preco: '',
      duracao: 30,
      ativo: true,
      descricao: ''
    });
  };

  const openModal = () => {
    resetForm();
    setEditingServico(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingServico(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-gray-200 rounded-lg"></div>
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Serviços</h2>
          <p className="text-sm text-gray-600">
            {unidadeId 
              ? 'Serviços base da sua unidade (templates para profissionais)'
              : 'Serviços base globais (templates para todas as unidades)'
            }
          </p>
        </div>
        <button
          onClick={openModal}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Novo Serviço
        </button>
      </div>

      {/* Serviços Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicos.map((servico) => (
          <div key={servico.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Scissors size={20} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{servico.nome}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    servico.ativo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {servico.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(servico)}
                  className="text-gray-600 hover:bg-gray-50 p-2 rounded"
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(servico.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <DollarSign size={16} className="mr-2" />
                  <span>Preço:</span>
                </div>
                <span className="font-semibold text-green-600">
                  R$ {servico.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600">
                  <Clock size={16} className="mr-2" />
                  <span>Duração:</span>
                </div>
                <span className="font-semibold text-gray-900">{servico.duracao_minutos || servico.duracao}min</span>
              </div>
            </div>

            {servico.descricao && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">{servico.descricao}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Corte de Cabelo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.preco}
                    onChange={(e) => setFormData({...formData, preco: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração (min) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.duracao}
                    onChange={(e) => setFormData({...formData, duracao: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Descrição do serviço"
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
                  Serviço ativo
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
                  {editingServico ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicosManager;

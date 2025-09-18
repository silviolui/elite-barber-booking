import React, { useState, useEffect } from 'react';
import { 
  Building2,
  MapPin,
  Phone,
  Mail,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Calendar
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const UnidadesManager = ({ currentUser }) => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    telefone: '',
    email: '',
    ativo: true,
    observacoes: ''
  });

  useEffect(() => {
    loadUnidades();
  }, []);

  const loadUnidades = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('unidades')
        .select(`
          *,
          profissionais (id, nome),
          agendamentos (id)
        `)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar unidades:', error);
      } else {
        setUnidades(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUnidade) {
        // Atualizar unidade existente
        const { error } = await supabase
          .from('unidades')
          .update(formData)
          .eq('id', editingUnidade.id);

        if (error) throw error;
      } else {
        // Criar nova unidade
        const { error } = await supabase
          .from('unidades')
          .insert([formData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingUnidade(null);
      resetForm();
      await loadUnidades();
    } catch (error) {
      console.error('Erro ao salvar unidade:', error);
    }
  };

  const handleEdit = (unidade) => {
    setEditingUnidade(unidade);
    setFormData({
      nome: unidade.nome || '',
      endereco: unidade.endereco || '',
      telefone: unidade.telefone || '',
      email: unidade.email || '',
      ativo: unidade.ativo,
      observacoes: unidade.observacoes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta unidade?')) {
      try {
        const { error } = await supabase
          .from('unidades')
          .delete()
          .eq('id', id);

        if (!error) {
          await loadUnidades();
        }
      } catch (error) {
        console.error('Erro ao excluir unidade:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      endereco: '',
      telefone: '',
      email: '',
      ativo: true,
      observacoes: ''
    });
  };

  const openModal = () => {
    resetForm();
    setEditingUnidade(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUnidade(null);
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
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Unidades</h2>
        <button
          onClick={openModal}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Nova Unidade
        </button>
      </div>

      {/* Unidades Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {unidades.map((unidade) => (
          <div key={unidade.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Building2 size={20} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{unidade.nome}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    unidade.ativo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {unidade.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(unidade)}
                  className="text-gray-600 hover:bg-gray-50 p-2 rounded"
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(unidade.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center text-gray-600">
                <MapPin size={16} className="mr-2" />
                <span>{unidade.endereco || 'Endereço não informado'}</span>
              </div>
              
              {unidade.telefone && (
                <div className="flex items-center text-gray-600">
                  <Phone size={16} className="mr-2" />
                  <span>{unidade.telefone}</span>
                </div>
              )}
              
              {unidade.email && (
                <div className="flex items-center text-gray-600">
                  <Mail size={16} className="mr-2" />
                  <span>{unidade.email}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Users size={16} className="mr-1" />
                  <span>{unidade.profissionais?.length || 0} profissionais</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar size={16} className="mr-1" />
                  <span>{unidade.agendamentos?.length || 0} agendamentos</span>
                </div>
              </div>
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
                {editingUnidade ? 'Editar Unidade' : 'Nova Unidade'}
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
                  Nome da Unidade *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Unidade Centro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <textarea
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Endereço completo"
                  rows={3}
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
                  placeholder="contato@unidade.com"
                />
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
                  Unidade ativa
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
                  {editingUnidade ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnidadesManager;

import React, { useState, useEffect } from 'react';
import { Building2, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

const AdminCadastro = ({ onBackToLogin }) => {
  const { showSuccess, showError } = useToast();
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    unidade_id: ''
  });

  useEffect(() => {
    loadUnidades();
  }, []);

  const loadUnidades = async () => {
    try {
      const { data } = await supabase
        .from('unidades')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      
      setUnidades(data || []);
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('admin_usuarios')
        .insert({
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          unidade_id: formData.unidade_id,
          ativo: true
        });

      if (error) {
        showError(`Erro ao criar admin: ${error.message}`);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onBackToLogin();
        }, 2000);
      }
    } catch (error) {
      showError('Erro ao criar administrador. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Administrador Criado!
          </h2>
          <p className="text-gray-600 mb-6">
            Conta administrativa criada com sucesso. Você já pode fazer login.
          </p>
          <p className="text-sm text-gray-500">
            Redirecionando para login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Info */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="mx-auto max-w-sm">
          <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 bg-orange-500 rounded-2xl flex items-center justify-center mb-4">
              <Building2 size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Cadastro por Unidade
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Cada unidade tem seu próprio administrador e acesso restrito aos seus dados
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Criar Administrador por Unidade
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Cada unidade gerencia apenas seus próprios dados
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione a Unidade *
              </label>
              <select
                name="unidade_id"
                required
                value={formData.unidade_id}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Escolha uma unidade</option>
                {unidades.map(unidade => (
                  <option key={unidade.id} value={unidade.id}>
                    {unidade.nome}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Este admin gerenciará apenas esta unidade específica
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Administrador *
              </label>
              <input
                type="text"
                name="nome"
                required
                value={formData.nome}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="admin.unidade@sistema.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha *
              </label>
              <input
                type="password"
                name="senha"
                required
                value={formData.senha}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Senha para acesso"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Administrador'}
            </button>

            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full flex items-center justify-center text-gray-600 hover:text-gray-900 text-sm py-2"
            >
              <ArrowLeft size={16} className="mr-2" />
              Voltar ao login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminCadastro;

import React, { useState } from 'react';
import { Eye, EyeOff, Building2, ArrowLeft } from 'lucide-react';
import { auth, supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

const AdminSignUp = ({ onBackToLogin }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validações
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // 2. Verificar se é o primeiro admin e criar registro
      if (authData.user) {
        // Verificar se já existe algum admin
        const { data: existingAdmins } = await supabase
          .from('administradores')
          .select('id')
          .eq('ativo', true);

        const isFirstAdmin = !existingAdmins || existingAdmins.length === 0;

        const { error: adminError } = await supabase
          .from('administradores')
          .insert({
            user_id: authData.user.id,
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            nivel_acesso: isFirstAdmin ? 'super_admin' : 'admin', // Primeiro é super_admin
            ativo: true
          });

        if (adminError) {
          console.error('Erro ao criar registro de admin:', adminError);
          setError(`Erro ao configurar permissões administrativas: ${adminError.message}`);
          setLoading(false);
          return;
        }

        // Sucesso - voltar para login
        showSuccess(`Conta administrativa criada com sucesso! ${isFirstAdmin ? 'Você é o Super Administrador.' : ''} Faça login para acessar o sistema.`);
        onBackToLogin();
      }

    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="mx-auto max-w-sm">
          <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 bg-orange-500 rounded-2xl flex items-center justify-center mb-4">
              <Building2 size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Gestão Administrativa
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Crie sua conta de administrador para gerenciar seu estabelecimento
            </p>
          </div>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-orange-500 rounded-full mr-3"></div>
              <span>Controle total dos agendamentos</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 bg-orange-500 rounded-full mr-3"></div>
              <span>Gestão de profissionais e unidades</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 bg-orange-500 rounded-full mr-3"></div>
              <span>Relatórios e análises</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - SignUp Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center lg:hidden mb-8">
            <div className="mx-auto h-16 w-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-4">
              <Building2 size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Gestão</h2>
          </div>

          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Criar Conta Administrativa
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Configure sua conta para gerenciar o estabelecimento
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="nome" className="block text-sm font-medium leading-6 text-gray-900">
                Nome Completo
              </label>
              <div className="mt-2">
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                Email Administrativo
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6"
                  placeholder="admin@seuestablecimento.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="telefone" className="block text-sm font-medium leading-6 text-gray-900">
                Telefone
              </label>
              <div className="mt-2">
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                Senha
              </label>
              <div className="mt-2 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-0 py-3 px-4 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye size={20} className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900">
                Confirmar Senha
              </label>
              <div className="mt-2 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-0 py-3 px-4 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6"
                  placeholder="Repita a senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye size={20} className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-orange-500 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Criando conta...' : 'Criar Conta Administrativa'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={onBackToLogin}
                className="flex items-center justify-center w-full text-gray-600 hover:text-gray-900 text-sm"
              >
                <ArrowLeft size={16} className="mr-2" />
                Voltar ao login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSignUp;

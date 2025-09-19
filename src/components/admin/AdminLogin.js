import React, { useState } from 'react';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { auth, supabase } from '../../lib/supabase';
const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
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

    try {
      console.log('Tentando login com:', formData.email);
      
      // Verificar credenciais na tabela admin_usuarios
      const { data: adminData, error: adminError } = await supabase
        .from('admin_usuarios')
        .select('*')
        .eq('email', formData.email)
        .eq('senha', formData.password)
        .eq('ativo', true)
        .single();

      console.log('Resultado admin login:', adminData, adminError);

      if (adminError || !adminData) {
        setError(`Email ou senha incorretos, ou acesso não autorizado. (${adminError?.message || 'Usuário não encontrado'})`);
        setLoading(false);
        return;
      }

      // Sucesso - login administrativo válido
      // Armazenar dados do admin no localStorage para manter sessão
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('adminData', JSON.stringify(adminData));
      
      // Forçar recarregamento do AdminApp
      window.location.reload();
      
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
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
              Gestão
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Sistema completo de gerenciamento para estabelecimentos
            </p>
          </div>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-orange-500 rounded-full mr-3"></div>
              <span>Gerencie agendamentos</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 bg-orange-500 rounded-full mr-3"></div>
              <span>Controle de profissionais</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 bg-orange-500 rounded-full mr-3"></div>
              <span>Configuração de serviços</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 bg-orange-500 rounded-full mr-3"></div>
              <span>Relatórios completos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center lg:hidden mb-8">
            <div className="mx-auto h-16 w-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-4">
              <Building2 size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Gestão</h2>
          </div>

          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Acesse sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Entre com suas credenciais para gerenciar o estabelecimento
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
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                Email
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
                  placeholder="seu@email.com"
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
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-lg border-0 py-3 px-4 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm sm:leading-6"
                  placeholder="Sua senha"
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
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-orange-500 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>



            <div className="text-center pt-4 border-t border-gray-200">
              <a
                href="/"
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                ← Voltar para área do cliente
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, X } from 'lucide-react';
import { auth } from '../lib/supabase';

const LoginScreen = ({ onLogin, onShowSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // MODO DEMO - Remove quando Supabase estiver funcionando
      if (email && password) {
        onLogin({ 
          id: '1', 
          email: email, 
          name: email.split('@')[0] 
        });
        return;
      }
      
      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        setError(error.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos' 
          : 'Erro ao fazer login. Tente novamente.');
      } else if (data.user) {
        onLogin(data.user);
      }
    } catch (err) {
      // MODO DEMO - Funciona offline
      onLogin({ 
        id: '1', 
        email: email, 
        name: email.split('@')[0] 
      });
      console.error('Login error (using demo mode):', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80)'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>
      
      {/* Close Button */}
      <button className="absolute top-6 right-6 z-10 text-white hover:text-gray-300 transition-colors">
        <X size={24} />
      </button>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center px-6">
        <div className="max-w-sm mx-auto w-full">
          
          {/* Logo */}
          <div className="text-center mb-12">
            {/* Hat Icon */}
            <div className="flex justify-center mb-4">
              <svg width="80" height="60" viewBox="0 0 80 60" fill="none" className="text-white">
                <ellipse cx="40" cy="45" rx="35" ry="8" fill="currentColor" opacity="0.3"/>
                <ellipse cx="40" cy="25" rx="25" ry="15" fill="currentColor"/>
                <rect x="15" y="20" width="50" height="8" rx="4" fill="currentColor"/>
                <rect x="35" y="15" width="10" height="3" rx="1.5" fill="currentColor" opacity="0.7"/>
              </svg>
            </div>
            
            {/* Brand */}
            <div className="mb-2">
              <div className="bg-white bg-opacity-20 px-4 py-1 rounded-full inline-block mb-3">
                <span className="text-white text-sm font-medium tracking-wider">BARBEARIA</span>
              </div>
            </div>
            <h1 className="text-white text-3xl font-bold mb-3">BARBER STYLE</h1>
            
            {/* Mustache */}
            <div className="flex justify-center mb-8">
              <svg width="60" height="20" viewBox="0 0 60 20" fill="none" className="text-white">
                <path d="M5 10C5 5 10 2 15 5C20 8 20 12 25 10C30 8 30 8 35 10C40 12 40 8 45 5C50 2 55 5 55 10C55 15 50 18 45 15C40 12 35 15 30 15C25 15 20 12 15 15C10 18 5 15 5 10Z" fill="currentColor"/>
              </svg>
            </div>
            
            <h2 className="text-white text-2xl font-semibold">Acesse sua conta</h2>
            <div className="w-12 h-0.5 bg-white mx-auto mt-3"></div>
          </div>
        
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <User size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="E-mail ou telefone"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black bg-opacity-40 border border-gray-600 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-white focus:bg-opacity-60 transition-all"
              />
            </div>
            
            {/* Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock size={20} className="text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black bg-opacity-40 border border-gray-600 rounded-xl py-4 pl-12 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-white focus:bg-opacity-60 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-xl p-3 text-red-200 text-sm text-center">
                {error}
              </div>
            )}
            
            {/* Login Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-4 rounded-xl font-semibold hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                {loading ? 'Entrando...' : 'Login'}
              </button>
            </div>
          </form>
          
          {/* Links */}
          <div className="text-center mt-8 space-y-6">
            <button className="text-white text-base hover:text-gray-300 transition-colors">
              Esqueceu a senha?
            </button>
            
            <div className="text-white text-base">
              Não possui conta? <button onClick={onShowSignUp} className="underline hover:text-gray-300 transition-colors">Faça seu cadastro</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

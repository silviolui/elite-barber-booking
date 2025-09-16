import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin({ email, password });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="pt-16 pb-8 px-6">
        <div className="text-center">
          {/* Simple Logo */}
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
            </svg>
          </div>
          
          <h1 className="text-gray-900 text-3xl font-bold mb-2">BookIA</h1>
          <p className="text-gray-500 text-base">Agendamento Inteligente</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 px-6">
        <div className="max-w-sm mx-auto">
          <h2 className="text-gray-900 text-2xl font-bold mb-8 text-center">Entre na sua conta</h2>
        
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-gray-700 text-sm font-medium">E-mail ou telefone</label>
              <input
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-colors"
              />
            </div>
            
            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-gray-700 text-sm font-medium">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-primary text-white py-4 rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-sm"
            >
              Entrar
            </button>
          </form>
          
          {/* Links */}
          <div className="text-center mt-8 space-y-4">
            <button className="text-primary text-sm font-medium hover:text-orange-600 transition-colors">
              Esqueceu a senha?
            </button>
            
            <div className="text-sm text-gray-600">
              Não possui conta? <button className="text-primary font-medium hover:text-orange-600 transition-colors">Criar conta</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

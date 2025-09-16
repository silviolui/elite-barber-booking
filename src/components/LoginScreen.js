import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

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
    <div className="min-h-screen relative bg-secondary">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-orange-600 opacity-10" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo BookIA Style */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
            </svg>
          </div>
          
          <h1 className="text-gray-900 text-3xl font-bold mb-2">BookIA</h1>
          <p className="text-gray-600 text-lg">Agendamento Inteligente</p>
        </div>
        
        <h2 className="text-gray-700 text-xl font-light mb-8">Entre na sua conta</h2>
        
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          {/* Email Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              type="email"
              placeholder="E-mail ou telefone"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-4 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 shadow-sm"
            />
          </div>
          
          {/* Password Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-4 pl-12 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-primary text-white py-4 rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-lg"
          >
            Entrar
          </button>
        </form>
        
        {/* Forgot Password */}
        <button className="text-primary text-sm mt-6 underline hover:text-orange-600">
          Esqueceu a senha?
        </button>
        
        {/* Register */}
        <button className="text-gray-600 text-sm mt-4">
          Não possui conta? <span className="text-primary underline">Criar conta</span>
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;

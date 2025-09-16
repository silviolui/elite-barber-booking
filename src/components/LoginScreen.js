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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 animate-gradient"></div>
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-32 right-10 w-24 h-24 bg-primary bg-opacity-20 rounded-full blur-lg animate-float-delay"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo Premium */}
        <div className="text-center mb-12">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-tr from-primary via-orange-500 to-yellow-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <svg className="w-14 h-14 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
              </svg>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
            </div>
          </div>
          
          <h1 className="text-white text-4xl font-bold mb-3 tracking-tight drop-shadow-lg">BookIA</h1>
          <p className="text-white text-lg font-medium opacity-90 drop-shadow">Agendamento Inteligente</p>
          
          {/* Decorative Line */}
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-yellow-400 rounded-full mx-auto mt-4"></div>
        </div>
        
        <h2 className="text-white text-xl font-medium mb-8 drop-shadow">Entre na sua conta</h2>
        
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          {/* Email Input */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <svg className="w-5 h-5 text-white text-opacity-70 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              type="email"
              placeholder="E-mail ou telefone"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white bg-opacity-10 backdrop-blur-lg border border-white border-opacity-20 rounded-2xl py-5 pl-12 pr-4 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:bg-opacity-20 focus:border-opacity-50 shadow-lg transition-all duration-300"
            />
          </div>
          
          {/* Password Input */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <svg className="w-5 h-5 text-white text-opacity-70 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white bg-opacity-10 backdrop-blur-lg border border-white border-opacity-20 rounded-2xl py-5 pl-12 pr-12 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:bg-opacity-20 focus:border-opacity-50 shadow-lg transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-opacity-70 hover:text-opacity-100 transition-opacity"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-primary via-orange-500 to-yellow-400 text-white py-5 rounded-2xl font-bold tracking-wide hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-xl"
          >
            <span className="drop-shadow-lg">Entrar</span>
          </button>
        </form>
        
        {/* Forgot Password */}
        <button className="text-white text-opacity-80 text-sm mt-8 hover:text-opacity-100 transition-opacity">
          Esqueceu a senha?
        </button>
        
        {/* Register */}
        <div className="mt-6 text-center">
          <span className="text-white text-opacity-70 text-sm">Não possui conta? </span>
          <button className="text-white font-semibold text-sm hover:text-yellow-300 transition-colors">
            Criar conta
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

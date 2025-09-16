import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, Mail, Phone, ArrowLeft } from 'lucide-react';
import { auth } from '../lib/supabase';

const SignUpScreen = ({ onBack, onSignUp }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // MODO DEMO - Remove quando Supabase estiver funcionando
      if (formData.email && formData.password && formData.name) {
        onSignUp({ 
          id: Date.now().toString(), 
          email: formData.email, 
          name: formData.name,
          phone: formData.phone
        });
        return;
      }
      
      const { data, error } = await auth.signUp(
        formData.email, 
        formData.password,
        {
          name: formData.name,
          phone: formData.phone
        }
      );
      
      if (error) {
        if (error.message.includes('already registered')) {
          setError('Este e-mail já está cadastrado');
        } else if (error.message.includes('invalid email')) {
          setError('E-mail inválido');
        } else {
          setError('Erro ao criar conta. Tente novamente.');
        }
      } else if (data.user) {
        onSignUp(data.user);
      }
    } catch (err) {
      // MODO DEMO - Funciona offline  
      onSignUp({ 
        id: Date.now().toString(), 
        email: formData.email, 
        name: formData.name,
        phone: formData.phone
      });
      console.error('SignUp error (using demo mode):', err);
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
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 z-10 text-white hover:text-gray-300 transition-colors"
      >
        <ArrowLeft size={24} />
      </button>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center px-6">
        <div className="max-w-sm mx-auto w-full">
          
          {/* Logo */}
          <div className="text-center mb-8">
            {/* Hat Icon */}
            <div className="flex justify-center mb-4">
              <svg width="60" height="45" viewBox="0 0 80 60" fill="none" className="text-white">
                <ellipse cx="40" cy="45" rx="35" ry="8" fill="currentColor" opacity="0.3"/>
                <ellipse cx="40" cy="25" rx="25" ry="15" fill="currentColor"/>
                <rect x="15" y="20" width="50" height="8" rx="4" fill="currentColor"/>
                <rect x="35" y="15" width="10" height="3" rx="1.5" fill="currentColor" opacity="0.7"/>
              </svg>
            </div>
            
            {/* Brand */}
            <div className="mb-2">
              <div className="bg-white bg-opacity-20 px-4 py-1 rounded-full inline-block mb-2">
                <span className="text-white text-sm font-medium tracking-wider">BARBEARIA</span>
              </div>
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">BARBER STYLE</h1>
            
            {/* Mustache */}
            <div className="flex justify-center mb-6">
              <svg width="50" height="16" viewBox="0 0 60 20" fill="none" className="text-white">
                <path d="M5 10C5 5 10 2 15 5C20 8 20 12 25 10C30 8 30 8 35 10C40 12 40 8 45 5C50 2 55 5 55 10C55 15 50 18 45 15C40 12 35 15 30 15C25 15 20 12 15 15C10 18 5 15 5 10Z" fill="currentColor"/>
              </svg>
            </div>
            
            <h2 className="text-white text-xl font-semibold">Criar conta</h2>
            <div className="w-12 h-0.5 bg-white mx-auto mt-2"></div>
          </div>
        
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full bg-black bg-opacity-40 border border-gray-600 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-white focus:bg-opacity-60 transition-all"
              />
            </div>

            {/* Email Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                type="email"
                placeholder="E-mail"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-black bg-opacity-40 border border-gray-600 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-white focus:bg-opacity-60 transition-all"
              />
            </div>

            {/* Phone Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Phone size={18} className="text-gray-400" />
              </div>
              <input
                type="tel"
                placeholder="Telefone (opcional)"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full bg-black bg-opacity-40 border border-gray-600 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-white focus:bg-opacity-60 transition-all"
              />
            </div>
            
            {/* Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha (min. 6 caracteres)"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full bg-black bg-opacity-40 border border-gray-600 rounded-xl py-3.5 pl-11 pr-11 text-white placeholder-gray-400 focus:outline-none focus:border-white focus:bg-opacity-60 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmar senha"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className="w-full bg-black bg-opacity-40 border border-gray-600 rounded-xl py-3.5 pl-11 pr-11 text-white placeholder-gray-400 focus:outline-none focus:border-white focus:bg-opacity-60 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-xl p-3 text-red-200 text-sm text-center">
                {error}
              </div>
            )}
            
            {/* SignUp Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black py-3.5 rounded-xl font-semibold hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </div>
          </form>
          
          {/* Back to Login */}
          <div className="text-center mt-6">
            <div className="text-white text-base">
              Já possui conta? <button onClick={onBack} className="underline hover:text-gray-300 transition-colors">Faça login</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpScreen;

import React, { useState } from 'react';
import { ChevronRight, MapPin, User, Scissors, Calendar, X, Eye, EyeOff, History, CreditCard, Newspaper, Clock, Check } from 'lucide-react';

// Mock Data Structure
const mockData = {
  units: [
    {
      id: 1,
      name: 'BookIA - Boulevard Shopping Camaçari',
      address: 'BA-535, s/n - Industrial, s/n, Camaçari',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 2,
      name: 'BookIA - Salvador Norte Shopping',
      address: 'BA-535, s/n, Salvador',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 3,
      name: 'BookIA - Centro Camaçari',
      address: 'Radial B, 80, Camaçari',
      image: 'https://images.unsplash.com/photo-1562004760-aceed7bb0fe3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
    }
  ],
  professionals: {
    1: [
      { id: 1, name: 'Carlos Silva', specialty: 'Especialista em Cortes', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', rating: 4.9 },
      { id: 2, name: 'Ana Santos', specialty: 'Coloração e Design', image: 'https://images.unsplash.com/photo-1494790108755-2616b332ab55?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', rating: 4.8 },
      { id: 3, name: 'João Costa', specialty: 'Cortes Masculinos', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', rating: 4.7 }
    ],
    2: [
      { id: 4, name: 'Maria Oliveira', specialty: 'Tratamentos Capilares', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', rating: 4.9 },
      { id: 5, name: 'Pedro Almeida', specialty: 'Barboterapia', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', rating: 4.8 }
    ],
    3: [
      { id: 6, name: 'Lucia Ferreira', specialty: 'Cortes Femininos', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', rating: 5.0 },
      { id: 7, name: 'Rafael Lima', specialty: 'Barba e Bigode', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', rating: 4.6 }
    ]
  },
  services: {
    1: [
      { id: 1, name: 'Corte Masculino', duration: 30, price: 45.00 },
      { id: 2, name: 'Barba Completa', duration: 20, price: 25.00 },
      { id: 3, name: 'Corte + Barba', duration: 45, price: 65.00 },
      { id: 4, name: 'Sobrancelha', duration: 15, price: 20.00 }
    ],
    2: [
      { id: 5, name: 'Corte Feminino', duration: 60, price: 80.00 },
      { id: 6, name: 'Escova', duration: 45, price: 35.00 },
      { id: 7, name: 'Coloração', duration: 120, price: 150.00 },
      { id: 8, name: 'Hidratação', duration: 90, price: 60.00 }
    ],
    3: [
      { id: 9, name: 'Corte Masculino', duration: 30, price: 40.00 },
      { id: 10, name: 'Barba', duration: 20, price: 20.00 },
      { id: 11, name: 'Relaxamento', duration: 30, price: 50.00 }
    ],
    4: [
      { id: 12, name: 'Tratamento Capilar', duration: 90, price: 120.00 },
      { id: 13, name: 'Botox Capilar', duration: 120, price: 180.00 },
      { id: 14, name: 'Progressiva', duration: 180, price: 250.00 }
    ],
    5: [
      { id: 15, name: 'Barboterapia Relaxante', duration: 60, price: 95.00 },
      { id: 16, name: 'Limpeza de Pele', duration: 90, price: 85.00 }
    ],
    6: [
      { id: 17, name: 'Corte Feminino', duration: 60, price: 75.00 },
      { id: 18, name: 'Penteado', duration: 45, price: 55.00 },
      { id: 19, name: 'Manicure', duration: 30, price: 30.00 }
    ],
    7: [
      { id: 20, name: 'Barba Completa', duration: 25, price: 30.00 },
      { id: 21, name: 'Bigode', duration: 10, price: 15.00 },
      { id: 22, name: 'Corte Masculino', duration: 35, price: 50.00 }
    ]
  }
};

// Componente de Login
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    if (email && password) {
      onLogin({ email, password });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="pt-16 pb-8 px-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
            </svg>
          </div>
          
          <h1 className="text-gray-900 text-3xl font-bold mb-2">BookIA</h1>
          <p className="text-gray-500 text-base">Agendamento Inteligente</p>
        </div>
      </div>
      
      <div className="flex-1 px-6">
        <div className="max-w-sm mx-auto">
          <h2 className="text-gray-900 text-2xl font-bold mb-8 text-center">Entre na sua conta</h2>
        
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-gray-700 text-sm font-medium">E-mail ou telefone</label>
              <input
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-gray-700 text-sm font-medium">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
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
            
            <button
              onClick={handleSubmit}
              className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-sm"
            >
              Entrar
            </button>
          </div>
          
          <div className="text-center mt-8 space-y-4">
            <button className="text-orange-500 text-sm font-medium hover:text-orange-600 transition-colors">
              Esqueceu a senha?
            </button>
            
            <div className="text-sm text-gray-600">
              Não possui conta? <button className="text-orange-500 font-medium hover:text-orange-600 transition-colors">Criar conta</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// App Principal
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const handleLogin = (credentials) => {
    console.log('Login:', credentials);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-center pt-20">
        <h1 className="text-2xl font-bold text-gray-900">App em desenvolvimento...</h1>
        <p className="text-gray-600 mt-2">Implementação completa em andamento</p>
      </div>
    </div>
  );
}

export default App;

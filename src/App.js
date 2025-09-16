import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import BookingHome from './components/BookingHome';
import BottomNavigation from './components/BottomNavigation';
import SelectUnit from './components/SelectUnit';
import SelectProfessional from './components/SelectProfessional';
import SelectServices from './components/SelectServices';
import SelectDateTime from './components/SelectDateTime';

// Mock Data - mova depois para um arquivo separado
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

// Placeholder para outras telas
const PlaceholderScreen = ({ title }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
    <div className="text-center">
      <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-3 text-gray-900">{title}</h2>
      <p className="text-lg text-gray-500">Em desenvolvimento...</p>
    </div>
  </div>
);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('agenda');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selections, setSelections] = useState({
    unit: null,
    professional: null,
    services: [],
    date: null,
    time: null
  });

  const handleLogin = (credentials) => {
    console.log('Login:', credentials);
    setIsLoggedIn(true);
  };

  const handleStepClick = (step) => {
    setCurrentScreen(step);
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentScreen('home');
  };

  const handleSelectUnit = (unit) => {
    setSelections(prev => ({
      ...prev,
      unit,
      professional: null,
      services: [],
      date: null,
      time: null
    }));
  };

  const handleSelectProfessional = (professional) => {
    setSelections(prev => ({
      ...prev,
      professional,
      services: [],
      date: null,
      time: null
    }));
  };

  const handleSelectServices = (services) => {
    setSelections(prev => ({
      ...prev,
      services,
      date: null,
      time: null
    }));
  };

  const handleSelectDateTime = (date, time) => {
    setSelections(prev => ({
      ...prev,
      date,
      time
    }));
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderMainContent = () => {
    if (activeTab !== 'agenda') {
      switch (activeTab) {
        case 'historico':
          return <PlaceholderScreen title="Histórico" />;
        case 'assinatura':
          return <PlaceholderScreen title="Assinatura" />;
        case 'feed':
          return <PlaceholderScreen title="Feed" />;
        case 'perfil':
          return <PlaceholderScreen title="Perfil" />;
        default:
          return <BookingHome onNext={handleStepClick} selections={selections} />;
      }
    }

    // Telas do agendamento
    switch (currentScreen) {
      case 'home':
        return <BookingHome onNext={handleStepClick} selections={selections} />;
      case 'unidade':
        return (
          <SelectUnit
            onClose={handleBackToHome}
            onSelect={handleSelectUnit}
            currentSelection={selections.unit}
            units={mockData.units}
          />
        );
      case 'barbeiro':
      case 'profissional':
        return (
          <SelectProfessional
            onClose={handleBackToHome}
            onSelect={handleSelectProfessional}
            unitId={selections.unit?.id}
            currentSelection={selections.professional}
            professionals={mockData.professionals}
          />
        );
      case 'servico':
        return (
          <SelectServices
            onClose={handleBackToHome}
            onSelect={handleSelectServices}
            professionalId={selections.professional?.id}
            selectedServices={selections.services}
            services={mockData.services}
          />
        );
      case 'data':
        return (
          <SelectDateTime
            onClose={handleBackToHome}
            onSelect={handleSelectDateTime}
            professionalId={selections.professional?.id}
            currentDate={selections.date}
            currentTime={selections.time}
          />
        );
      default:
        return <BookingHome onNext={handleStepClick} selections={selections} />;
    }
  };

  const showBottomNav = currentScreen === 'home' || activeTab !== 'agenda';

  return (
    <div className="relative">
      {renderMainContent()}
      {showBottomNav && (
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
}

export default App;
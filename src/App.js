import React, { useState, useEffect } from 'react';
import { auth, supabase } from './lib/supabase';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';
import BookingHome from './components/BookingHome';
import BottomNavigation from './components/BottomNavigation';
import SelectUnit from './components/SelectUnit';
import SelectProfessional from './components/SelectProfessional';
import SelectServices from './components/SelectServices';
import SelectDateTime from './components/SelectDateTime';
import Historico from './components/Historico';
import AdminApp from './AdminApp';
import { ToastProvider } from './contexts/ToastContext';

// Mock Data - dados para funcionar
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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);
  const [activeTab, setActiveTab] = useState('agenda');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [selections, setSelections] = useState({
    unit: null,
    professional: null,
    services: [],
    date: null,
    time: null
  });

  // Verificar se está no modo admin baseado na URL
  useEffect(() => {
    const checkAdminMode = () => {
      const isAdmin = window.location.hash === '#admin' || window.location.pathname === '/admin';
      setIsAdminMode(isAdmin);
    };

    // Verificar na inicialização
    checkAdminMode();

    // Escutar mudanças na URL
    const handleHashChange = () => {
      checkAdminMode();
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);
  const [skipUnidadeSelection, setSkipUnidadeSelection] = useState(true); // INICIAR COMO TRUE para ocultar por padrão
  const [unidadesLoading, setUnidadesLoading] = useState(true);

  // Verificar sessão existente ao carregar app
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await auth.getSession();
        if (session?.user) {
          setIsLoggedIn(true);
          setCurrentUser(session.user);
          console.log('Usuário já logado:', session.user.email);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Verificar unidades ativas e auto-selecionar se houver apenas 1
    const verificarUnidades = async () => {
      try {
        const { data } = await supabase.from('unidades').select('*').eq('ativo', true);
        
        if (data && data.length > 0) {
          if (data.length === 1) {
            // Apenas 1 unidade ativa = auto-selecionar
            setSelections(prev => ({ ...prev, unit: data[0] }));
            setSkipUnidadeSelection(true);
            console.log('✅ Auto-selecionado unidade única:', data[0].nome);
          } else {
            // 2+ unidades = mostrar seleção
            setSkipUnidadeSelection(false);
            console.log(`📍 ${data.length} unidades ativas - mostrar seleção`);
          }
        }
        setUnidadesLoading(false); // Terminou de verificar
      } catch (error) {
        console.error('Erro ao verificar unidades:', error);
        setUnidadesLoading(false); // Terminou mesmo com erro
      }
    };

    verificarUnidades();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setCurrentUser(session.user);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Removido todo o useEffect e loadClientData que causava loop infinito

  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    setShowSignUp(false);
  };

  const handleSignUp = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    setShowSignUp(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsLoggedIn(false);
      setCurrentUser(null);
      setActiveTab('agenda');
      setCurrentScreen('home');
      // Limpar seleções
      setSelections({
        unit: null,
        professional: null,
        services: [],
        date: null,
        time: null
      });
      console.log('Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleShowSignUp = () => {
    setShowSignUp(true);
  };

  const handleBackToLogin = () => {
    setShowSignUp(false);
  };

  // const handleLogout = async () => {
  //   await auth.signOut();
  //   setUser(null);
  // };

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

  // Função para o cliente finalizar agendamento (será usada nos componentes)
  // const handleConfirmBooking = async () => {
  //   if (!user || !selections.unit || !selections.professional || !selections.services.length || !selections.date || !selections.time) {
  //     alert('Por favor, complete todas as etapas do agendamento');
  //     return;
  //   }

  //   const agendamentoData = {
  //     unidadeId: selections.unit.id,
  //     profissionalId: selections.professional.id,
  //     data: selections.date,
  //     horarioInicio: selections.time,
  //     horarioFim: selections.time, // Calcular baseado na duração dos serviços
  //     precoTotal: selections.services.reduce((total, service) => total + service.preco, 0),
  //     servicos: selections.services,
  //     observacoes: `Agendamento do cliente: ${user.name || user.email}`
  //   };

  //   try {
  //     const result = await supabaseData.criarAgendamento(user.id, agendamentoData);
  //     if (result.success) {
  //       alert('Agendamento criado com sucesso!');
  //       await loadClientData(user.id);
  //       setCurrentScreen('home');
  //       setSelections({
  //         unit: null,
  //         professional: null,
  //         services: [],
  //         date: null,
  //         time: null
  //       });
  //     } else {
  //       alert('Erro ao criar agendamento: ' + result.error);
  //     }
  //   } catch (error) {
  //     alert('Erro ao criar agendamento');
  //     console.error('Booking error:', error);
  //   }
  // };

  // Se está no modo admin, renderizar AdminApp
  if (isAdminMode) {
    return (
      <ToastProvider>
        <AdminApp />
      </ToastProvider>
    );
  }

  // Loading state para verificação de sessão
  if (loading) {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando sessão...</p>
          </div>
        </div>
      </ToastProvider>
    );
  }

  // Show login/signup screen if not authenticated (App Cliente)
  if (!isLoggedIn) {
    if (showSignUp) {
      return (
        <ToastProvider>
          <SignUpScreen 
            onSignUp={handleSignUp}
            onBack={handleBackToLogin}
          />
        </ToastProvider>
      );
    }
    return (
      <ToastProvider>
        <LoginScreen 
          onLogin={handleLogin} 
          onShowSignUp={handleShowSignUp}
        />
      </ToastProvider>
    );
  }

  const renderMainContent = () => {
    if (activeTab !== 'agenda') {
      switch (activeTab) {
        case 'historico':
          console.log('App.js - currentUser para Historico:', currentUser);
          console.log('App.js - usuarioId para Historico:', currentUser?.id);
          return <Historico usuarioId={currentUser?.id} />;
        case 'assinatura':
          return <PlaceholderScreen title="Assinatura" />;
        case 'feed':
          return <PlaceholderScreen title="Feed" />;
        case 'perfil':
          return <PlaceholderScreen title="Perfil" />;
        default:
          return (
            <BookingHome 
              onNext={handleStepClick} 
              selections={selections}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          );
      }
    }

    // Telas do agendamento
    switch (currentScreen) {
      case 'home':
        return (
          <BookingHome 
            onNext={handleStepClick} 
            selections={selections}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
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
            unitId={selections.unit?.id}
            currentDate={selections.date}
            currentTime={selections.time}
            servicosSelecionados={selections.services}
          />
        );
      default:
        return <BookingHome onNext={handleStepClick} selections={selections} skipUnidadeSelection={skipUnidadeSelection} unidadesLoading={unidadesLoading} />;
    }
  };

  const showBottomNav = currentScreen === 'home' || activeTab !== 'agenda';

  return (
    <ToastProvider>
      <div className="relative">
        {renderMainContent()}
        {showBottomNav && (
          <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </div>
    </ToastProvider>
  );
}

export default App;
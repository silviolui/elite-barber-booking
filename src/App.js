import React, { useState, useEffect } from 'react';
import { auth } from './lib/supabase';
import { supabaseData } from './lib/supabaseData';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';
import BookingHome from './components/BookingHome';
import BottomNavigation from './components/BottomNavigation';
import SelectUnit from './components/SelectUnit';
import SelectProfessional from './components/SelectProfessional';
import SelectServices from './components/SelectServices';
import SelectDateTime from './components/SelectDateTime';

// Mock data removido - agora usando dados reais do Supabase

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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);
  const [activeTab, setActiveTab] = useState('agenda');
  const [currentScreen, setCurrentScreen] = useState('home');
  
  // Dados reais do Supabase
  const [unidades, setUnidades] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  
  // Seleções do usuário no fluxo de agendamento
  const [selections, setSelections] = useState({
    unit: null,
    professional: null,
    services: [],
    date: null,
    time: null
  });

  // Função para carregar todos os dados do usuário
  const loadUserData = async (userId) => {
    try {
      // Carregar unidades disponíveis
      const unidadesData = await supabaseData.getUnidades();
      setUnidades(unidadesData);
      
      // Carregar agendamentos do usuário
      const agendamentosData = await supabaseData.getAgendamentosUsuario(userId);
      setAgendamentos(agendamentosData);
      
      console.log(`Dados carregados para usuário ${userId}:`, {
        unidades: unidadesData.length,
        agendamentos: agendamentosData.length
      });
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    const getSession = async () => {
      const { data: { session } } = await auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadUserData(session.user.id);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadUserData(session.user.id);
      } else {
        setUser(null);
        // Limpar dados quando usuário sai
        setUnidades([]);
        setProfissionais([]);
        setServicos([]);
        setAgendamentos([]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (user) => {
    setUser(user);
    setShowSignUp(false);
    
    // Carregar dados do usuário quando faz login
    await loadUserData(user.id);
  };

  const handleSignUp = (user) => {
    setUser(user);
    setShowSignUp(false);
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

  const handleSelectUnit = async (unit) => {
    setSelections(prev => ({
      ...prev,
      unit,
      professional: null,
      services: [],
      date: null,
      time: null
    }));
    
    // Carregar profissionais da unidade selecionada
    const profissionaisData = await supabaseData.getProfissionais(unit.id);
    setProfissionais(profissionaisData);
  };

  const handleSelectProfessional = async (professional) => {
    setSelections(prev => ({
      ...prev,
      professional,
      services: [],
      date: null,
      time: null
    }));
    
    // Carregar serviços do profissional selecionado
    const servicosData = await supabaseData.getServicos(professional.id);
    setServicos(servicosData);
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show login/signup screen if not authenticated
  if (!user) {
    if (showSignUp) {
      return (
        <SignUpScreen 
          onSignUp={handleSignUp}
          onBack={handleBackToLogin}
        />
      );
    }
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        onShowSignUp={handleShowSignUp}
      />
    );
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
        return (
          <BookingHome 
            onNext={handleStepClick} 
            selections={selections}
            user={user}
            agendamentos={agendamentos}
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
            user={user}
            agendamentos={agendamentos}
          />
        );
      case 'unidade':
        return (
          <SelectUnit
            onClose={handleBackToHome}
            onSelect={handleSelectUnit}
            currentSelection={selections.unit}
            units={unidades}
            user={user}
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
            professionals={profissionais}
            user={user}
          />
        );
      case 'servico':
        return (
          <SelectServices
            onClose={handleBackToHome}
            onSelect={handleSelectServices}
            professionalId={selections.professional?.id}
            selectedServices={selections.services}
            services={servicos}
            user={user}
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
            user={user}
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
import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import BookingHome from './components/BookingHome';
import SelectUnit from './components/SelectUnit';
import BottomNavigation from './components/BottomNavigation';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [activeTab, setActiveTab] = useState('agenda');
  const [showModal, setShowModal] = useState(null);
  const [bookingData, setBookingData] = useState({
    unit: null,
    barber: null,
    services: [],
    date: null,
    time: null
  });

  const handleLogin = (credentials) => {
    console.log('Login:', credentials);
    setIsLoggedIn(true);
  };

  const handleStepSelect = (step) => {
    setShowModal(step);
  };

  const handleModalClose = () => {
    setShowModal(null);
  };

  const handleDataSelect = (type, data) => {
    setBookingData(prev => ({
      ...prev,
      [type]: data
    }));
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-black">
      {currentScreen === 'home' && activeTab === 'agenda' && (
        <BookingHome onNext={handleStepSelect} />
      )}
      
      {/* Other tabs content would go here */}
      {activeTab !== 'agenda' && (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-white text-xl">
            {activeTab === 'historico' && 'Histórico de Agendamentos'}
            {activeTab === 'assinatura' && 'Planos e Assinaturas'}
            {activeTab === 'feed' && 'Feed de Novidades'}
            {activeTab === 'perfil' && 'Meu Perfil'}
          </p>
        </div>
      )}

      {/* Modals */}
      {showModal === 'unidade' && (
        <SelectUnit
          onClose={handleModalClose}
          onSelect={(unit) => handleDataSelect('unit', unit)}
        />
      )}
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;

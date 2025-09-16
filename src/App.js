import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import BookingHome from './components/BookingHome';
import SelectUnit from './components/SelectUnit';
import BottomNavigation from './components/BottomNavigation';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
    const newBookingData = {
      ...bookingData,
      [type]: data
    };
    setBookingData(newBookingData);
    console.log('Booking data updated:', newBookingData); // Para desenvolvimento
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {activeTab === 'agenda' && (
        <BookingHome onNext={handleStepSelect} />
      )}
      
      {/* Other tabs content would go here */}
      {activeTab !== 'agenda' && (
        <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <p className="text-gray-900 text-lg font-medium">
              {activeTab === 'historico' && 'Histórico de Agendamentos'}
              {activeTab === 'assinatura' && 'Planos e Assinaturas'}
              {activeTab === 'feed' && 'Feed de Novidades'}
              {activeTab === 'perfil' && 'Meu Perfil'}
            </p>
            <p className="text-gray-500 text-sm mt-2">Em desenvolvimento</p>
          </div>
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

import React, { useState, useEffect } from 'react';
import { auth } from './lib/supabase';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminSidebar from './components/admin/AdminSidebar';

const AdminApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    // Verificar usuário logado
    const getUser = async () => {
      const { data: { session } } = await auth.getSession();
      setCurrentUser(session?.user || null);
      setLoading(false);
    };

    getUser();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    setCurrentUser(null);
    setActiveSection('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {getSectionTitle(activeSection)}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bem-vindo, {currentUser.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6">
          <AdminDashboard 
            activeSection={activeSection}
            currentUser={currentUser}
          />
        </main>
      </div>
    </div>
  );
};

const getSectionTitle = (section) => {
  const titles = {
    dashboard: 'Dashboard',
    agendamentos: 'Gerenciar Agendamentos',
    historico: 'Histórico',
    unidades: 'Gerenciar Unidades',
    profissionais: 'Gerenciar Profissionais',
    servicos: 'Gerenciar Serviços',
    horarios: 'Configurar Horários',
    relatorios: 'Relatórios'
  };
  return titles[section] || 'Gestão';
};

export default AdminApp;
